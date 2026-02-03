# Phase 2: Interactive TTY Support - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance the generic execution engine (Phase 1) to support full interactivity. Ensure signals (`SIGWINCH`, `SIGINT`) are forwarded correctly, and the wrapper remains transparent to TUIs while maintaining security resilience.

</domain>

<decisions>
## Implementation Decisions

### Signal Handling
- **Resize Strategy:** Immediate Forwarding — send `SIGWINCH` to child instantly (no debounce) for responsiveness.
- **Ctrl+C Behavior:** Forward Only — wrapper ignores `SIGINT`, letting the TUI handle it (preserve TUI shortcuts).
- **Process Group:** Shared Group — wrapper and child share the same group; wrapper explicitly ignores signals meant for child.
- **Termination:** Graceful Timeout — wait 5s for child to exit on `SIGTERM` before force killing.

### TTY Resilience
- **Crash Cleanup:** Auto Reset — if child exits with error, wrapper attempts to reset terminal state (cursor on, echo on).
- **Orphaned Processes:** Kill Tree — wrapper ensures entire process tree is terminated on exit.
- **Output Flushing:** Drain Output — wait for stdout/stderr to empty before wrapper exits.
- **Secret Scrubbing:** Always Scrub — install "last gasp" handlers to scrub memory even on wrapper crash.

### Claude's Discretion
- Specific implementation of tree-killing logic (e.g., using `ps` or `pgrep` vs `tree-kill` module vs pure node implementation).
- Exact error message format for resilience failures.

</decisions>

<specifics>
## Specific Ideas

- "Transparency" is key — the user shouldn't feel like they are inside a wrapper.
- Security cleanup must happen regardless of how the process ends (crash, kill, clean exit).

</specifics>

<deferred>
## Deferred Ideas

- **Windows Support:** Out of scope for now.
- **Boot Integration:** Phase 3 (tmux scripts).

</deferred>

---

*Phase: 02-interactive-tty-support*
*Context gathered: 2026-02-02*
