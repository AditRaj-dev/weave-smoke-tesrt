pub mod client;

use serde_json::{Value, json};
use std::process::ExitCode;

const HELP: &str = "WEAVE CLI 0.1.0\nUsage:\n  weave status --json\n  weave project create <path> --name <name> --json\n  weave project list --json\n  weave memory query <text> --project <id> [--task <id>] [--scope <domain>] [--limit 1..8] --json\n  weave memory propose --file <candidate.json>\n  weave memory promote <id> --evidence <id> --json\n  weave memory reject <id> --reason <text> --json\n  weave mem search <text> --project <id> [--scope <domain>] --json\nOther planned commands return NOT_IMPLEMENTED.";

#[derive(Debug)]
struct CliError {
    code: &'static str,
    message: &'static str,
}
impl CliError {
    fn new(code: &'static str, message: &'static str) -> Self {
        Self { code, message }
    }
}
fn option<'a>(args: &'a [String], key: &str) -> Option<&'a str> {
    args.windows(2).find(|x| x[0] == key).map(|x| x[1].as_str())
}
fn require<'a>(args: &'a [String], key: &str) -> Result<&'a str, CliError> {
    option(args, key)
        .ok_or_else(|| CliError::new("INVALID_ARGUMENT", "Required option is missing."))
}
fn file_json(path: &str) -> Result<Value, CliError> {
    let data = std::fs::read(path)
        .map_err(|_| CliError::new("INVALID_ARGUMENT", "Input file cannot be read."))?;
    if data.len() > 1_048_576 {
        return Err(CliError::new("INVALID_SCHEMA", "Input file is too large."));
    }
    serde_json::from_slice(&data)
        .map_err(|_| CliError::new("INVALID_SCHEMA", "Input file is not valid JSON."))
}
fn command(args: &[String]) -> Result<(&'static str, Value), CliError> {
    match args {
        [a, b, ..] if a == "project" && b == "list" => Ok(("project.list", json!({}))),
        [a, b, path, ..] if a == "project" && b == "create" => Ok((
            "project.create",
            json!({"canonical_path":path,"display_name":require(args,"--name")?}),
        )),
        [a, b, query, ..] if (a == "memory" && b == "query") || (a == "mem" && b == "search") => {
            let limit = option(args, "--limit")
                .map(str::parse::<u64>)
                .transpose()
                .map_err(|_| CliError::new("INVALID_ARGUMENT", "Limit must be an integer."))?
                .unwrap_or(8);
            if !(1..=8).contains(&limit) {
                return Err(CliError::new(
                    "INVALID_ARGUMENT",
                    "Limit must be between 1 and 8.",
                ));
            }
            let scope = option(args, "--scope").map_or_else(Vec::new, |s| vec![s]);
            Ok((
                "memory.query",
                json!({"query":query,"project_id":require(args,"--project")?,"task_id":option(args,"--task"),"scopes":scope,"limit":limit,"include_candidates":false}),
            ))
        }
        [a, b, ..] if a == "memory" && b == "propose" => Ok((
            "memory.propose",
            json!({"candidate":file_json(require(args,"--file")?)?}),
        )),
        [a, b, id, ..] if a == "memory" && b == "promote" => Ok((
            "memory.promote",
            json!({"memory_id":id,"evidence_id":require(args,"--evidence")?,"expected_version":1,"actor_id":std::env::var("WEAVE_ACTOR_ID").unwrap_or_else(|_|"owner_local".into())}),
        )),
        [a, b, id, ..] if a == "memory" && b == "reject" => Ok((
            "memory.reject",
            json!({"memory_id":id,"reason":require(args,"--reason")?,"expected_version":1,"actor_id":std::env::var("WEAVE_ACTOR_ID").unwrap_or_else(|_|"owner_local".into())}),
        )),
        [a, ..] if a == "status" => Ok(("health.get", json!({}))),
        [a, ..]
            if a == "task" || a == "handoff" || a == "contract" || a == "events" || a == "mem" =>
        {
            Err(CliError::new(
                "NOT_IMPLEMENTED",
                "Command is not implemented in the current starter.",
            ))
        }
        _ => Err(CliError::new(
            "UNSUPPORTED_ARGUMENT",
            "Use --help for supported commands.",
        )),
    }
}

#[tokio::main]
async fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.len() == 1 && (args[0] == "--help" || args[0] == "-h") {
        println!("{HELP}");
        return ExitCode::SUCCESS;
    }
    if args.len() == 1 && (args[0] == "--version" || args[0] == "-V") {
        println!("weave {}", env!("CARGO_PKG_VERSION"));
        return ExitCode::SUCCESS;
    }
    let (method, params) = match command(&args) {
        Ok(x) => x,
        Err(e) => {
            eprintln!(
                "{}",
                json!({"api_version":1,"ok":false,"error":{"code":e.code,"message":e.message,"retryable":false,"details":{}}})
            );
            return ExitCode::from(2);
        }
    };
    let request_id = format!("req_{}", uuid::Uuid::new_v4().simple());
    match client::request(method, params).await {
        Ok(data) => {
            println!(
                "{}",
                json!({"api_version":1,"ok":true,"data":data,"request_id":request_id})
            );
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!(
                "{}",
                json!({"api_version":1,"ok":false,"error":{"code":e.code,"message":e.message,"retryable":e.retryable,"details":{}},"request_id":request_id})
            );
            ExitCode::from(2)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_memory_query() {
        let a = [
            "memory",
            "query",
            "auth",
            "--project",
            "p_test",
            "--scope",
            "backend",
        ]
        .map(String::from);
        let (method, p) = command(&a).expect("query");
        assert_eq!(method, "memory.query");
        assert_eq!(p["scopes"][0], "backend");
    }
    #[test]
    fn unknown_command_is_not_implemented() {
        let a = ["task", "report"].map(String::from);
        assert_eq!(
            command(&a).expect_err("not implemented").code,
            "NOT_IMPLEMENTED"
        );
    }
}
