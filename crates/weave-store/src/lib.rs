//! Daemon-owned project memory. All writes, including idempotency records, are transactional.

use chrono::{DateTime, Utc};
use rusqlite::{Connection, OptionalExtension, Transaction, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use uuid::Uuid;

const SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, canonical_path TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, created_at TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS memory_items(
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), task_id TEXT, scope TEXT NOT NULL,
 domain TEXT, kind TEXT NOT NULL, status TEXT NOT NULL, content TEXT NOT NULL, source_kind TEXT NOT NULL,
 source_reference TEXT NOT NULL, source_commit TEXT, source_line INTEGER, authored_by TEXT NOT NULL,
 verified_by TEXT, supersedes_id TEXT, content_hash TEXT NOT NULL, sensitivity TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 source_sha256 TEXT, evidence_id TEXT,
 CHECK(status IN ('candidate','validated','pinned','rejected','superseded')),
 CHECK(length(content) BETWEEN 1 AND 16384)
);
CREATE INDEX IF NOT EXISTS idx_memory_scope ON memory_items(project_id,scope,status,domain,task_id);
CREATE TABLE IF NOT EXISTS memory_history(id TEXT PRIMARY KEY, memory_id TEXT NOT NULL REFERENCES memory_items(id), from_status TEXT, to_status TEXT NOT NULL, actor TEXT NOT NULL, evidence_id TEXT, ts TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS artifacts(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), kind TEXT NOT NULL, reference TEXT NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, api_version INTEGER NOT NULL, kind TEXT NOT NULL, project_id TEXT, ts TEXT NOT NULL, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS requests(client_id TEXT NOT NULL, method TEXT NOT NULL, idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, result_json TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(client_id,method,idempotency_key));
CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(content, content='memory_items', content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS memory_ai AFTER INSERT ON memory_items BEGIN INSERT INTO memory_fts(rowid,content) VALUES(new.rowid,new.content); END;
CREATE TRIGGER IF NOT EXISTS memory_ad AFTER DELETE ON memory_items BEGIN INSERT INTO memory_fts(memory_fts,rowid,content) VALUES('delete',old.rowid,old.content); END;
CREATE TRIGGER IF NOT EXISTS memory_au AFTER UPDATE OF content ON memory_items BEGIN INSERT INTO memory_fts(memory_fts,rowid,content) VALUES('delete',old.rowid,old.content); INSERT INTO memory_fts(rowid,content) VALUES(new.rowid,new.content); END;
"#;

#[derive(Debug, Clone)]
pub struct StoreError {
    pub code: &'static str,
    pub message: &'static str,
    pub retryable: bool,
}

impl StoreError {
    fn new(code: &'static str, message: &'static str) -> Self {
        Self {
            code,
            message,
            retryable: false,
        }
    }
}

impl From<rusqlite::Error> for StoreError {
    fn from(error: rusqlite::Error) -> Self {
        match error {
            rusqlite::Error::SqliteFailure(ref detail, _)
                if detail.code == rusqlite::ErrorCode::DatabaseBusy
                    || detail.code == rusqlite::ErrorCode::DatabaseLocked =>
            {
                Self {
                    code: "SQLITE_BUSY",
                    message: "Memory database is busy; retry the request.",
                    retryable: true,
                }
            }
            rusqlite::Error::SqliteFailure(_, Some(ref message))
                if message.contains("memory_fts") || message.contains("fts5") =>
            {
                Self::new("FTS_UNAVAILABLE", "Memory search index is unavailable.")
            }
            _ => Self::new("STORE_ERROR", "Memory storage operation failed."),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Source {
    pub kind: String,
    pub reference: String,
    #[serde(default)]
    pub commit: Option<String>,
    #[serde(default)]
    pub line: Option<u64>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct MemoryItem {
    pub schema_version: u32,
    pub memory_id: String,
    pub project_id: String,
    pub task_id: Option<String>,
    pub scope: String,
    pub domain: Option<String>,
    pub kind: String,
    pub status: String,
    pub content: String,
    pub source: Source,
    pub author_session: String,
    pub validator: Option<String>,
    pub supersedes_id: Option<String>,
    pub content_hash: String,
    pub sensitivity: String,
    pub created_at: String,
}

fn valid_id(id: &str) -> bool {
    (2..=100).contains(&id.len())
        && id.as_bytes()[0].is_ascii_alphanumeric()
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"_.:-".contains(&b))
}

pub fn sha256_hex(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}
fn now() -> String {
    Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}
fn new_id(prefix: &str) -> String {
    format!("{prefix}_{}", Uuid::new_v4().simple())
}

impl MemoryItem {
    pub fn validate(&self) -> Result<(), StoreError> {
        let bad = || StoreError::new("INVALID_SCHEMA", "Memory item does not satisfy schema v1.");
        if self.schema_version != 1
            || !valid_id(&self.memory_id)
            || !valid_id(&self.project_id)
            || !valid_id(&self.author_session)
            || self.task_id.as_ref().is_some_and(|x| !valid_id(x))
            || self.content.is_empty()
            || self.content.len() > 16384
            || self.status != "candidate"
            || self.validator.is_some()
            || self.source.reference.is_empty()
            || self.source.reference.len() > 4096
            || self.source.line == Some(0)
            || !["global", "project", "domain", "task"].contains(&self.scope.as_str())
            || ![
                "decision",
                "observation",
                "lesson",
                "api",
                "handoff",
                "gotcha",
                "review",
            ]
            .contains(&self.kind.as_str())
            || ![
                "file",
                "git",
                "artifact",
                "human_attestation",
                "legacy_memex",
            ]
            .contains(&self.source.kind.as_str())
            || !["public", "internal", "sensitive"].contains(&self.sensitivity.as_str())
            || (self.scope == "domain" && self.domain.as_ref().is_none_or(|x| x.is_empty()))
            || (self.scope == "task" && self.task_id.is_none())
            || DateTime::parse_from_rfc3339(&self.created_at).is_err()
            || self.content_hash != sha256_hex(self.content.as_bytes())
        {
            return Err(bad());
        }
        Ok(())
    }
}

pub struct Store {
    conn: Connection,
}

impl Store {
    pub fn open(path: &Path) -> Result<Self, StoreError> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|_| {
                StoreError::new("STORE_ERROR", "Cannot create memory data directory.")
            })?;
        }
        let mut conn = Connection::open(path)?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.busy_timeout(std::time::Duration::from_millis(5000))?;
        let tx = conn.transaction_with_behavior(TransactionBehavior::Immediate)?;
        tx.execute_batch(SCHEMA).map_err(|_| {
            StoreError::new("FTS_UNAVAILABLE", "SQLite schema or FTS5 is unavailable.")
        })?;
        let checksum = sha256_hex(SCHEMA.as_bytes());
        let prior: Option<String> = tx
            .query_row(
                "SELECT checksum FROM schema_migrations WHERE version=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        match prior {
            Some(value) if value != checksum => {
                return Err(StoreError::new(
                    "MIGRATION_CONFLICT",
                    "Memory schema checksum differs from applied migration.",
                ));
            }
            None => {
                tx.execute(
                    "INSERT INTO schema_migrations(version,checksum,applied_at) VALUES(1,?1,?2)",
                    params![checksum, now()],
                )?;
            }
            _ => {}
        }
        tx.commit()?;
        Ok(Self { conn })
    }

    pub fn mutate(
        &mut self,
        method: &str,
        params_value: &Value,
        client_id: &str,
        idempotency_key: &str,
    ) -> Result<Value, StoreError> {
        if !valid_id(client_id) || !valid_id(idempotency_key) {
            return Err(StoreError::new(
                "INVALID_SCHEMA",
                "Client and idempotency IDs are required.",
            ));
        }
        let request_hash = sha256_hex(
            serde_json::to_string(params_value)
                .map_err(|_| StoreError::new("INVALID_SCHEMA", "Invalid request."))?
                .as_bytes(),
        );
        let tx = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let prior: Option<(String,String)> = tx.query_row("SELECT request_hash,result_json FROM requests WHERE client_id=?1 AND method=?2 AND idempotency_key=?3", params![client_id,method,idempotency_key], |r| Ok((r.get(0)?,r.get(1)?))).optional()?;
        if let Some((hash, result)) = prior {
            if hash != request_hash {
                return Err(StoreError::new(
                    "IDEMPOTENCY_CONFLICT",
                    "Idempotency key was used with a different payload.",
                ));
            }
            return serde_json::from_str(&result)
                .map_err(|_| StoreError::new("STORE_ERROR", "Stored response is invalid."));
        }
        let result = match method {
            "project.create" => create_project(&tx, params_value)?,
            "memory.propose" => propose(&tx, params_value)?,
            "memory.promote" => transition(&tx, params_value, true)?,
            "memory.reject" => transition(&tx, params_value, false)?,
            _ => {
                return Err(StoreError::new(
                    "NOT_IMPLEMENTED",
                    "Method is not implemented.",
                ));
            }
        };
        tx.execute("INSERT INTO requests(client_id,method,idempotency_key,request_hash,result_json,created_at) VALUES(?1,?2,?3,?4,?5,?6)", params![client_id,method,idempotency_key,request_hash,result.to_string(),now()])?;
        tx.commit()?;
        Ok(result)
    }

    pub fn project_list(&self) -> Result<Value, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT id,canonical_path,display_name,version FROM projects ORDER BY display_name,id",
        )?;
        let rows=stmt.query_map([],|r| Ok(json!({"project_id":r.get::<_,String>(0)?,"canonical_path":r.get::<_,String>(1)?,"display_name":r.get::<_,String>(2)?,"version":r.get::<_,i64>(3)?})))?;
        let projects = rows.collect::<Result<Vec<_>, _>>()?;
        Ok(json!({"projects":projects}))
    }

    pub fn query(&self, params_value: &Value) -> Result<Value, StoreError> {
        let project_id = params_value
            .get("project_id")
            .and_then(Value::as_str)
            .ok_or_else(|| StoreError::new("INVALID_SCHEMA", "Project ID is required."))?;
        let text = params_value
            .get("query")
            .and_then(Value::as_str)
            .unwrap_or("");
        let scope = params_value
            .get("scopes")
            .and_then(Value::as_array)
            .and_then(|x| x.first())
            .and_then(Value::as_str)
            .unwrap_or("");
        let task_id = params_value
            .get("task_id")
            .and_then(Value::as_str)
            .unwrap_or("");
        let include_candidates = params_value
            .get("include_candidates")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        let limit = params_value
            .get("limit")
            .and_then(Value::as_u64)
            .unwrap_or(8)
            .clamp(1, 8) as usize;
        let project_path: String = self
            .conn
            .query_row(
                "SELECT canonical_path FROM projects WHERE id=?1",
                [project_id],
                |r| r.get(0),
            )
            .optional()?
            .ok_or_else(|| StoreError::new("NOT_FOUND", "Project does not exist."))?;
        let fts = fts_query(text)?;
        let sql = if fts.is_empty() {
            "SELECT m.id,m.scope,m.domain,m.task_id,m.kind,m.status,m.content,m.source_kind,m.source_reference,m.source_commit,m.source_line,m.authored_by,m.verified_by,m.content_hash,m.created_at,m.source_sha256,m.evidence_id,m.version,m.sensitivity FROM memory_items m WHERE m.project_id=?1 AND m.status IN ('validated','pinned','candidate') ORDER BY CASE m.status WHEN 'pinned' THEN 0 WHEN 'validated' THEN 1 ELSE 2 END,m.created_at DESC LIMIT 64"
        } else {
            "SELECT m.id,m.scope,m.domain,m.task_id,m.kind,m.status,m.content,m.source_kind,m.source_reference,m.source_commit,m.source_line,m.authored_by,m.verified_by,m.content_hash,m.created_at,m.source_sha256,m.evidence_id,m.version,m.sensitivity FROM memory_fts f JOIN memory_items m ON m.rowid=f.rowid WHERE m.project_id=?1 AND m.status IN ('validated','pinned','candidate') AND memory_fts MATCH ?2 ORDER BY CASE m.status WHEN 'pinned' THEN 0 WHEN 'validated' THEN 1 ELSE 2 END,bm25(memory_fts),m.created_at DESC LIMIT 64"
        };
        let mut stmt = self.conn.prepare(sql)?;
        let mut rows = if fts.is_empty() {
            stmt.query(params![project_id])?
        } else {
            stmt.query(params![project_id, fts])?
        };
        let mut items = Vec::new();
        let mut budget = 0usize;
        while let Some(r) = rows.next()? {
            let item_scope: String = r.get(1)?;
            let domain: Option<String> = r.get(2)?;
            let item_task: Option<String> = r.get(3)?;
            let status: String = r.get(5)?;
            let source_kind: String = r.get(7)?;
            let reference: String = r.get(8)?;
            let snapshot: Option<String> = r.get(15)?;
            if status == "candidate" && !include_candidates {
                continue;
            }
            if r.get::<_, String>(18)? == "sensitive" {
                continue;
            }
            if item_scope == "domain" && domain.as_deref() != Some(scope) {
                continue;
            }
            if item_scope == "task" && item_task.as_deref() != Some(task_id) {
                continue;
            }
            // A changed file is never emitted as a confirmed source.
            if status != "candidate"
                && source_kind == "file"
                && !source_matches(Path::new(&project_path), &reference, snapshot.as_deref())
            {
                continue;
            }
            let content: String = r.get(6)?;
            if budget + content.len() > 16000 {
                break;
            }
            budget += content.len();
            items.push(json!({"memory_id":r.get::<_,String>(0)?,"project_id":project_id,"scope":item_scope,"domain":domain,"task_id":item_task,"kind":r.get::<_,String>(4)?,"status":status,"content":content,"source":{"kind":source_kind,"reference":reference,"commit":r.get::<_,Option<String>>(9)?,"line":r.get::<_,Option<i64>>(10)?,"sha256":snapshot},"author_session":r.get::<_,String>(11)?,"validator":r.get::<_,Option<String>>(12)?,"content_hash":r.get::<_,String>(13)?,"created_at":r.get::<_,String>(14)?,"evidence_id":r.get::<_,Option<String>>(16)?,"version":r.get::<_,i64>(17)?}));
            if items.len() >= limit {
                break;
            }
        }
        let revision: i64 =
            self.conn
                .query_row("SELECT COALESCE(MAX(seq),0) FROM events", [], |r| r.get(0))?;
        Ok(json!({"items":items,"index_revision":revision.to_string()}))
    }
}

