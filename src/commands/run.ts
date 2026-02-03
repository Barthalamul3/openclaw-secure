import { spawn } from 'node:child_process';
import { createBackend } from '../backends/index.js';
import { DEFAULT_SECRET_MAP, DEFAULT_BACKEND } from '../constants.js';
import { loadPreferences } from '../preferences.js';

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
    // We proceed anyway as "Best Effort" is requested, but maybe we should fail if backend is explicitly requested?
    // Plan says: "Best Effort: warn on missing secrets"
  }

  // 1. Fetch keys & build env map
  const envUpdates: Record<string, string> = {};

  // Parallel fetch could be better but let's stick to simple loop or Promise.all
  // The start command does it sequentially in the loop. We can optimize or keep it simple.
  // Plan says "Best Effort: warn on missing secrets, Retry with Backoff for failures".
  // Retry logic isn't in 'start' command, but requested here.

  for (const entry of DEFAULT_SECRET_MAP) {
    try {
      // Simple retry logic? Or just direct fetch?
      // "Retry with Backoff for failures"
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

  // We use shell: true to support complex commands if passed as a single string,
  // but if passed as [cmd, arg1, arg2], we might want shell: false or handle it carefully.
  // The 'start' command uses shell: true.
  // If the user types `openclaw-secure run -- echo "hello"`, commandParts is ['echo', 'hello'].
  // usage of spawn(command, args, options) is standard.

  const child = spawn(command, args, {
    stdio: 'inherit',
    env: childEnv
  });

  // 4. Wait for exit
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    console.error(`Failed to start command: ${err.message}`);
    process.exit(1);
  });
}
