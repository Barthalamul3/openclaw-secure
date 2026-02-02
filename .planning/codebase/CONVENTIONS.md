# Coding Conventions

**Analysis Date:** 2026-02-02

## Naming Patterns

**Files:**
- Kebab-case: `src/launchagent.ts`, `src/paths.ts`
- Tests mirror source names: `tests/paths.test.ts`

**Functions:**
- CamelCase: `readConfig`, `storeKeys`, `resolvePath`
- Action-oriented naming: `get...`, `set...`, `check...`

**Variables:**
- CamelCase: `configPath`, `backendName`
- Constants: UPPER_SNAKE_CASE: `DEFAULT_CONFIG_PATH`, `PREFERENCES_PATH`

**Types:**
- PascalCase: `SecretBackend`, `StoreResult`
- Interfaces generally do not use `I` prefix.

## Code Style

**Formatting:**
- No dedicated formatter configuration (Prettier/Biome) detected in root.
- Relies on developer discipline or IDE defaults.

**Linting:**
- Tool: TypeScript Compiler (`tsc`)
- Command: `npm run lint` -> `tsc --noEmit`
- Configuration: `tsconfig.json`
- Key rules:
  - `strict: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noImplicitReturns: true`

## Import Organization

**Order:**
1. Node.js built-ins (prefixed with `node:`): `import { spawn } from 'node:child_process';`
2. Third-party libraries: `import { Command } from 'commander';`
3. Internal modules: `import { readConfig } from './config.js';`

**Path Aliases:**
- Not used. Relative paths are used throughout.
- ESM requirement: Internal imports MUST include `.js` extension (e.g., `./types.js`).

## Error Handling

**Patterns:**
- `try/catch` blocks used for fallible operations (file I/O, network).
- CLI exits with code 1 on critical failures: `process.exit(1)`.
- Silent failures or empty returns for non-critical lookups (e.g., `getPreferences` returns `{}` on error).

## Logging

**Framework:**
- `console.log` for standard output.
- `console.error` for errors.
- Visual cues used in CLI: `✔`, `✘`, `🚀`.

## Comments

**When to Comment:**
- JSDoc comments used for exported functions to describe behavior.
- Section headers used within large functions (e.g., `// 1. Fetch keys...`).

**JSDoc/TSDoc:**
```typescript
/**
 * Store keys: Reads config, saves to backend, writes Env Var reference to disk.
 */
export async function storeKeys(...)
```

## Function Design

**Size:**
- Functions tend to be focused (SRP).
- `storeKeys` and `checkKeys` delegate specific logic to helpers.

**Parameters:**
- Typed arguments.
- Options objects used for CLI actions.

**Return Values:**
- `Promise<T>` for async operations.
- Explicit return types used on exported functions.

## Module Design

**Exports:**
- Named exports preferred over default exports.
- `src/index.ts` acts as a barrel file for the programmatic API.

**Barrel Files:**
- Used in `src/index.ts` to expose functionality from sub-modules.
- Used in `src/backends/index.ts` (referenced in imports).

---

*Convention analysis: 2026-02-02*
