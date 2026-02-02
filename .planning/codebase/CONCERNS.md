# Codebase Concerns

**Analysis Date:** 2026-02-02

## Security Considerations

**Secrets Visible in Process List (Keychain Backend):**
- Risk: Secrets are passed as command-line arguments to the `security` binary. On Unix-like systems, command-line arguments are visible to other users via `ps` or `/proc`.
- Files: `src/backends/keychain.ts`
- Code:
  ```typescript
  await runCommand('/usr/bin/security', [
    'add-generic-password', '-s', service, '-a', KEYCHAIN_ACCOUNT, '-w', value, '-U',
  ]);
  ```
- Recommendations: Use `security`'s interactive mode or pass via stdin if supported, or ensure the process is short-lived.

**Shell Execution:**
- Risk: usage of `shell: true` in `spawn` can lead to command injection if variables aren't sanitized, though `DEFAULT_GATEWAY_COMMAND` appears constant here.
- Files: `src/cli.ts`
- Code:
  ```typescript
  const child = spawn(DEFAULT_GATEWAY_COMMAND, {
    stdio: 'inherit',
    shell: true, // <--- Risk
    env: { ...process.env, ...envUpdates }
  });
  ```
- Recommendations: Use `execFile` or `spawn` without `shell: true` if possible, splitting the command and arguments.

## Fragile Areas

**Regex-based XML/Plist Parsing:**
- Files: `src/launchagent.ts`
- Why fragile: The `launchagent.ts` module parses macOS `plist` (XML) files using Regular Expressions (`extractStringValue`, `extractStringArray`).
- Impact: This approach is brittle. It depends on specific indentation or formatting (e.g., `<key>...<\/key>\s*<string>`). Valid XML formatting changes (like comments, different whitespace, or CDATA) could break the parser.
- Safe modification: Any changes to this file must be tested against various plist formats.
- Recommendation: Use a proper XML parser (like `fast-xml-parser` or `xml2js`) even if it adds a dependency, or a native `plutil -convert json` approach.

## Tech Debt

**Error Swallowing in Backends:**
- Issue: Backend implementations often catch generic errors and return `null` or `[]` (empty arrays) to signify "not found", but this may mask genuine connectivity or permission errors.
- Files:
  - `src/backends/azure-keyvault.ts`
  - `src/backends/aws-secrets.ts`
  - `src/backends/keychain.ts`
- Impact: Debugging configuration issues (e.g., wrong credentials) becomes difficult as they look like "secret not found".
- Fix approach: Discriminate between "404 Not Found" errors and other exceptions (Network, Auth).

## Maintainability

**Hardcoded Binary Paths:**
- Issue: Paths to external binaries are often assumed or searched in limited locations.
- Files: `src/backends/keychain.ts` (`/usr/bin/security`), `src/launchagent.ts` (`/usr/bin/which`).
- Fix approach: Allow configuration or robust path resolution for system binaries.

---

*Concerns audit: 2026-02-02*
