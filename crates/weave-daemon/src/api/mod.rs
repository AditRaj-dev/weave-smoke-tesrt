//! Private local JSON-RPC API for daemon-owned memory.
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{
    io,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
use uuid::Uuid;
use weave_store::{Store, StoreError};

const MAX_FRAME: usize = 1_048_576;

pub fn data_dir() -> io::Result<PathBuf> {
    if let Some(p) = std::env::var_os("WEAVE_DATA_DIR") {
        return Ok(PathBuf::from(p));
    }
    #[cfg(windows)]
    {
        Ok(PathBuf::from(
            std::env::var_os("LOCALAPPDATA").ok_or_else(|| {
                io::Error::new(io::ErrorKind::NotFound, "LOCALAPPDATA unavailable")
            })?,
        )
        .join("WEAVE"))
    }
    #[cfg(not(windows))]
    {
        Ok(std::env::var_os("XDG_DATA_HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".local/share")))
            .ok_or_else(|| {
                io::Error::new(io::ErrorKind::NotFound, "user data directory unavailable")
            })?
            .join("weave"))
    }
}
pub fn endpoint(dir: &Path) -> String {
    #[cfg(windows)]
    {
        let hash = hex::encode(Sha256::digest(dir.to_string_lossy().as_bytes()));
        format!(r"\\.\pipe\weave-memory-v1-{}", &hash[..20])
    }
    #[cfg(not(windows))]
    {
        dir.join("weave.sock").to_string_lossy().into_owned()
    }
}
fn auth_token(dir: &Path) -> io::Result<String> {
    std::fs::create_dir_all(dir)?;
    let path = dir.join("auth.token");
    match std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
    {
        Ok(mut f) => {
            use std::io::Write;
            let token = format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple());
            f.write_all(token.as_bytes())?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))?;
            }
            Ok(token)
        }
        Err(e) if e.kind() == io::ErrorKind::AlreadyExists => std::fs::read_to_string(path),
        Err(e) => Err(e),
    }
}
fn token_eq(a: &str, b: &str) -> bool {
    a.len() == b.len() && a.bytes().zip(b.bytes()).fold(0u8, |x, (y, z)| x | (y ^ z)) == 0
}
fn err(code: &'static str, message: &'static str) -> StoreError {
    StoreError {
        code,
        message,
        retryable: false,
    }
}
fn response(id: Value, result: Result<Value, StoreError>) -> Value {
    match result {
        Ok(data) => json!({"jsonrpc":"2.0","id":id,"result":data}),
        Err(e) => {
            json!({"jsonrpc":"2.0","id":id,"error":{"code":e.code,"message":e.message,"retryable":e.retryable,"details":{}}})
        }
    }
}

fn dispatch(store: &Mutex<Store>, token: &str, request: Value) -> Value {
    let id = request.get("id").cloned().unwrap_or(Value::Null);
    let result = (|| {
        if request.get("jsonrpc").and_then(Value::as_str) != Some("2.0") {
            return Err(err("INVALID_SCHEMA", "JSON-RPC 2.0 request required."));
        }
        let meta = request
            .get("meta")
            .ok_or_else(|| err("INVALID_SCHEMA", "Request metadata required."))?;
        if meta.get("api_version").and_then(Value::as_u64) != Some(1) {
            return Err(err(
                "INCOMPATIBLE_PROTOCOL",
                "WEAVE API version 1 required.",
            ));
        }
        if !meta
            .get("auth_token")
            .and_then(Value::as_str)
            .is_some_and(|x| token_eq(x, token))
        {
            return Err(err("ACCESS_DENIED", "Local IPC authentication failed."));
        }
        let method = request
            .get("method")
            .and_then(Value::as_str)
            .ok_or_else(|| err("INVALID_SCHEMA", "Method required."))?;
        let params = request.get("params").cloned().unwrap_or_else(|| json!({}));
        let mut guard = store
            .lock()
            .map_err(|_| err("STORE_ERROR", "Memory store lock failed."))?;
        match method {
            "health.get" => Ok(json!({"api_version":1,"status":"ready"})),
            "project.list" => guard.project_list(),
            "memory.query" => guard.query(&params),
            "project.create" | "memory.propose" | "memory.promote" | "memory.reject" => {
                let client = meta
                    .get("client_id")
                    .and_then(Value::as_str)
                    .ok_or_else(|| err("INVALID_SCHEMA", "Client ID required."))?;
                let key = meta
                    .get("idempotency_key")
                    .and_then(Value::as_str)
                    .ok_or_else(|| err("INVALID_SCHEMA", "Idempotency key required."))?;
                guard.mutate(method, &params, client, key)
            }
            _ => Err(err("NOT_IMPLEMENTED", "Method is not implemented.")),
        }
    })();
    response(id, result)
}

