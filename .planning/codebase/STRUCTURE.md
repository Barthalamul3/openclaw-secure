# Codebase Structure

**Analysis Date:** 2026-02-02

## Directory Layout

```
openclaw-secure/
├── src/                # Source code (TypeScript)
│   ├── backends/       # Secret provider implementations
│   ├── cli.ts          # CLI entry point
│   ├── index.ts        # Library entry point
│   └── [core files]    # config.ts, constants.ts, etc.
├── tests/              # Test suite (Vitest)
│   └── backends/       # Backend-specific tests
├── dist/               # Compiled output (generated)
├── package.json        # Project manifest
└── tsconfig.json       # TypeScript config
```

## Directory Purposes

**`src/`:**
- Purpose: Core application logic.
- Contains: TypeScript source files.
- Key files: `cli.ts`, `index.ts`, `config.ts`.

**`src/backends/`:**
- Purpose: Implementations of different secret storage backends.
- Contains: `types.ts` (interfaces), `index.ts` (factory), and specific provider files (e.g., `onepassword.ts`).
- Key files: `src/backends/index.ts`, `src/backends/base.ts`.

**`tests/`:**
- Purpose: Unit and integration tests.
- Contains: Test files mirroring source structure.

## Key File Locations

**Entry Points:**
- `src/cli.ts`: Main CLI executable logic (Commander.js setup).
- `src/index.ts`: API exports for programmatic use.

**Configuration:**
- `src/config.ts`: Logic for reading/writing the target application config (`clawdbot.json`).
- `src/preferences.ts`: Logic for reading tool preferences (`.openclaw-secure.json`).
- `src/constants.ts`: System-wide constants (paths, defaults).

**Core Logic:**
- `src/launchagent.ts`: Management of macOS launch agents.
- `src/paths.ts`: Utility for deep object access using dot notation.

**Testing:**
- `vitest.config.ts`: Test runner configuration.

## Naming Conventions

**Files:**
- camelCase or kebab-case (mostly kebab-case for files like `aws-secrets.ts`).
- `.ts` extension for source, `.js` in imports (ESM requirement).

**Directories:**
- lowercase, kebab-case (`backends`).

## Where to Add New Code

**New Secret Backend:**
1. Create implementation: `src/backends/[provider].ts` implementing `SecretBackend`.
2. Register in factory: `src/backends/index.ts` (add to `createBackend` and `BACKEND_NAMES`).
3. Add tests: `tests/backends/[provider].test.ts`.

**New CLI Command:**
- Edit `src/cli.ts` to add `.command(...)`.

**New Config Utility:**
- Edit `src/config.ts` or add utility in `src/utils/` (if created).

## Special Directories

**`dist/`:**
- Purpose: Build artifacts created by `tsup`.
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-02-02*
