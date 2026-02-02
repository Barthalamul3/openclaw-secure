# External Integrations

**Analysis Date:** 2026-02-02

## APIs & External Services

**Secret Management (via CLI):**
The application integrates with secret providers by spawning their CLI tools.
- **macOS Keychain:** via `/usr/bin/security`
- **1Password:** via `op` CLI
- **Bitwarden:** via `bw` CLI
- **LastPass:** via `lpass` CLI
- **AWS Secrets Manager:** via `aws` CLI
- **Google Cloud Secret Manager:** via `gcloud` CLI
- **Azure Key Vault:** via `az` CLI
- **GNU Pass:** via `pass` CLI
- **Doppler:** via `doppler` CLI
- **HashiCorp Vault:** via `vault` CLI

## Data Storage

**Configuration:**
- `~/.openclaw/openclaw.json` (Default): Target configuration file where secrets are injected/replaced.
- `~/.openclaw-secure.json`: User preferences for `openclaw-secure` itself.

**File Storage:**
- Local filesystem only.

**Caching:**
- None. Secrets are retrieved on-demand or held in-memory during `start` process.

## Authentication & Identity

**Auth Provider:**
- Relies on the authentication state of the underlying CLI tools (e.g., user must be logged in to `op`, `aws`, etc.).
- No internal user management.

## Monitoring & Observability

**Error Tracking:**
- None. Errors are printed to stderr/console.

**Logs:**
- Console output (`console.log`, `console.error`).

## CI/CD & Deployment

**CI Pipeline:**
- Local scripts defined: `npm test`, `npm run lint`.
- No generic CI configuration detected in root (GitHub Actions workflows not visible in initial `ls`).

## Environment Configuration

**Required env vars:**
- None enforced by the application itself.
- Relies on environment variables required by child CLIs (e.g., `AWS_PROFILE`, `OP_SERVICE_ACCOUNT_TOKEN`).

**Secrets location:**
- Stored in the respective backend vaults.
- Placeholders stored in local config files (e.g., `[STORED_IN_KEYCHAIN]`).

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None.

---

*Integration audit: 2026-02-02*
