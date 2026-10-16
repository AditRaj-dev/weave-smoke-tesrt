//! Provider-neutral client for the private WEAVE daemon.
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{
    io,
    path::{Path, PathBuf},
};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
use uuid::Uuid;

const MAX_FRAME: usize = 1_048_576;

fn data_dir() -> io::Result<PathBuf> {
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
fn endpoint(dir: &Path) -> String {
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

#[derive(Debug)]
pub struct RemoteError {
    pub code: String,
    pub message: String,
    pub retryable: bool,
}
impl RemoteError {
    fn local(code: &str, message: &str) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            retryable: false,
        }
    }
}

async fn exchange<S: AsyncRead + AsyncWrite + Unpin>(
    mut stream: S,
    request: &Value,
) -> Result<Value, RemoteError> {
    let bytes = serde_json::to_vec(request)
        .map_err(|_| RemoteError::local("INVALID_SCHEMA", "Request cannot be serialized."))?;
    if bytes.len() > MAX_FRAME {
        return Err(RemoteError::local(
            "INVALID_SCHEMA",
            "Request exceeds IPC frame limit.",
        ));
    }
    stream
        .write_u32(bytes.len() as u32)
        .await
        .map_err(|_| RemoteError::local("IPC_UNAVAILABLE", "Cannot write to WEAVE daemon."))?;
    stream
        .write_all(&bytes)
        .await
        .map_err(|_| RemoteError::local("IPC_UNAVAILABLE", "Cannot write to WEAVE daemon."))?;
    stream
        .flush()
        .await
        .map_err(|_| RemoteError::local("IPC_UNAVAILABLE", "Cannot write to WEAVE daemon."))?;
    let len =
        stream.read_u32().await.map_err(|_| {
            RemoteError::local("IPC_UNAVAILABLE", "Cannot read WEAVE daemon response.")
        })? as usize;
    if len == 0 || len > MAX_FRAME {
        return Err(RemoteError::local(
            "INVALID_SCHEMA",
            "Daemon response frame is invalid.",
        ));
    }
    let mut body = vec![0u8; len];
    stream
        .read_exact(&mut body)
        .await
        .map_err(|_| RemoteError::local("IPC_UNAVAILABLE", "Daemon response is incomplete."))?;
    let reply: Value = serde_json::from_slice(&body)
        .map_err(|_| RemoteError::local("INVALID_SCHEMA", "Daemon response JSON is invalid."))?;
    if let Some(e) = reply.get("error") {
        return Err(RemoteError {
            code: e
                .get("code")
                .and_then(Value::as_str)
                .unwrap_or("REMOTE_ERROR")
                .into(),
            message: e
                .get("message")
                .and_then(Value::as_str)
                .unwrap_or("WEAVE request failed.")
                .into(),
            retryable: e.get("retryable").and_then(Value::as_bool).unwrap_or(false),
        });
    }
    reply
        .get("result")
        .cloned()
        .ok_or_else(|| RemoteError::local("INVALID_SCHEMA", "Daemon response has no result."))
}

pub async fn request(method: &str, params: Value) -> Result<Value, RemoteError> {
    let dir = data_dir()
        .map_err(|_| RemoteError::local("IPC_UNAVAILABLE", "User data directory unavailable."))?;
    let token = std::fs::read_to_string(dir.join("auth.token")).map_err(|_| {
        RemoteError::local(
            "IPC_UNAVAILABLE",
            "WEAVE daemon authentication is unavailable.",
        )
    })?;
    let request_id = format!("req_{}", Uuid::new_v4().simple());
    let client_id = format!("cli_{}", Uuid::new_v4().simple());
    let request = json!({"jsonrpc":"2.0","id":request_id,"method":method,"params":params,"meta":{"api_version":1,"request_id":request_id,"client_id":client_id,"idempotency_key":format!("idem_{}",Uuid::new_v4().simple()),"auth_token":token}});
    #[cfg(windows)]
    {
        use tokio::net::windows::named_pipe::ClientOptions;
        let stream = ClientOptions::new().open(endpoint(&dir)).map_err(|_| {
            RemoteError::local("IPC_UNAVAILABLE", "WEAVE daemon named pipe unavailable.")
        })?;
        exchange(stream, &request).await
    }
    #[cfg(not(windows))]
    {
        let stream = tokio::net::UnixStream::connect(endpoint(&dir))
            .await
            .map_err(|_| {
                RemoteError::local("IPC_UNAVAILABLE", "WEAVE daemon socket unavailable.")
            })?;
        exchange(stream, &request).await
    }
}
