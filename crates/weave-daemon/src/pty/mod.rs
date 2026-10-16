//! PTY supervisor seam for PTY-001.
//!
//! This module provides the integration boundary for real native PTY session
//! management (Windows ConPTY / POSIX PTY), ring buffer, and terminal I/O,
//! scheduled for implementation in task PTY-001.

/// Represents the status of the PTY supervisor subsystem.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PtySupervisorStatus {
    /// PTY supervisor is not yet implemented (bootstrap phase).
    NotImplemented,
    /// PTY supervisor is active and managing sessions.
    Active,
    /// PTY supervisor has stopped.
    Stopped,
}

/// Query the status of the PTY supervisor subsystem.
///
/// In the bootstrap state, the supervisor returns [`PtySupervisorStatus::NotImplemented`].
#[must_use]
pub fn supervisor_status() -> PtySupervisorStatus {
    PtySupervisorStatus::NotImplemented
}
