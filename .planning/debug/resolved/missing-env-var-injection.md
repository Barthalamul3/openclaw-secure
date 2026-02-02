---
status: resolved
trigger: "missing-env-var-injection: openclaw-secure start fails to inject OPENCLAW_SECURE_WEB_SEARCH_API_KEY"
created: 2026-02-02T12:00:00Z
updated: 2026-02-02T12:15:00Z
---

## Current Focus
hypothesis: The environment variable injection logic in the start command is failing to include OPENCLAW_SECURE_WEB_SEARCH_API_KEY.
test: Review the start command implementation and verify how secrets are retrieved and injected into the child process environment.
expecting: To find a logic error in how secrets are mapped to environment variables or passed to the child process.
next_action: Read src/cli.ts and related files to understand the start command flow.

## Symptoms
expected: Child process receives injected environment variables.
actual: Child process crashes with MissingEnvVarError: Missing env var "OPENCLAW_SECURE_WEB_SEARCH_API_KEY".
errors: |
  Failed to read config at /home/earls/.openclaw/openclaw.json MissingEnvVarError: Missing env var "OPENCLAW_SECURE_WEB_SEARCH_API_KEY" referenced at config path: tools.web.search.apiKey
reproduction: Run openclaw-secure start.
started: Immediately after startup.

## Eliminated

## Evidence
- `src/cli.ts` iterates `DEFAULT_SECRET_MAP` to fetch secrets.
- It builds `envUpdates` only for found secrets.
- It calls `scrubKeys(configPath, DEFAULT_SECRET_MAP)` passing the FULL map.
- `scrubKeys` in `src/index.ts` replaces config values with `${ENV_VAR}` for every entry in the map.
- Reproduction script confirms that missing backend keys result in missing env vars but present config placeholders.

## Resolution
root_cause: `src/cli.ts` called `scrubKeys` with the full `DEFAULT_SECRET_MAP` regardless of which secrets were actually found in the backend. This caused config values to be replaced with references to non-existent environment variables (`${OPENCLAW_SECURE_...}`) when a secret was missing from the backend.
fix: Updated `src/cli.ts` to filter `DEFAULT_SECRET_MAP` and only include keys that were successfully retrieved from the backend before passing them to `scrubKeys`. This ensures that if a key is missing from the backend, the config file retains its original value (e.g. plaintext) instead of being overwritten with a broken env var reference.
verification: Verified with `fix_validation.ts` script that missing keys are skipped during scrubbing while present keys are correctly injected.
files_changed:
  - src/cli.ts
