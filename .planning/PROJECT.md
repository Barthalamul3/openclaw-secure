# OpenClaw Secure Wrapper

## What This Is
A security wrapper for OpenClaw components (Gateway and TUI) that injects sensitive credentials (API keys, tokens) into the process environment at runtime. It prevents plain-text secrets from persisting on disk by retrieving them from secure backends (Keychain, 1Password, etc.) and exposing them only to the authorized child process.

## Core Value
Securely inject secrets into OpenClaw processes without exposing them on the filesystem.

## Requirements

### Validated
- ✓ Secure Gateway launch - currently hardcoded to launch the gateway

### Active
- [ ] **Arbitrary Command Execution**: Allow the wrapper to launch any command (e.g., `openclaw tui`) with injected secrets, not just the hardcoded gateway.
- [ ] **Interactive Mode Support**: Ensure standard input/output (stdio) are correctly passed through for interactive applications like TUIs.
- [ ] **Startup Integration**: Update startup scripts to launch the TUI in a secure tmux session alongside the gateway.

### Out of Scope
- **Secret Management UI**: The wrapper consumes secrets; managing/editing them happens via the CLI tools of the respective backends.

## Context
- **Existing Setup**: Currently runs via a system service that launches the gateway in a detached tmux session.
- **Goal**: Extend this pattern to the TUI so users can access it remotely (via Tailscale) while maintaining security.
- **Architecture**: Typescript wrapper using `child_process.spawn`.

## Constraints
- **Security**: Secrets must never touch the disk in plain text.
- **Interactivity**: TUI requires full terminal capabilities (TTY pass-through).
- **Node.js**: Must run within the existing Node environment.

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Generic `run` Command** | Allows flexibility to wrap TUI, Gateway, or future tools without hardcoding each one. | — Pending |

---
*Last updated: 2026-02-02 after initialization*
