use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct DesktopBootstrapInfo {
    pub app_name: &'static str,
    pub version: &'static str,
    pub milestone: &'static str,
    pub pty_subsystem_status: &'static str,
    pub pty_notice: &'static str,
    pub daemon_connection_status: &'static str,
    pub daemon_notice: &'static str,
    pub target_os: &'static str,
    pub target_arch: &'static str,
}

pub mod commands {
    use super::*;

    /// Returns explicit bootstrap metadata for the desktop shell.
    /// Honestly reports that real terminal sessions and daemon IPC are pending implementation.
    #[tauri::command]
    pub fn get_desktop_bootstrap_info() -> DesktopBootstrapInfo {
        DesktopBootstrapInfo {
            app_name: "WEAVE Desktop Shell",
            version: "0.1.0-M0",
            milestone: "M0",
            pty_subsystem_status: "UNAVAILABLE_PENDING_PTY_001",
            pty_notice: "Real terminal sessions are unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated. WEAVE does not simulate interactive terminals or fake agent activity.",
            daemon_connection_status: "OFFLINE_PENDING_INF_003",
            daemon_notice: "Daemon IPC connection is not yet implemented. Native socket/pipe probing requires INF-003.",
            target_os: std::env::consts::OS,
            target_arch: std::env::consts::ARCH,
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_desktop_bootstrap_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running WEAVE desktop application");
}

#[cfg(test)]
mod tests {
    use super::commands::*;

    #[test]
    fn test_desktop_bootstrap_info_reports_pty_and_daemon_unavailable() {
        let info = get_desktop_bootstrap_info();
        assert_eq!(info.app_name, "WEAVE Desktop Shell");
        assert_eq!(info.version, "0.1.0-M0");
        assert_eq!(info.milestone, "M0");
        assert_eq!(info.pty_subsystem_status, "UNAVAILABLE_PENDING_PTY_001");
        assert_eq!(info.daemon_connection_status, "OFFLINE_PENDING_INF_003");
        assert!(info.pty_notice.contains("PTY-001"));
        assert!(
            info.pty_notice
                .contains("does not simulate interactive terminals")
        );
        assert!(info.daemon_notice.contains("INF-003"));
    }
}
