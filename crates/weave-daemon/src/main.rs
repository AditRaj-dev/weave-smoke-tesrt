pub mod api;
pub mod pty;

use std::process::ExitCode;

#[tokio::main]
async fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.as_slice() {
        [flag] if flag == "--version" || flag == "-V" => {
            println!("weave-daemon {}", env!("CARGO_PKG_VERSION"));
            ExitCode::SUCCESS
        }
        [flag] if flag == "--help" || flag == "-h" => {
            println!(
                "weave-daemon {}\nUsage: weave-daemon\nStarts the private local WEAVE memory service.",
                env!("CARGO_PKG_VERSION")
            );
            ExitCode::SUCCESS
        }
        [] => match api::serve().await {
            Ok(()) => ExitCode::SUCCESS,
            Err(_) => {
                eprintln!(
                    "{{\"code\":\"SERVICE_ERROR\",\"message\":\"WEAVE daemon could not start or serve requests.\"}}"
                );
                ExitCode::from(2)
            }
        },
        _ => {
            eprintln!(
                "{{\"code\":\"UNSUPPORTED_ARGUMENT\",\"message\":\"Use --help for daemon options.\"}}"
            );
            ExitCode::from(2)
        }
    }
}
