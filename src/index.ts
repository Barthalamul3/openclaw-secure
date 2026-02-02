import { readConfig, writeConfig } from './config.js';
import { setByPath, getByPath } from './paths.js';
import type { SecretMap, KeyCheckResult, StoreResult } from './types.js';
import type { SecretBackend } from './backends/types.js';
import { KEYCHAIN_PLACEHOLDER } from './constants.js';

// Exports for other modules
export {
  createBackend, BACKEND_NAMES,
  KeychainBackend, OnePasswordBackend, BitwardenBackend, LastPassBackend,
  AwsSecretsBackend, GCloudSecretsBackend, AzureKeyVaultBackend,
  PassBackend, DopplerBackend, VaultBackend,
} from './backends/index.js';
export type { SecretBackend, BackendOptions, BackendName } from './backends/index.js';

export { readConfig, writeConfig, backupConfig, expandPath } from './config.js';
export { getByPath, setByPath, hasPath } from './paths.js';
export { loadPreferences, PREFERENCES_PATH } from './preferences.js';
export type { Preferences } from './preferences.js';
export { findPlist, readPlist, backupPlist, installSecure, uninstallSecure } from './launchagent.js';
export type { PlistConfig, InstallOptions } from './launchagent.js';
export {
  KEYCHAIN_PLACEHOLDER,
  DEFAULT_CONFIG_PATH,
  DEFAULT_SECRET_MAP,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_BACKEND,
} from './constants.js';
export type { SecretEntry, SecretMap, KeyCheckResult, StoreResult, StartOptions } from './types.js';

/**
 * Store keys: Reads config, saves to backend, writes Env Var reference to disk.
 */
export async function storeKeys(
  configPath: string,
  secretMap: SecretMap,
  backend: SecretBackend,
): Promise<StoreResult[]> {
  let config = await readConfig(configPath);
  const results: StoreResult[] = [];

  for (const entry of secretMap) {
    const value = getByPath(config, entry.configPath);
    // Skip if it's already an env var reference or placeholder
    if (typeof value === 'string' && !value.startsWith('${') && !value.startsWith('[')) {
      await backend.set(entry.keychainName, value);
      
      // Update config with Env Var Reference
      const envName = `OPENCLAW_SECURE_${entry.keychainName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
      config = setByPath(config, entry.configPath, `\${${envName}}`);
      
      results.push({ keychainName: entry.keychainName, configPath: entry.configPath, stored: true, skipped: false });
    }
  }

  await writeConfig(configPath, config);
  return results;
}

export async function checkKeys(secretMap: SecretMap, backend: SecretBackend): Promise<KeyCheckResult[]> {
  const results: KeyCheckResult[] = [];
  for (const entry of secretMap) {
    const value = await backend.get(entry.keychainName);
    results.push({ keychainName: entry.keychainName, configPath: entry.configPath, exists: value !== null });
  }
  return results;
}

/**
 * scrubKeys: REWRITTEN
 * Writes ${OPENCLAW_SECURE_...} references to the config file.
 */
export async function scrubKeys(configPath: string, secretMap: SecretMap): Promise<void> {
  let config = await readConfig(configPath);
  let count = 0;

  for (const entry of secretMap) {
    // Generate Env Var Name
    const envName = `OPENCLAW_SECURE_${entry.keychainName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    // Force write the ${VAR} syntax
    config = setByPath(config, entry.configPath, `\${${envName}}`);
    count++;
  }

  await writeConfig(configPath, config);
  console.log(`  ✔ Config scrubbed: Injected \${VAR} references for ${count} keys`);
}

/**
 * Updates config with valid references for found keys and placeholders for missing ones.
 */
export async function updateConfigReferences(
  configPath: string,
  foundKeys: SecretMap,
  missingKeys: SecretMap
): Promise<void> {
  let config = await readConfig(configPath);
  let scrubbed = 0;
  let restored = 0;

  for (const entry of foundKeys) {
    const envName = `OPENCLAW_SECURE_${entry.keychainName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    config = setByPath(config, entry.configPath, `\${${envName}}`);
    scrubbed++;
  }

  for (const entry of missingKeys) {
    config = setByPath(config, entry.configPath, KEYCHAIN_PLACEHOLDER);
    restored++;
  }

  await writeConfig(configPath, config);

  if (scrubbed > 0) console.log(`  ✔ Injected \${VAR} references for ${scrubbed} keys`);
  if (restored > 0) console.log(`  ✔ Restored placeholders for ${restored} missing keys`);
}