async fn send<S: AsyncWrite + Unpin>(stream: &mut S, value: &Value) -> io::Result<()> {
    let bytes = serde_json::to_vec(value).map_err(io::Error::other)?;
    if bytes.len() > MAX_FRAME {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "response too large",
        ));
    }
    stream.write_u32(bytes.len() as u32).await?;
    stream.write_all(&bytes).await?;
    stream.flush().await
}
async fn handle<S: AsyncRead + AsyncWrite + Unpin>(
    mut stream: S,
    store: Arc<Mutex<Store>>,
    token: Arc<String>,
) -> io::Result<()> {
    loop {
        let len = match stream.read_u32().await {
            Ok(x) => x as usize,
            Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(()),
            Err(e) => return Err(e),
        };
        if len == 0 || len > MAX_FRAME {
            send(&mut stream,&json!({"jsonrpc":"2.0","id":null,"error":{"code":"INVALID_SCHEMA","message":"Invalid IPC frame length.","retryable":false,"details":{}}})).await?;
            return Ok(());
        }
        let mut bytes = vec![0u8; len];
        stream.read_exact(&mut bytes).await?;
        let request = match serde_json::from_slice::<Value>(&bytes) {
            Ok(x) => x,
            Err(_) => {
                send(&mut stream,&json!({"jsonrpc":"2.0","id":null,"error":{"code":"INVALID_SCHEMA","message":"Invalid IPC JSON.","retryable":false,"details":{}}})).await?;
                continue;
            }
        };
        send(&mut stream, &dispatch(&store, &token, request)).await?;
    }
}
pub async fn serve() -> io::Result<()> {
    let dir = data_dir()?;
    let token = Arc::new(auth_token(&dir)?);
    let store = Arc::new(Mutex::new(
        Store::open(&dir.join("weave.sqlite3")).map_err(|e| io::Error::other(e.message))?,
    ));
    #[cfg(windows)]
    {
        serve_windows(&dir, store, token).await
    }
    #[cfg(not(windows))]
    {
        serve_unix(&dir, store, token).await
    }
}
#[cfg(not(windows))]
async fn serve_unix(dir: &Path, store: Arc<Mutex<Store>>, token: Arc<String>) -> io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    std::fs::create_dir_all(dir)?;
    std::fs::set_permissions(dir, std::fs::Permissions::from_mode(0o700))?;
    let path = dir.join("weave.sock");
    if path.exists() {
        std::fs::remove_file(&path)?;
    }
    let listener = tokio::net::UnixListener::bind(&path)?;
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))?;
    loop {
        let (stream, _) = listener.accept().await?;
        let s = Arc::clone(&store);
        let t = Arc::clone(&token);
        tokio::spawn(async move {
            let _ = handle(stream, s, t).await;
        });
    }
}
#[cfg(windows)]
async fn serve_windows(dir: &Path, store: Arc<Mutex<Store>>, token: Arc<String>) -> io::Result<()> {
    use tokio::net::windows::named_pipe::ServerOptions;
    use windows_sys::Win32::Foundation::LocalFree;
    use windows_sys::Win32::Security::Authorization::ConvertStringSecurityDescriptorToSecurityDescriptorW;
    use windows_sys::Win32::Security::{PSECURITY_DESCRIPTOR, SECURITY_ATTRIBUTES};
    let name = endpoint(dir);
    let sddl: Vec<u16> = "D:P(A;;GA;;;OW)(A;;GA;;;SY)\0".encode_utf16().collect();
    let mut descriptor: PSECURITY_DESCRIPTOR = std::ptr::null_mut();
    let ok = unsafe {
        ConvertStringSecurityDescriptorToSecurityDescriptorW(
            sddl.as_ptr(),
            1,
            &mut descriptor,
            std::ptr::null_mut(),
        )
    };
    if ok == 0 {
        return Err(io::Error::last_os_error());
    }
    let mut attrs = SECURITY_ATTRIBUTES {
        nLength: std::mem::size_of::<SECURITY_ATTRIBUTES>() as u32,
        lpSecurityDescriptor: descriptor as *mut _,
        bInheritHandle: 0,
    };
    let mut options = ServerOptions::new();
    options
        .reject_remote_clients(true)
        .first_pipe_instance(true);
    let first = unsafe {
        options.create_with_security_attributes_raw(&name, &mut attrs as *mut _ as *mut _)
    };
    if !descriptor.is_null() {
        unsafe {
            LocalFree(descriptor as _);
        }
    }
    let mut server = first?;
    options.first_pipe_instance(false);
    loop {
        server.connect().await?;
        let next = options.create(&name)?;
        let s = Arc::clone(&store);
        let t = Arc::clone(&token);
        tokio::spawn(async move {
            let _ = handle(server, s, t).await;
        });
        server = next;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_wrong_protocol_and_token() {
        let dir = std::env::temp_dir().join(format!("weave-api-test-{}", Uuid::new_v4()));
        let store = Mutex::new(Store::open(&dir.join("db.sqlite")).expect("store"));
        let bad = dispatch(
            &store,
            "secret",
            json!({"jsonrpc":"2.0","id":1,"method":"health.get","meta":{"api_version":2,"auth_token":"secret"}}),
        );
        assert_eq!(bad["error"]["code"], "INCOMPATIBLE_PROTOCOL");
        let denied = dispatch(
            &store,
            "secret",
            json!({"jsonrpc":"2.0","id":1,"method":"health.get","meta":{"api_version":1,"auth_token":"wrong"}}),
        );
        assert_eq!(denied["error"]["code"], "ACCESS_DENIED");
        drop(store);
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn oversized_frame_is_rejected_without_allocation() {
        let dir = std::env::temp_dir().join(format!("weave-frame-test-{}", Uuid::new_v4()));
        let store = Arc::new(Mutex::new(
            Store::open(&dir.join("db.sqlite")).expect("store"),
        ));
        let (mut client, server) = tokio::io::duplex(4096);
        let task = tokio::spawn(handle(server, store, Arc::new("secret".to_string())));
        client
            .write_u32((MAX_FRAME + 1) as u32)
            .await
            .expect("send length");
        let len = client.read_u32().await.expect("response length") as usize;
        let mut bytes = vec![0u8; len];
        client.read_exact(&mut bytes).await.expect("response");
        let reply: Value = serde_json::from_slice(&bytes).expect("JSON");
        assert_eq!(reply["error"]["code"], "INVALID_SCHEMA");
        drop(client);
        task.await.expect("server task").expect("server result");
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn malformed_json_gets_structured_error() {
        let dir = std::env::temp_dir().join(format!("weave-json-test-{}", Uuid::new_v4()));
        let store = Arc::new(Mutex::new(
            Store::open(&dir.join("db.sqlite")).expect("store"),
        ));
        let (mut client, server) = tokio::io::duplex(4096);
        let task = tokio::spawn(handle(server, store, Arc::new("secret".to_string())));
        client.write_u32(3).await.expect("send length");
        client.write_all(b"{{{").await.expect("send malformed JSON");
        let len = client.read_u32().await.expect("response length") as usize;
        let mut bytes = vec![0u8; len];
        client.read_exact(&mut bytes).await.expect("response");
        let reply: Value = serde_json::from_slice(&bytes).expect("response JSON");
        assert_eq!(reply["error"]["code"], "INVALID_SCHEMA");
        drop(client);
        task.await.expect("server task").expect("server result");
        let _ = std::fs::remove_dir_all(dir);
    }
}
