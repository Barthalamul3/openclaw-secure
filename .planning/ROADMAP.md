# Roadmap: OpenClaw Secure Wrapper

**Goal:** Extend `openclaw-secure` to support generic command execution and interactive TUI wrapping, enabling secure remote access via tmux.

## Phases

### Phase 1: Generic Execution Engine
**Goal:** Users can execute arbitrary commands with injected secrets via a new `run` command.

This phase generalizes the secret injection logic from the specific `start` command to a generic `run -- <cmd>` interface, ensuring secrets are injected into the environment and scrubbed upon exit.

**Requirements:**
- EXEC-01: Arbitrary command execution
- EXEC-02: Secret injection into child environment
- EXEC-03: Secret scrubbing on exit

**Success Criteria:**
1. User can run `openclaw-secure run -- printenv` and see decrypted secrets in output.
2. User can run standard CLI tools (e.g., `ls`, `whoami`) through the wrapper.
3. Secrets are verified to be removed/inaccessible after the child process terminates.
4. Wrapper handles command arguments correctly (e.g., flags passed to child, not parent).

### Phase 2: Interactive TTY Support
**Goal:** Users can run interactive TUIs with full terminal capabilities and signal handling.

This phase focuses on the "transparency" of the wrapper, ensuring it passes through all terminal signals (resize, interrupt) and handles standard I/O streams correctly for interactive applications like the OpenClaw TUI.

**Requirements:**
- TTY-01: Stdio inheritance (colors, cursor)
- TTY-02: SIGWINCH forwarding (resize support)
- TTY-03: Signal handling (SIGINT/SIGTERM)

**Success Criteria:**
1. User can run interactive tools (e.g., `nano`, `top`) via the wrapper without graphical corruption.
2. Resizing the terminal window correctly resizes the application running inside the wrapper.
3. Pressing Ctrl+C (SIGINT) cleanly terminates the child process and performs secret cleanup.
4. Terminal colors and special keys are preserved.

### Phase 3: Boot Integration
**Goal:** System automatically launches Gateway and TUI in secure sessions on boot.

This phase updates the deployment scripts to utilize the new `run` command, setting up the target environment where the Gateway runs in the background and the TUI runs in a distinct, accessible tmux session.

**Requirements:**
- BOOT-01: Startup script launches Gateway
- BOOT-02: Startup script launches TUI in secure session

**Success Criteria:**
1. Executing the startup script creates the expected tmux session structure.
2. The Gateway is running and functional with secrets.
3. The TUI is running inside the secure wrapper within a tmux window.
4. User can attach to the tmux session and interact with the TUI immediately.

## Progress

| Phase | Status | Completion |
|-------|--------|------------|
| 1. Generic Execution Engine | **Planned** | 0% |
| 2. Interactive TTY Support | Pending | 0% |
| 3. Boot Integration | Pending | 0% |