fn fts_query(text: &str) -> Result<String, StoreError> {
    if text.trim().is_empty() {
        return Ok(String::new());
    }
    let words: Vec<String> = text
        .split(|c: char| !c.is_alphanumeric() && c != '_')
        .filter(|s| !s.is_empty())
        .take(12)
        .map(|s| format!("\"{s}\""))
        .collect();
    if words.is_empty() {
        return Err(StoreError::new(
            "INVALID_SCHEMA",
            "Search query has no searchable terms.",
        ));
    }
    Ok(words.join(" AND "))
}

fn canonical_project_path(path: &str) -> Result<PathBuf, StoreError> {
    let p = std::fs::canonicalize(path).map_err(|_| {
        StoreError::new(
            "INVALID_SCHEMA",
            "Project path must be an existing directory.",
        )
    })?;
    if !p.is_dir() {
        return Err(StoreError::new(
            "INVALID_SCHEMA",
            "Project path must be a directory.",
        ));
    }
    Ok(p)
}

fn create_project(tx: &Transaction<'_>, p: &Value) -> Result<Value, StoreError> {
    let path = p
        .get("canonical_path")
        .and_then(Value::as_str)
        .ok_or_else(|| StoreError::new("INVALID_SCHEMA", "Project path is required."))?;
    let name = p
        .get("display_name")
        .and_then(Value::as_str)
        .ok_or_else(|| StoreError::new("INVALID_SCHEMA", "Project name is required."))?;
    if name.trim().is_empty() || name.len() > 200 {
        return Err(StoreError::new(
            "INVALID_SCHEMA",
            "Project name is invalid.",
        ));
    }
    let path = canonical_project_path(path)?.to_string_lossy().into_owned();
    if let Some((id, version)) = tx
        .query_row(
            "SELECT id,version FROM projects WHERE canonical_path=?1",
            [&path],
            |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)),
        )
        .optional()?
    {
        return Ok(json!({"project_id":id,"version":version}));
    }
    let id = new_id("p");
    tx.execute(
        "INSERT INTO projects(id,canonical_path,display_name,created_at) VALUES(?1,?2,?3,?4)",
        params![id, path, name, now()],
    )?;
    event(tx, "project.created", Some(&id), json!({"project_id":id}))?;
    Ok(json!({"project_id":id,"version":1}))
}

