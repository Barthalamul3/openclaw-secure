import { spawn, spawnSync, execSync } from 'node:child_process';
import { createBackend } from '../backends/index.js';
import { DEFAULT_SECRET_MAP, DEFAULT_BACKEND } from '../constants.js';
import { loadPreferences } from '../preferences.js';

export function killTree(pid: number, signal: NodeJS.Signals | number = 'SIGTERM'): void {
  try {
    // pgrep -P <pid> lists child PIDs.
    // We catch error because pgrep returns exit code 1 if no processes found.
    const childPidsString = execSync(`pgrep -P ${pid}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();

    if (childPidsString) {
      const childPids = childPidsString.split(/\s+/).map(p => parseInt(p, 10));
      for (const childPid of childPids) {
        killTree(childPid, signal);
      }
    }
  } catch (e) {
    // pgrep failed (likely no children), ignore
  }

  try {
    process.kill(pid, signal);
  } catch (e: any) {
    // ESRCH means process doesn't exist, which is fine (already dead)
    if (e.code !== 'ESRCH') {
      console.warn(`Failed to kill process ${pid}:`, e.message);
    }
  }
}

export async function run(commandParts: string[], options: any): Promise<void> {
  if (commandParts.length === 0) {
    console.error('Error: No command provided to run.');
    process.exit(1);
  }

  const prefs = await loadPreferences();
  const backendName = options.backend || prefs.backend || DEFAULT_BACKEND;
  const backend = createBackend(backendName, prefs);

  if (!await backend.available()) {
    console.warn(`Warning: Backend ${backendName} is not available. Secrets may not be injected.`);
    // We proceed anyway as "Best Effort" is requested
  }

  // 1. Fetch keys & build env map
  const envUpdates: Record<string, string> = {};

  for (const entry of DEFAULT_SECRET_MAP) {
    try {
      // Retry with Backoff for failures
      let val: string | null = null;
      let attempts = 0;
      while (attempts < 3) {
        try {
          val = await backend.get(entry.keychainName);
          break;
        } catch (e) {
          attempts++;
          if (attempts >= 3) console.warn(`Failed to fetch ${entry.keychainName}:`, e);
          await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempts)));
        }
      }

      if (val !== null) {
        const envName = `OPENCLAW_SECURE_${entry.keychainName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
        envUpdates[envName] = val;
      } else {
        console.warn(`Warning: Secret ${entry.keychainName} not found in backend.`);
      }
    } catch (e) {
      console.warn(`Error processing ${entry.keychainName}:`, e);
    }
  }

  // 2. Construct child env
  const childEnv = { ...process.env, ...envUpdates };

  // 3. Spawn child
  const command = commandParts[0];
  const args = commandParts.slice(1);

  const child = spawn(command, args, {
    stdio: 'inherit',
    env: childEnv
  });

  const childPid = child.pid;

  // 4. Signal Handling
  // We ignore SIGINT so the child (TUI) can handle it (Ctrl+C).
  // If child doesn't handle it, it will terminate and we will exit via 'exit' event.
  process.on('SIGINT', () => {
    // Do nothing, let child handle it via inherited stdio
  });

  // Handle SIGTERM with graceful timeout
  let terminationInProgress = false;

  const handleTermination = () => {
    if (terminationInProgress || !childPid) return;
    terminationInProgress = true;

    // Send SIGTERM to child
    try {
        process.kill(childPid, 'SIGTERM');
    } catch (e: any) {
        if (e.code === 'ESRCH') {
            process.exit(0);
        }
    }

    // Wait 5000ms then force kill
    const timeout = setTimeout(() => {
        killTree(childPid, 'SIGKILL');
        process.exit(1); // Force exit wrapper
    }, 5000);

    // If child exits before timeout, 'exit' handler clears timeout
    child.once('exit', () => {
        clearTimeout(timeout);
    });
  };

  process.on('SIGTERM', handleTermination);

  // 5. Wait for exit
  child.on('exit', (code) => {
    // Clean up terminal state if TTY
    if (process.stdin.isTTY && code !== 0) {
        try {
            spawnSync('stty', ['sane'], { stdio: 'inherit' });
        } catch (e) {
            // ignore if stty fails
        }
    }
    process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    console.error(`Failed to start command: ${err.message}`);
    process.exit(1);
  });
}
