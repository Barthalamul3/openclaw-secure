# Testing Patterns

**Analysis Date:** 2026-02-02

## Test Framework

**Runner:**
- Vitest (`vitest`)
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in assertions (`expect`).

**Run Commands:**
```bash
npm test               # vitest run
npm run test:watch     # vitest
```

## Test File Organization

**Location:**
- Separate `tests/` directory at the project root.

**Naming:**
- Pattern: `*.test.ts`
- Example: `tests/paths.test.ts`

**Structure:**
```
tests/
├── paths.test.ts
└── [other_tests].test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';

describe('functionName', () => {
  it('does something expected', () => {
    expect(actual).toBe(expected);
  });
});
```

**Patterns:**
- Group tests by function being tested (`describe('getByPath', ...)`).
- Clear, descriptive test case names.
- Focus on edge cases (missing paths, null values, type mismatches).

## Mocking

**Framework:**
- Vitest built-in mocking (`vi`).

**Patterns:**
- Used to mock external dependencies or heavy operations (implied by `CLAUDE.md` reference to `vi.mock` and `vi.fn`).
- Pure functions (like `paths.ts` logic) are tested without mocks.

## Fixtures and Factories

**Test Data:**
- Inline definitions for simple objects:
```typescript
const config = {
  channels: { telegram: { botToken: 'tok123' } },
  // ...
};
```

**Location:**
- Defined within the test file for unit tests.

## Coverage

**Requirements:**
- Not strictly enforced via configuration in `package.json`.

**View Coverage:**
```bash
npx vitest run --coverage
```
(Requires coverage provider installation if not present)

## Test Types

**Unit Tests:**
- Primary focus.
- Tests individual functions in isolation (e.g., `getByPath`, `setByPath`).

**Integration Tests:**
- Likely present for backend interactions (referenced in `CLAUDE.md` as `tests/backends/`).

## Common Patterns

**Pure Function Testing:**
- Input -> Output verification.
- Immutability checks (`it('does not mutate the original', ...)`).

**Edge Case Handling:**
```typescript
it('returns undefined for missing path', () => {
  expect(getByPath({ a: 1 }, 'b')).toBeUndefined();
});
```

---

*Testing analysis: 2026-02-02*