fn snapshot(project_root: &Path, source: &Source) -> Result<Option<(String, String)>, StoreError> {
    match source.kind.as_str() {
        "file" | "artifact" => {
            let relative = Path::new(&source.reference);
            if relative.is_absolute()
                || relative
                    .components()
                    .any(|c| matches!(c, std::path::Component::ParentDir))
            {
                return Err(StoreError::new(
                    "INVALID_SCHEMA",
                    "Source path must stay inside the project.",
                ));
            }
            let actual = match std::fs::canonicalize(project_root.join(relative)) {
                Ok(x) => x,
                Err(_) => return Ok(None),
            };
            if !actual.starts_with(project_root) || !actual.is_file() {
                return Err(StoreError::new(
                    "INVALID_SCHEMA",
                    "Source path leaves the project.",
                ));
            }
            let mut file = File::open(&actual)
                .map_err(|_| StoreError::new("EVIDENCE_MISSING", "Source file cannot be read."))?;
            let mut hasher = Sha256::new();
            let mut buf = [0u8; 8192];
            loop {
                let n = file.read(&mut buf).map_err(|_| {
                    StoreError::new("EVIDENCE_MISSING", "Source file cannot be read.")
                })?;
                if n == 0 {
                    break;
                }
                hasher.update(&buf[..n]);
            }
            Ok(Some((
                source.reference.clone(),
                hex::encode(hasher.finalize()),
            )))
        }
        "human_attestation" => Ok(Some((
            source.reference.clone(),
            sha256_hex(source.reference.as_bytes()),
        ))),
        _ => Ok(None),
    }
}

