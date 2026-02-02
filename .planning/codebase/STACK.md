# Technology Stack

**Analysis Date:** 2026-02-02

## Languages

**Primary:**
- TypeScript 5.4+ - Used for all source code (`src/`).

**Secondary:**
- JavaScript (ESM) - Build artifacts in `dist/`.

## Runtime

**Environment:**
- Node.js >=22.0.0 (Targeting ES2024).

**Package Manager:**
- npm (Scripts defined in `package.json`, `package-lock.json` present).
- pnpm (`pnpm-lock.yaml` present).

## Frameworks

**Core:**
- Native Node.js - Zero runtime dependencies.
- Logic relies on `child_process` and `fs` modules.

**Testing:**
- Vitest ^2.0.0 - Test runner and assertions.
- Native mocks - Uses `vi.mock` / `vi.fn`.

**Build/Dev:**
- tsup ^8.0.0 - Bundler for ESM output.
- TypeScript - Type checking (`tsc --noEmit`).

## Key Dependencies

**Runtime:**
- None. The project follows a "Zero dependency" philosophy for production code.

**Dev Dependencies:**
- `tsup`: Build tool.
- `vitest`: Testing framework.
- `@types/node`: Type definitions.
- `typescript`: Compiler.

## Configuration

**Environment:**
- `~/.openclaw-secure.json`: User preferences (local).

**Build:**
- `tsconfig.json`: Strict TypeScript configuration (ES2024 target).
- `tsup.config.ts`: Build configuration for CLI and Library entry points.
- `vitest.config.ts`: Test runner configuration.

## Platform Requirements

**Development:**
- Node.js 22+.
- CLI tools for secret backends (e.g., `op`, `aws`, `security`) for integration testing.

**Production:**
- Linux or macOS.
- Access to secret management CLIs in the system `$PATH`.

---

*Stack analysis: 2026-02-02*
