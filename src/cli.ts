#!/usr/bin/env node
import { Command } from 'commander';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createBackend } from './backends/index.js';
import { readConfig, writeConfig } from './config.js';
import { scrubKeys, checkKeys, storeKeys } from './index.js';
import { setByPath } from './paths.js';
import {
  DEFAULT_CONFIG_PATH,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_GATEWAY_COMMAND,
  DEFAULT_SECRET_MAP,
  DEFAULT_BACKEND,
  PREFERENCES_PATH,
} from './constants.js';

function resolvePath(p: string): string {
  if (p.startsWith('~/')) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

async function getPreferences(): Promise<Record<string, any>> {
  try {
    const content = await readFile(resolvePath(PREFERENCES_PATH), 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function waitForHealth(port: number, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

const program = new Command();

program
  .name('openclaw-secure')
  .description('Hardware-gated secret management for OpenClaw')
  .version('1.0.0');

program.command('store')
  .description('Read secrets from config and store in backend')
  .option('-b, --backend <name>', 'Secret backend')
  .option('-c, --config <path>', 'Config file path')
  .action(async (options) => {
    const prefs = await getPreferences();
    const configPath = options.config || DEFAULT_CONFIG_PATH;
    const backendName = options.backend || prefs.backend || DEFAULT_BACKEND;
    const backend = createBackend(backendName, prefs);
    console.log(`Storing keys to ${backendName}...`);
    await storeKeys(configPath, DEFAULT_SECRET_MAP, backend);
    console.log('Done.');
  });

program.command('check')
  .description('Check if secrets exist in backend')
  .option('-b, --backend <name>', 'Secret backend')
  .action(async (options) => {
    const prefs = await getPreferences();
    const backendName = options.backend || prefs.backend || DEFAULT_BACKEND;
    const backend = createBackend(backendName, prefs);
    const results = await checkKeys(DEFAULT_SECRET_MAP, backend);
    results.forEach(r => console.log(`${r.keychainName}: ${r.exists ? '✔' : '✘'}`));
  });

program.command('start')
  .description('Securely start the gateway with env-var injected secrets')
  .option('-b, --backend <name>', 'Secret backend')
  .option('-c, --config <path>', 'Config file path')
  .option('-t, --timeout <ms>', 'Health check timeout')
  .action(async (options) => {
    const prefs = await getPreferences();
    const configPath = options.config || DEFAULT_CONFIG_PATH;
    const backendName = options.backend || prefs.backend || DEFAULT_BACKEND;
    const timeout = parseInt(options.timeout || String(DEFAULT_TIMEOUT_MS));
    
    const backend = createBackend(backendName, prefs);
    if (!await backend.available()) {
      console.error(`Backend ${backendName} is not available.`);
      process.exit(1);
    }

    const config = await readConfig(configPath);
    const envUpdates: Record<string, string> = {};
    let count = 0;
    
    console.log(`\n🚀 Secure gateway start (${backendName} backend)...`);
    console.log(`  → Fetching keys into environment...`);

    for (const entry of DEFAULT_SECRET_MAP) {
      const val = await backend.get(entry.keychainName);
      if (val) {
        const envName = `OPENCLAW_SECURE_${entry.keychainName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
        envUpdates[envName] = val;
        setByPath(config, entry.configPath, `\${${envName}}`);
        count++;
      }
    }
    
    await writeConfig(configPath, config);
    console.log(`  ✔ Config updated with \${VAR} references (${count} keys)`);

    console.log(`  → Starting gateway...`);
    const child = spawn(DEFAULT_GATEWAY_COMMAND, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...envUpdates }
    });
    
    console.log(`  → Waiting for gateway health (${timeout}ms timeout)...`);
    const healthy = await waitForHealth(18789, timeout);
    
    if (healthy) {
      console.log('  ✔ Gateway is healthy');
    } else {
      console.error('  ❌ Gateway health check timed out');
      await scrubKeys(configPath, DEFAULT_SECRET_MAP);
      child.kill();
      process.exit(1);
    }
    
    let cleaned = false;
    const cleanup = async () => {
      if (cleaned) return;
      cleaned = true;
      console.log('\nStopping gateway and scrubbing config...');
      child.kill();
      try {
        await scrubKeys(configPath, DEFAULT_SECRET_MAP);
        console.log('  ✔ Config scrubbed');
      } catch (e) {
        console.error('Scrub failed:', e);
      }
    };
    
    process.on('SIGINT', () => cleanup().then(() => process.exit(0)));
    process.on('SIGTERM', () => cleanup().then(() => process.exit(0)));
    
    await new Promise<void>((resolve) => {
      child.on('exit', (code) => {
        console.log(`Gateway exited with code ${code}`);
        cleanup().then(resolve);
      });
    });
  });

program.parse(process.argv);