fn source_matches(root: &Path, reference: &str, expected: Option<&str>) -> bool {
    let Some(expected) = expected else {
        return false;
    };
    let source = Source {
        kind: "file".into(),
        reference: reference.into(),
        commit: None,
        line: None,
    };
    matches!(snapshot(root,&source),Ok(Some((_,hash))) if hash==expected)
}

fn propose(tx: &Transaction<'_>, p: &Value) -> Result<Value, StoreError> {
    let candidate: MemoryItem = serde_json::from_value(
        p.get("candidate")
            .cloned()
            .ok_or_else(|| StoreError::new("INVALID_SCHEMA", "Candidate is required."))?,
    )
    .map_err(|_| StoreError::new("INVALID_SCHEMA", "Memory item does not satisfy schema v1."))?;
    candidate.validate()?;
    let root: String = tx
        .query_row(
            "SELECT canonical_path FROM projects WHERE id=?1",
            [&candidate.project_id],
            |r| r.get(0),
        )
        .optional()?
        .ok_or_else(|| StoreError::new("NOT_FOUND", "Project does not exist."))?;
    if let Some((id,status,evidence_id))=tx.query_row("SELECT id,status,evidence_id FROM memory_items WHERE project_id=?1 AND scope=?2 AND COALESCE(domain,'')=COALESCE(?3,'') AND content_hash=?4 AND status!='rejected' LIMIT 1",params![candidate.project_id,candidate.scope,candidate.domain,candidate.content_hash],|r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?,r.get::<_,Option<String>>(2)?))).optional()? {return Ok(json!({"memory_id":id,"status":status,"evidence_id":evidence_id,"duplicate":true}));}
    if tx
        .query_row(
            "SELECT 1 FROM memory_items WHERE id=?1",
            [&candidate.memory_id],
            |r| r.get::<_, i64>(0),
        )
        .optional()?
        .is_some()
    {
        return Err(StoreError::new("ID_CONFLICT", "Memory ID already exists."));
    }
    let snap = snapshot(Path::new(&root), &candidate.source)?;
    let evidence_id = snap.as_ref().map(|_| new_id("ev"));
    if let (Some((reference, hash)), Some(id)) = (snap.as_ref(), evidence_id.as_ref()) {
        tx.execute("INSERT INTO artifacts(id,project_id,kind,reference,sha256,created_at) VALUES(?1,?2,'source_snapshot',?3,?4,?5)",params![id,candidate.project_id,reference,hash,now()])?;
    }
    tx.execute("INSERT INTO memory_items(id,project_id,task_id,scope,domain,kind,status,content,source_kind,source_reference,source_commit,source_line,authored_by,verified_by,supersedes_id,content_hash,sensitivity,created_at,updated_at,source_sha256,evidence_id) VALUES(?1,?2,?3,?4,?5,?6,'candidate',?7,?8,?9,?10,?11,?12,NULL,?13,?14,?15,?16,?17,?18,?19)",params![candidate.memory_id,candidate.project_id,candidate.task_id,candidate.scope,candidate.domain,candidate.kind,candidate.content,candidate.source.kind,candidate.source.reference,candidate.source.commit,candidate.source.line,candidate.author_session,candidate.supersedes_id,candidate.content_hash,candidate.sensitivity,candidate.created_at,now(),snap.as_ref().map(|(_,hash)|hash),evidence_id])?;
    history(
        tx,
        &candidate.memory_id,
        None,
        "candidate",
        &candidate.author_session,
        None,
    )?;
    event(
        tx,
        "memory.candidate_created",
        Some(&candidate.project_id),
        json!({"memory_id":candidate.memory_id}),
    )?;
    Ok(
        json!({"memory_id":candidate.memory_id,"status":"candidate","evidence_id":evidence_id,"version":1}),
    )
}

