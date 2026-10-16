//! Isolated Windows ConPTY transport probe. Not the WEAVE session supervisor.

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::error::Error;
use std::fs;
use std::io::{self, Read, Write};
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc::{self, Sender};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

const MARKER: &[u8] = b"WEAVE_PACKET_ROLE_PROBE_9A31";
const CURSOR_QUERY: &[u8] = b"\x1b[6n";
const MAX_OUTPUT_BYTES: usize = 256 * 1024;

enum ScanEvent {
    CursorQuery,
    MarkerSeen(usize),
    Failed(io::Error),
}

fn scan_for_marker(
    mut reader: Box<dyn Read + Send>,
    sender: Sender<ScanEvent>,
    byte_count: Arc<AtomicUsize>,
) {
    let mut chunk = [0_u8; 4096];
    let mut tail = Vec::new();
    let mut total = 0_usize;
    let mut cursor_query_seen = false;
    loop {
        match reader.read(&mut chunk) {
            Ok(0) => {
                let _ = sender.send(ScanEvent::Failed(io::Error::other(
                    "PTY closed before role marker",
                )));
                return;
            }
            Ok(count) => {
                total += count;
                byte_count.store(total, Ordering::Relaxed);
                if total > MAX_OUTPUT_BYTES {
                    let _ = sender.send(ScanEvent::Failed(io::Error::other(
                        "PTY output exceeded probe limit",
                    )));
                    return;
                }
                tail.extend_from_slice(&chunk[..count]);
                if !cursor_query_seen
                    && tail
                        .windows(CURSOR_QUERY.len())
                        .any(|candidate| candidate == CURSOR_QUERY)
                {
                    cursor_query_seen = true;
                    if sender.send(ScanEvent::CursorQuery).is_err() {
                        return;
                    }
                }
                if tail
                    .windows(MARKER.len())
                    .any(|candidate| candidate == MARKER)
                {
                    let _ = sender.send(ScanEvent::MarkerSeen(total));
                    return;
                }
                let keep = MARKER.len().saturating_sub(1);
                if tail.len() > keep {
                    tail.drain(..tail.len() - keep);
                }
            }
            Err(error) => {
                let _ = sender.send(ScanEvent::Failed(error));
                return;
            }
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    if !cfg!(windows) {
        return Err(io::Error::other("this probe requires Windows ConPTY").into());
    }

    let probe_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or_else(|| io::Error::other("probe directory has no parent"))?;
    let role_file = probe_dir.join("ROLE_PACKET_PROBE.md");
    if !fs::read(&role_file)?
        .windows(MARKER.len())
        .any(|candidate| candidate == MARKER)
    {
        return Err(io::Error::other("role fixture marker missing").into());
    }

    let pair = native_pty_system().openpty(PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    })?;
    let mut command = CommandBuilder::new("powershell.exe");
    command.arg("-NoLogo");
    command.arg("-NoProfile");
    command.arg("-NoExit");
    command.cwd(probe_dir);
    let mut child = pair.slave.spawn_command(command)?;
    drop(pair.slave);

    pair.master.resize(PtySize {
        rows: 30,
        cols: 100,
        pixel_width: 0,
        pixel_height: 0,
    })?;
    let size = pair.master.get_size()?;
    if size.rows != 30 || size.cols != 100 {
        let _ = child.kill();
        return Err(io::Error::other("PTY resize did not take effect").into());
    }

    let reader = pair.master.try_clone_reader()?;
    let mut writer = pair.master.take_writer()?;
    let (sender, receiver) = mpsc::channel();
    let byte_count = Arc::new(AtomicUsize::new(0));
    let reader_count = Arc::clone(&byte_count);
    thread::spawn(move || scan_for_marker(reader, sender, reader_count));

    // The marker is absent from the input command: it must arrive from the role file.
    writer.write_all(b"Get-Content -LiteralPath ROLE_PACKET_PROBE.md\r")?;
    writer.flush()?;
    let marker_deadline = Instant::now() + Duration::from_secs(15);
    let mut cursor_queries_answered = 0_u8;
    let bytes_read = loop {
        let remaining = marker_deadline.saturating_duration_since(Instant::now());
        match receiver.recv_timeout(remaining) {
            Ok(ScanEvent::CursorQuery) => {
                // This fixed probe starts at row 1, column 1. Production must
                // answer from the live terminal screen state.
                writer.write_all(b"\x1b[1;1R")?;
                writer.flush()?;
                cursor_queries_answered += 1;
            }
            Ok(ScanEvent::MarkerSeen(count)) => break count,
            Ok(ScanEvent::Failed(error)) => {
                let _ = child.kill();
                return Err(error.into());
            }
            Err(error) => {
                let _ = child.kill();
                return Err(io::Error::other(format!(
                    "PTY marker timed out after {} bytes: {error}",
                    byte_count.load(Ordering::Relaxed)
                ))
                .into());
            }
        }
    };

    writer.write_all(b"exit\r")?;
    writer.flush()?;
    let deadline = Instant::now() + Duration::from_secs(5);
    let exit_code = loop {
        if let Some(status) = child.try_wait()? {
            break status.exit_code();
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            return Err(io::Error::other("shell did not exit after exit command").into());
        }
        thread::sleep(Duration::from_millis(50));
    };
    if exit_code != 0 {
        return Err(io::Error::other(format!("shell exit code {exit_code}")).into());
    }

    // Do not print or persist the raw PTY stream; provider TUI streams can carry secrets.
    println!(
        "CONPTY_PROBE_OK marker_seen=true bytes_read={bytes_read} cursor_queries_answered={cursor_queries_answered} cols={} rows={} exit_code={exit_code}",
        size.cols, size.rows,
    );
    Ok(())
}
