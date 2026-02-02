import type { SecretMap } from './types.js';

export const KEYCHAIN_PLACEHOLDER = '[STORED_IN_KEYCHAIN]';
export const SERVICE_PREFIX = 'openclaw';
export const KEYCHAIN_ACCOUNT = 'openclaw';
export const DEFAULT_CONFIG_PATH = '~/.openclaw/openclaw.json';
export const PREFERENCES_PATH = '~/.openclaw-secure.json';
export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_GATEWAY_COMMAND = 'openclaw gateway run';
export const DEFAULT_BACKEND = 'keychain';

export const DEFAULT_SECRET_MAP: SecretMap = [
  { configPath: 'gateway.auth.token', keychainName: 'gateway-auth-token' },
  { configPath: 'skills.entries.openai-whisper-api.apiKey', keychainName: 'whisper-api-key' },
];

export function serviceName(keychainName: string): string {
  return `${SERVICE_PREFIX}-${keychainName}`;
}
