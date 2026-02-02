# Architecture

**Analysis Date:** 2026-02-02

## Pattern Overview

**Overall:** Secret Injection / Sidecar Wrapper

**Key Characteristics:**
- **Hardware-Gated:** Relies on system-level secure storage (Keychain, TPM-backed vaults).
- **Just-in-Time Injection:** Secrets are only exposed as environment variables to specific child processes, never written to disk in plain text during runtime.
- **Placeholder Replacement:** Config files are scrubbed to contain references (`${OPENCLAW_SECURE_...}`) instead of raw secrets.

## Layers

**CLI / Entry Layer:**
- Purpose: Handles user commands (`store`, `check`, `start`) and argument parsing.
- Location: `src/cli.ts`
- Contains: Commander.js definitions, process spawning logic.
- Depends on: Core Logic, Backends.

**Core Logic Layer:**
- Purpose: Orchestrates the flow of secret management.
- Location: `src/index.js`, `src/config.ts`, `src/launchagent.ts`
- Contains: `storeKeys`, `checkKeys`, `scrubKeys` functions.
- Depends on: Backend Interface, File System.
- Used by: CLI Layer.

**Backend Abstraction Layer:**
- Purpose: Provides a unified interface for diverse secret stores.
- Location: `src/backends/types.ts`, `src/backends/index.ts`
- Contains: `SecretBackend` interface, factory function `createBackend`.
- Depends on: None (pure types/interfaces).
- Used by: Core Logic Layer.

**Backend Implementation Layer:**
- Purpose: Adapts specific secret providers to the generic interface.
- Location: `src/backends/*.ts` (e.g., `keychain.ts`, `onepassword.ts`)
- Contains: Provider-specific logic, often shelling out to external CLIs (`op`, `security`).
- Depends on: External System Binaries.

## Data Flow

**Store Secrets Flow (`store`):**
1. Read plain-text config or existing placeholders from `src/config.ts`.
2. Iterate through defined secret paths (`DEFAULT_SECRET_MAP`).
3. Send secret value to selected Backend (e.g., 1Password).
4. Receive confirmation.
5. Replace secret in config object with variable reference (`${OPENCLAW_SECURE_KEY}`).
6. Write scrubbed config back to disk.

**Start Gateway Flow (`start`):**
1. Initialize Backend based on preferences.
2. Fetch all secrets defined in `DEFAULT_SECRET_MAP` from Backend.
3. Construct environment variable map (`OPENCLAW_SECURE_KEY=actual_secret`).
4. Spawn Gateway process (child) with injected environment.
5. Monitor child process; keys remain in memory only within the process tree.

## Key Abstractions

**SecretBackend:**
- Purpose: Interface for all secret storage providers.
- Examples: `src/backends/types.ts`
- Pattern: Strategy Pattern.

**SecretMap:**
- Purpose: Maps config JSON paths to keychain identifier names.
- Examples: `src/constants.ts` (implied `DEFAULT_SECRET_MAP`).

## Entry Points

**CLI (`openclaw-secure`):**
- Location: `src/cli.ts`
- Triggers: User shell commands.
- Responsibilities: Parsing args, loading prefs, initiating flows, process management.

**Library Export:**
- Location: `src/index.ts`
- Triggers: programmatic usage (rare, mostly for testing or integration).
- Responsibilities: Exposing core functions `storeKeys`, `readConfig`.

## Error Handling

**Strategy:** Fail-fast with descriptive errors for CLI users.

**Patterns:**
- **Backend Availability:** `backend.available()` check before operations.
- **Config Backup:** `backupConfig` in `src/config.ts` creates `.bak` files before writing to prevent corruption.
- **Process Cleanup:** `SIGINT`/`SIGTERM` handlers in `src/cli.ts` ensure gateway shutdown.

## Cross-Cutting Concerns

**Logging:**
- Simple `console.log` / `console.error` in CLI.

**Configuration:**
- JSON-based config with dot-notation access (`src/paths.ts`).
- User preferences in `~/.openclaw-secure.json` (`src/preferences.ts`).

**Security:**
- Secrets scrubbed from disk.
- File permissions managed (0o600) in `src/config.ts`.

---

*Architecture analysis: 2026-02-02*
