# Project State

## Project Reference
- **Core Value:** Securely inject secrets into OpenClaw processes without exposing them on the filesystem.
- **Current Focus:** Implementing generic command execution to support TUI launching.

## Current Position
- **Phase:** 1 - Generic Execution Engine
- **Status:** Planned
- **Progress:** ░░░░░░░░░░ 0%

## Context & Decisions
- **Architecture:** Extends existing `start` command logic into a generic `run` command.
- **Dependencies:** Uses `child_process.spawn` with `stdio: 'inherit'` for minimal overhead.
- **Blockers:** None.

## Session Continuity
- **Last Action:** Roadmap creation.
- **Next Step:** Implement `src/commands/run.ts` skeleton.
