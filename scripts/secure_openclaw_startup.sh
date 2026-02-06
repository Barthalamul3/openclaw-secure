#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting OpenClaw secure gateway..."

########################################
# ENVIRONMENT
########################################
export NVM_DIR="/home/earls/.nvm"
export PATH="/home/earls/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin:${PATH:-}"
export XDG_RUNTIME_DIR="/run/user/$(id -u)"

########################################
# DEFAULTS / CONFIG
########################################
PORT=18789

# systemd-creds usually sets this; if not, fall back to common credential dir
CREDENTIALS_DIRECTORY="${CREDENTIALS_DIRECTORY:-/run/credentials/openclaw-secure.service}"
GPG_PASSPHRASE_FILE="${CREDENTIALS_DIRECTORY}/gpg_passphrase"

BW_MASTER_PASSWORD_FILE="/home/earls/bw_master_password.gpg"
OPENCLAW_CONFIG_PATH="/home/earls/.openclaw/openclaw.json"
OPENCLAW_SECURE_BIN="/home/earls/Documents/ClawdBrainVault/Projects/openclaw-secure/dist/cli.js"

########################################
# SECURITY CHECKS
########################################
ensure_secure_state() {
  echo "🔒 Verifying security posture..."

  # 1. Integrity Check & Auto-Restore
  if [[ -f "$OPENCLAW_CONFIG_PATH" ]]; then
      if [[ ! -s "$OPENCLAW_CONFIG_PATH" ]]; then
          echo "⚠️  Config file is empty (0 bytes)! Attempting restore from backup..."
          if [[ -f "${OPENCLAW_CONFIG_PATH}.bak.safe" ]]; then
              cp "${OPENCLAW_CONFIG_PATH}.bak.safe" "$OPENCLAW_CONFIG_PATH"
              echo "✅ Restored from safe backup."
          else
              echo "❌ Critical: Config is empty and no safe backup found."
              return 1
          fi
      else
          # Create a safe backup of the known-good config
          cp "$OPENCLAW_CONFIG_PATH" "${OPENCLAW_CONFIG_PATH}.bak.safe"
          chmod 600 "${OPENCLAW_CONFIG_PATH}.bak.safe"
      fi
      chmod 600 "$OPENCLAW_CONFIG_PATH" || true
  fi

  # If the file contains raw master password, kill gateway immediately
  if [[ -f "$OPENCLAW_CONFIG_PATH" ]] && grep -q "bitwarden_master_password" "$OPENCLAW_CONFIG_PATH"; then
    echo "⚠️  WARNING: Config file appears dirty! Killing gateway on port $PORT..."
    fuser -k -TERM "$PORT/tcp" || true
    sleep 2
    return 1
  fi
  return 0
}

is_gateway_running() {
  ss -tln | grep -q ":$PORT" && return 0 || return 1
}

########################################
# MAIN
########################################

# 1) Clean Slate Protocol
# If systemd is starting us, we expect to be the one true instance.
# Any existing process on this port is a zombie or conflict.
if is_gateway_running; then
  echo "🧹 Cleaning up existing process on port $PORT..."
  fuser -k -TERM "$PORT/tcp" || true
  sleep 1
fi

# Double check
if is_gateway_running; then
   echo "⚠️  Port $PORT still in use after kill signal. Forcing kill..."
   fuser -k -KILL "$PORT/tcp" || true
   sleep 1
fi

echo "✨  Port $PORT is clear. Proceeding with fresh startup..."

########################################
# 2) Unlock Bitwarden Session
########################################
  command -v bw >/dev/null 2>&1 || { echo "❌  Error: 'bw' not found in PATH."; exit 1; }
  [[ -f "$BW_MASTER_PASSWORD_FILE" ]] || { echo "❌  Error: Missing $BW_MASTER_PASSWORD_FILE"; exit 1; }
  [[ -f "$GPG_PASSPHRASE_FILE" ]] || { echo "❌  Error: Passphrase file missing at $GPG_PASSPHRASE_FILE"; exit 1; }

  echo "🔓 Decrypting BW master password..."
  GPG_PASSPHRASE="$(cat "$GPG_PASSPHRASE_FILE")"
  BW_MASTER_PASSWORD="$(
    printf '%s' "$GPG_PASSPHRASE" | gpg --batch --pinentry-mode loopback --passphrase-fd 0 --decrypt "$BW_MASTER_PASSWORD_FILE"
  )"

  echo "🔓 Unlocking Bitwarden..."
  BW_OUTPUT="$(bw unlock "$BW_MASTER_PASSWORD" --raw 2>&1)"
  if [[ "$?" -ne 0 ]]; then
      echo "❌ Error unlocking Bitwarden:"
      echo "$BW_OUTPUT"
      exit 1
  fi
  export BW_SESSION="$BW_OUTPUT"
  echo "✅ Bitwarden session key length: ${#BW_SESSION}"

  if [[ -z "${BW_SESSION:-}" ]]; then
    echo "❌  Error: Bitwarden unlock failed (empty BW_SESSION)."
    exit 1
  fi

  ########################################
  # 2) Launch via OpenClaw-Secure
  ########################################
  echo "🚀 Launching OpenClaw Gateway (via openclaw-secure)..."
  exec node "$OPENCLAW_SECURE_BIN" start \
    --backend bitwarden \
    --config "$OPENCLAW_CONFIG_PATH" \
    --timeout 30000
fi

# If we ever get here, something is wrong because we exec'd above.
echo "❌  Unexpected: startup script reached end without exec."
exit 1
