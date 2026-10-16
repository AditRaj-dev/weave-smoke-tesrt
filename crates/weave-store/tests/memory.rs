use serde_json::{Value, json};
use std::path::Path;
use tempfile::TempDir;
use weave_store::{Store, sha256_hex};

fn setup() -> (TempDir, String, Store) {
    let dir = tempfile::tempdir().expect("tempdir");
    std::fs::write(dir.path().join("source.txt"), "source v1").expect("source");
    let mut store = Store::open(&dir.path().join("db.sqlite")).expect("store");
    let project = store
        .mutate(
            "project.create",
            &json!({"canonical_path":dir.path(),"display_name":"test"}),
            "client_a",
            "project_1",
        )
        .expect("project");
    (
        dir,
        project["project_id"].as_str().expect("id").to_string(),
        store,
    )
}
fn candidate(project: &str, id: &str, content: &str) -> Value {
    json!({"schema_version":1,"memory_id":id,"project_id":project,"task_id":null,"scope":"project","domain":null,"kind":"observation","status":"candidate","content":content,"source":{"kind":"file","reference":"source.txt","commit":null,"line":1},"author_session":"session_a","validator":null,"supersedes_id":null,"content_hash":sha256_hex(content.as_bytes()),"sensitivity":"internal","created_at":"2026-10-16T00:00:00Z"})
}
fn propose(store: &mut Store, project: &str, id: &str, content: &str, key: &str) -> Value {
    store
        .mutate(
            "memory.propose",
            &json!({"candidate":candidate(project,id,content)}),
            "client_a",
            key,
        )
        .expect("propose")
}
fn query(store: &Store, project: &str, search: &str) -> Value {
    store.query(&json!({"project_id":project,"query":search,"scopes":[],"limit":8,"include_candidates":false})).expect("query")
}

#[test]
fn proposal_requires_review_and_stale_source_cannot_be_confirmed() {
    let (dir, project, mut store) = setup();
    let created = propose(&mut store, &project, "mem_1", "shared finding", "key_1");
    assert!(
        query(&store, &project, "shared")["items"]
            .as_array()
            .expect("array")
            .is_empty()
    );
    let evidence = created["evidence_id"].as_str().expect("evidence");
    std::fs::write(dir.path().join("source.txt"), "source v2").expect("change");
    let err=store.mutate("memory.promote",&json!({"memory_id":"mem_1","evidence_id":evidence,"expected_version":1,"actor_id":"owner_1"}),"client_a","promote_1").expect_err("stale source");
    assert_eq!(err.code, "EVIDENCE_STALE");
    std::fs::write(dir.path().join("source.txt"), "source v1").expect("restore");
    store.mutate("memory.promote",&json!({"memory_id":"mem_1","evidence_id":evidence,"expected_version":1,"actor_id":"owner_1"}),"client_a","promote_1").expect("promote");
    assert_eq!(
        query(&store, &project, "shared")["items"]
            .as_array()
            .expect("array")
            .len(),
        1
    );
    std::fs::remove_file(dir.path().join("source.txt")).expect("remove");
    assert!(
        query(&store, &project, "shared")["items"]
            .as_array()
            .expect("array")
            .is_empty()
    );
}

#[test]
fn dedupe_idempotency_rejection_and_restart() {
    let (dir, project, mut store) = setup();
    let item = candidate(&project, "mem_1", "repeat note");
    let first = store
        .mutate(
            "memory.propose",
            &json!({"candidate":item}),
            "client_a",
            "same_key",
        )
        .expect("first");
    let same = store
        .mutate(
            "memory.propose",
            &json!({"candidate":candidate(&project,"mem_1","repeat note")}),
            "client_a",
            "same_key",
        )
        .expect("replay");
    assert_eq!(first, same);
    let duplicate = propose(&mut store, &project, "mem_2", "repeat note", "other_key");
    assert_eq!(duplicate["memory_id"], "mem_1");
    assert_eq!(duplicate["duplicate"], true);
    let err = store
        .mutate(
            "memory.propose",
            &json!({"candidate":candidate(&project,"mem_3","different note")}),
            "client_a",
            "same_key",
        )
        .expect_err("changed payload");
    assert_eq!(err.code, "IDEMPOTENCY_CONFLICT");
    store.mutate("memory.reject",&json!({"memory_id":"mem_1","reason":"not reliable","expected_version":1,"actor_id":"owner_1"}),"client_a","reject_1").expect("reject");
    drop(store);
    let reopened = Store::open(&dir.path().join("db.sqlite")).expect("restart");
    assert!(
        query(&reopened, &project, "repeat")["items"]
            .as_array()
            .expect("array")
            .is_empty()
    );
}

