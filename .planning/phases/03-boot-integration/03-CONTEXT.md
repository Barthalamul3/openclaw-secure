# Phase 3: Boot Integration - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Update deployment scripts to launch the Gateway and TUI in a persistent, secure environment on system boot. This integrates the wrapper (Phase 1/2) with the OS service layer.

</domain>

<decisions>
## Implementation Decisions

### Tmux Session Structure
- **Grouping:** Single Session (`openclaw`) containing both tools.
- **Windows:** Named windows `gateway` (Window 0) and `tui` (Window 1).
- **Startup:** Kill & Recreate — if session exists, kill it and start fresh (ensures clean state).
- **Launch Mode:** Detached — script starts tmux in background `-d`, user attaches later.

### Service Management
- **Type:** Systemd — use a user-level unit file (`systemd --user`).
- **User:** User Service — runs as the specific user (`earls`), NOT root.
- **Restart:** Auto Restart — `Restart=on-failure` or `always` to keep it alive.
- **Environment:** Load Profile — execute via `bash -l` to ensure user `$PATH` (node/npm) is correct.

### Logging Strategy
- **File Logging:** Log to File — capture output to `~/.openclaw/logs/` (or similar).
- **Rotation:** Rotate — implement basic rotation (size/date) to prevent disk fill.
- **Gateway:** Capture All — redirect both stdout and stderr to the log file.
- **TUI:** None — TUI output is visual and stays in the tmux buffer; no file logs.

### Claude's Discretion
- Specific path for logs (`~/.local/state/openclaw` vs `~/.openclaw/logs` vs standard XDG).
- Exact `ExecStart` command string for the systemd unit.
- Script location (`scripts/` vs `bin/`).

</decisions>

<specifics>
## Specific Ideas

- The goal is "headless boot, head-ful attach". I should be able to SSH in and `tmux a -t openclaw` to see my tools running.
- Use `tmux new-session` and `tmux new-window` commands chained in the startup script.

</specifics>

<deferred>
## Deferred Ideas

- **Health Checks:** Monitoring endpoint for the service — future phase.
- **Remote Access:** Tailscale/SSH configuration — managed outside this tool.

</deferred>

---

*Phase: 03-boot-integration*
*Context gathered: 2026-02-02*
