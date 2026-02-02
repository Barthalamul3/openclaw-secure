#!/bin/bash
set -e

# --- Environment ---
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
  
  # 1. Lock down file permissions (Only User R/W)
  if [ -f "$OPENCLAW_CONFIG_PATH" ]; then
    chmod 600 "$OPENCLAW_CONFIG_PATH"
  fi
  
  # 2. Check for "Dirty" Config
  # If the file contains the raw master password field, it wasn't scrubbed.
  if grep -q "bitwarden_master_password" "$OPENCLAW_CONFIG_PATH"; then
    echo "⚠️  WARNING: Config file appears dirty (contains secrets)!"
    echo "♻️  Killing unsafe process to force a secure scrub..."
    
    # Kill the process holding the port so we can restart fresh
    fuser -k -TERM "$PORT/tcp" || true
    sleep 2
    return 1 # Return failure to trigger a restart
  fi
  
  echo "✅ Config appears scrubbed and secure."
  return 0
}

# --- Helper: Check if Gateway is Alive ---
is_gateway_running() {
  if ss -tln | grep -q ":$PORT"; then
    return 0
  else
    return 1
  fi
}

# --- Main Logic ---
if is_gateway_running; then
  echo "⚠️  Gateway detected on port $PORT."
  
  # SECURITY CHECK: If the running process left a dirty config, we kill it.
  if ensure_secure_state; then
    echo "✅ Adopting existing secure process..."
  else
    # The function killed the process, so we fall through to the fresh start logic
    echo "🔄 Restarting due to security failure..."
  fi
fi

# Double check: Is it effectively running now? If not, start it.
if ! is_gateway_running; then
  echo "✨ Port $PORT is clear. Proceeding with fresh startup..."

  # --- Credentials ---
  if [ -f "$GPG_PASSPHRASE_FILE" ]; then
      GPG_PASSPHRASE=$(cat "$GPG_PASSPHRASE_FILE")
      
      echo "Decrypting Master Password..."
      BW_MASTER_PASSWORD=$(echo "$GPG_PASSPHRASE" | gpg --batch --pinentry-mode loopback --passphrase-fd 0 --decrypt "$BW_MASTER_PASSWORD_FILE")
      
      echo "Unlocking Bitwarden..."
      export BW_SESSION=$(node $(which bw) unlock "$BW_MASTER_PASSWORD" --raw)
      
      if [ -z "$BW_SESSION" ]; then
          echo "❌ Error: Bitwarden unlock failed."
          exit 1
      fi
  else
      echo "❌ Error: Passphrase file missing."
      exit 1
  fi

  # --- Launch ---
  echo "🚀 Launching OpenClaw Gateway..."
  node "$OPENCLAW_SECURE_BIN" start --backend bitwarden --config "$OPENCLAW_CONFIG_PATH" --timeout 30000
  
  # Final verify after launch
  sleep 5
  ensure_secure_state
fi

# --- Monitor Loop ---
echo "👀  Entering Monitor Mode. Watching port $PORT..."
while true; do
  if ! is_gateway_running; then
    echo "❌  CRITICAL: Gateway lost on port $PORT. Exiting to trigger restart."
    exit 1
  fi
  sleep 15
done
