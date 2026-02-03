# Phase 1: Generic Execution Engine - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a generic `run` command that executes arbitrary processes with secrets injected from the configured backend. This replaces the hardcoded `start` logic with a flexible engine.

</domain>

<decisions>
## Implementation Decisions

### Command Interface
- **Syntax:** Explicit double-dash separator required (`openclaw-secure run -- cmd -flag`)
- **Verb:** Use `run`
- **Default:** Keep `start` as default command (backward compatibility)
- **Backend Flag:** Global flag placement (`openclaw-secure --backend op run -- ...`)

### Error Handling
- **Missing Secrets:** Best Effort — warn but launch the child process (let app handle missing config)
- **Backend Failure:** Retry with Backoff — try 3 times before failing
- **Exit Code:** Pass Through — wrapper exits with same code as child
- **Internal Errors:** Print to `stderr`

### Verbosity / Logging
- **Standard Output:** Silent by default (only child output shown)
- **Debug Mode:** Enabled via `--debug` flag
- **Secret Masking:** Show values in debug mode (useful for troubleshooting injection)
- **Prefixing:** Use `[openclaw-secure]` prefix for wrapper logs to distinguish from child output

### Claude's Discretion
- Exact retry backoff timing (e.g., exponential vs linear)
- Specific text of warning messages
- Internal code structure for the runner

</decisions>

<specifics>
## Specific Ideas

- The `run` command should be "transparent" — if I run `openclaw-secure run -- ls -la`, it should feel exactly like running `ls -la` but with extra env vars.
- Secrets should be scrubbed from the process environment object in memory immediately after spawn, to prevent leakage via heap dumps or inspection.

</specifics>

<deferred>
## Deferred Ideas

- **Windows Support:** Out of scope for now (focused on POSIX/tmux)
- **Interactive TTY features:** Phase 2 (signals, resize)

</deferred>

---

*Phase: 01-generic-execution-engine*
*Context gathered: 2026-02-02*