fn transition(tx: &Transaction<'_>, p: &Value, promote: bool) -> Result<Value, StoreError> {
    let id = p
        .get("memory_id")
        .and_then(Value::as_str)
        .ok_or_else(|| StoreError::new("INVALID_SCHEMA", "Memory ID is required."))?;
    let actor = p
        .get("actor_id")
        .and_then(Value::as_str)
        .ok_or_else(|| StoreError::new("ACCESS_DENIED", "Owner identity is required."))?;
    if !valid_id(actor) {
        return Err(StoreError::new(
            "INVALID_SCHEMA",
            "Owner identity is invalid.",
        ));
    }
    let expected = p
        .get("expected_version")
        .and_then(Value::as_i64)
        .ok_or_else(|| StoreError::new("INVALID_SCHEMA", "Expected version is required."))?;
    type TransitionRow = (
        String,
        String,
        i64,
        String,
        String,
        Option<String>,
        Option<String>,
        String,
        Option<String>,
    );
    let row:Option<TransitionRow>=tx.query_row("SELECT project_id,status,version,source_kind,source_reference,source_sha256,evidence_id,kind,domain FROM memory_items WHERE id=?1",[id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?,r.get(5)?,r.get(6)?,r.get(7)?,r.get(8)?))).optional()?;
    let (
        project,
        status,
        version,
        source_kind,
        reference,
        snapshot_hash,
        evidence_id,
        kind,
        domain,
    ) = row.ok_or_else(|| StoreError::new("NOT_FOUND", "Memory item does not exist."))?;
    if version != expected {
        return Err(StoreError::new(
            "VERSION_CONFLICT",
            "Memory version changed; re-read before updating.",
        ));
    }
    if status != "candidate" {
        return Err(StoreError::new(
            "VERSION_CONFLICT",
            "Only candidates can be promoted or rejected.",
        ));
    }
    let target = if promote { "validated" } else { "rejected" };
    let reason = p.get("reason").and_then(Value::as_str).unwrap_or("");
    if !promote && reason.trim().is_empty() {
        return Err(StoreError::new(
            "INVALID_SCHEMA",
            "Rejection reason is required.",
        ));
    }
    if promote {
        let supplied = p
            .get("evidence_id")
            .and_then(Value::as_str)
            .ok_or_else(|| StoreError::new("EVIDENCE_MISSING", "Evidence ID is required."))?;
        if evidence_id.as_deref() != Some(supplied) {
            return Err(StoreError::new(
                "EVIDENCE_MISSING",
                "Evidence ID does not match the proposal snapshot.",
            ));
        }
        let root: String = tx.query_row(
            "SELECT canonical_path FROM projects WHERE id=?1",
            [&project],
            |r| r.get(0),
        )?;
        if (source_kind == "file" || source_kind == "artifact")
            && !source_matches(Path::new(&root), &reference, snapshot_hash.as_deref())
        {
            return Err(StoreError::new(
                "EVIDENCE_STALE",
                "Source changed or disappeared after proposal.",
            ));
        }
        let exists: i64 = tx.query_row(
            "SELECT COUNT(*) FROM artifacts WHERE id=?1 AND project_id=?2 AND sha256=?3",
            params![supplied, project, snapshot_hash],
            |r| r.get(0),
        )?;
        if exists != 1 {
            return Err(StoreError::new(
                "EVIDENCE_MISSING",
                "Linked evidence is unavailable.",
            ));
        }
        if kind == "decision" {
            let pinned:i64=tx.query_row("SELECT COUNT(*) FROM memory_items WHERE project_id=?1 AND kind='decision' AND status='pinned' AND scope=(SELECT scope FROM memory_items WHERE id=?2) AND COALESCE(domain,'')=COALESCE(?3,'') AND content_hash!=(SELECT content_hash FROM memory_items WHERE id=?2)",params![project,id,domain],|r|r.get(0))?;
            if pinned > 0 {
                return Err(StoreError::new(
                    "CONTRACT_DRIFT",
                    "Candidate conflicts with pinned project decision.",
                ));
            }
        }
    }
    tx.execute("UPDATE memory_items SET status=?1,verified_by=?2,updated_at=?3,version=version+1 WHERE id=?4 AND version=?5",params![target,if promote{Some(actor)}else{None},now(),id,expected])?;
    history(
        tx,
        id,
        Some("candidate"),
        target,
        actor,
        if promote {
            evidence_id.as_deref()
        } else {
            None
        },
    )?;
    event(
        tx,
        if promote {
            "memory.promoted"
        } else {
            "memory.rejected"
        },
        Some(&project),
        json!({"memory_id":id,"actor_id":actor,"reason":if promote{""}else{reason}}),
    )?;
    Ok(json!({"memory_id":id,"status":target,"version":version+1}))
}

fn history(
    tx: &Transaction<'_>,
    id: &str,
    from: Option<&str>,
    to: &str,
    actor: &str,
    evidence: Option<&str>,
) -> Result<(), StoreError> {
    tx.execute("INSERT INTO memory_history(id,memory_id,from_status,to_status,actor,evidence_id,ts) VALUES(?1,?2,?3,?4,?5,?6,?7)",params![new_id("mh"),id,from,to,actor,evidence,now()])?;
    Ok(())
}
fn event(
    tx: &Transaction<'_>,
    kind: &str,
    project: Option<&str>,
    payload: Value,
) -> Result<(), StoreError> {
    tx.execute("INSERT INTO events(event_id,api_version,kind,project_id,ts,payload_json) VALUES(?1,1,?2,?3,?4,?5)",params![new_id("evt"),kind,project,now(),payload.to_string()])?;
    Ok(())
}