#[test]
fn three_concurrent_writers_keep_all_notes() {
    let (dir, project, store) = setup();
    drop(store);
    let db = dir.path().join("db.sqlite");
    std::thread::scope(|scope| {
        let mut jobs = Vec::new();
        for i in 0..3 {
            let db = db.clone();
            let project = project.clone();
            jobs.push(scope.spawn(move || {
                let mut store = Store::open(Path::new(&db)).expect("open concurrent");
                let id = format!("mem_concurrent_{i}");
                let content = format!("concurrent note {i}");
                store
                    .mutate(
                        "memory.propose",
                        &json!({"candidate":candidate(&project,&id,&content)}),
                        &format!("client_{i}"),
                        &format!("key_{i}"),
                    )
                    .expect("concurrent propose");
            }));
        }
        for job in jobs {
            job.join().expect("writer");
        }
    });
    let conn = rusqlite::Connection::open(db).expect("inspect");
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM memory_items", [], |r| r.get(0))
        .expect("count");
    assert_eq!(count, 3);
}

#[test]
fn sensitive_note_is_withheld_and_missing_fts_is_explicit() {
    let (dir, project, mut store) = setup();
    let mut item = candidate(&project, "mem_private_1", "private detail");
    item["sensitivity"] = json!("sensitive");
    let created = store
        .mutate(
            "memory.propose",
            &json!({ "candidate": item }),
            "client_a",
            "private_1",
        )
        .expect("propose");
    store
        .mutate(
            "memory.promote",
            &json!({"memory_id":"mem_private_1","evidence_id":created["evidence_id"],"expected_version":1,"actor_id":"owner_1"}),
            "client_a",
            "private_promote",
        )
        .expect("promote");
    assert!(
        query(&store, &project, "private")["items"]
            .as_array()
            .expect("array")
            .is_empty()
    );
    let conn = rusqlite::Connection::open(dir.path().join("db.sqlite")).expect("inspect");
    conn.execute_batch("DROP TABLE memory_fts;")
        .expect("drop index");
    let err = store
        .query(&json!({"project_id":project,"query":"private","scopes":[],"limit":8,"include_candidates":false}))
        .expect_err("FTS unavailable");
    assert_eq!(err.code, "FTS_UNAVAILABLE");
}

#[test]
fn domain_scope_and_project_id_bound_retrieval() {
    let (dir, project, mut store) = setup();
    let mut backend = candidate(&project, "mem_backend_1", "shared domain finding");
    backend["scope"] = json!("domain");
    backend["domain"] = json!("backend");
    let evidence = store
        .mutate(
            "memory.propose",
            &json!({"candidate":backend}),
            "client_a",
            "scope_1",
        )
        .expect("propose")["evidence_id"]
        .clone();
    store
        .mutate(
            "memory.promote",
            &json!({"memory_id":"mem_backend_1","evidence_id":evidence,"expected_version":1,"actor_id":"owner_1"}),
            "client_a",
            "scope_promote",
        )
        .expect("promote");
    let visible = store
        .query(&json!({"project_id":project,"query":"shared","scopes":["backend"],"limit":8,"include_candidates":false}))
        .expect("backend query");
    assert_eq!(visible["items"].as_array().expect("array").len(), 1);
    let hidden = store
        .query(&json!({"project_id":project,"query":"shared","scopes":["frontend"],"limit":8,"include_candidates":false}))
        .expect("frontend query");
    assert!(hidden["items"].as_array().expect("array").is_empty());
    let other = tempfile::tempdir().expect("other project");
    let other_id = store
        .mutate(
            "project.create",
            &json!({"canonical_path":other.path(),"display_name":"other"}),
            "client_a",
            "other_project",
        )
        .expect("project")["project_id"]
        .as_str()
        .expect("id")
        .to_string();
    assert!(
        query(&store, &other_id, "shared")["items"]
            .as_array()
            .expect("array")
            .is_empty()
    );
    drop(dir);
}

#[test]
fn locked_database_returns_retryable_busy_error() {
    let (dir, project, mut store) = setup();
    let lock = rusqlite::Connection::open(dir.path().join("db.sqlite")).expect("lock db");
    lock.execute_batch("BEGIN IMMEDIATE;").expect("lock write");
    let err = store
        .mutate(
            "memory.propose",
            &json!({"candidate":candidate(&project,"mem_busy_1","busy note")}),
            "client_a",
            "busy_key",
        )
        .expect_err("busy write");
    assert_eq!(err.code, "SQLITE_BUSY");
    assert!(err.retryable);
    lock.execute_batch("ROLLBACK;").expect("unlock");
}
