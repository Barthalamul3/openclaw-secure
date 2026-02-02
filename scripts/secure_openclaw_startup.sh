#!/bin/bash
set -e

# --- Environment ---
# Ensure these paths match your actual node installation
export NVM_DIR="/home/earls/.nvm"
export PATH="/home/earls/.nvm/versions/node/v24.13.0/bin:$PATH:/usr/bin:/bin"
export XDG_RUNTIME_DIR=/run/user/$(id -u)

# --- Configuration ---
PORT=18789
GPG_PASSPHRASE_FILE="${CREDENTIALS_DIRECTORY}/gpg_passphrase"
BW_MASTER_PASSWORD_FILE="/home/earls/bw_master_password.gpg"
OPENCLAW_CONFIG_PATH="/home/earls/.openclaw/openclaw.json"
OPENCLAW_SECURE_BIN="/home/earls/Documents/ClawdBrainVault/Projects/openclaw-secure/dist/cli.js"

# --- Function: Verify Security ---
ensure_secure_state() {
  echo "🔒 Verifying security posture..."
  if [ -f "$OPENCLAW_CONFIG_PATH" ]; then
    chmod 600 "$OPENCLAW_CONFIG_PATH"
  fi
  # If the file contains the raw master password, kill the process
  if grep -q "bitwarden_master_password" "$OPENCLAW_CONFIG_PATH"; then
    echo "⚠️  WARNING: Config file appears dirty!"
    fuser -k -TERM "$PORT/tcp" || true
    sleep 2
    return 1
  fi
  return 0
}

# --- Helper: Check if Gateway is Alive ---
is_gateway_running() {
  if ss -tln | grep -q ":$PORT"; then return 0; else return 1; fi
}

# --- Main Logic ---
if is_gateway_running; then
  echo "⚠️  Gateway detected on port $PORT. Checking security..."
  if ! ensure_secure_state; then
    echo "🔄 Restarting due to security failure..."
  fi
fi

if ! is_gateway_running; then
  echo "✨ Port $PORT is clear. Proceeding with fresh startup..."

  # --- 1. Unlock Bitwarden Session ---
  if [ -f "$GPG_PASSPHRASE_FILE" ]; then
      # Decrypt the master password using the systemd credential
      GPG_PASSPHRASE=$(cat "$GPG_PASSPHRASE_FILE")
      BW_MASTER_PASSWORD=$(echo "$GPG_PASSPHRASE" | gpg --batch --pinentry-mode loopback --passphrase-fd 0 --decrypt "$BW_MASTER_PASSWORD_FILE")
      
      # Unlock Bitwarden to get the SESSION KEY
      echo "🔓 Unlocking Bitwarden..."
      export BW_SESSION=$(node $(which bw) unlock "$BW_MASTER_PASSWORD" --raw)
      
      if [ -z "$BW_SESSION" ]; then
          echo "❌ Error: Bitwarden unlock failed."
          exit 1
      fi
  else
      echo "❌ Error: Passphrase file missing at $GPG_PASSPHRASE_FILE"
      exit 1
  fi

  # --- 2. Launch via OpenClaw-Secure ---
  # This command handles the "File Write -> Spawn -> File Scrub" lifecycle
  echo "🚀 Launching OpenClaw Gateway..."
  node "$OPENCLAW_SECURE_BIN" start \
    --backend bitwarden \
    --config "$OPENCLAW_CONFIG_PATH" \
    --timeout 30000
  
  sleep 5
  ensure_secure_state
fi

# --- Monitor Loop ---
echo "👀  Entering Monitor Mode. Watching port $PORT..."
while true; do
  if ! is_gateway_running; then
    echo "❌  CRITICAL: Gateway lost. Exiting."
    exit 1
  fi
  sleep 15
done
