# Running tests

## Unit tests (Jest + RNTL)

Core modules target ≥80% statement coverage (`jest.config.js` enforces it).

```bash
npm install
npm test                       # jest --coverage
npm run test:watch             # watch mode
```

Coverage focuses on:
- `src/lib/security/tokens.test.ts` — JWT decode/expiry, secure storage round-trip,
  refresh rotation, multi-account cap, embedded-permission checks (the §7 six elements).
- `src/lib/api/client.test.ts` — Bearer injection, 401 refresh-once + replay, 429
  exponential backoff + jitter, error-code → i18n-key mapping, timeout/network handling.
- `src/lib/i18n/__tests__/integrity.test.ts` — zh/en key parity.

`react-native-mmkv` and `react-native-keychain` are mocked in `jest.setup.ts` with
in-memory implementations, so no native modules are required under Jest.

## E2E (Detox, iOS / Android)

```bash
npm run e2e:ios        # build + run on iPhone simulator
npm run e2e:android    # build + run on Android emulator
```

Specs live in `e2e/` (example: `login.e2e.ts`). CI runs iOS on a macOS runner and
Android on an Android runner (see `.detoxrc.js` / `e2e/jest.config.js`).

## HarmonyOS (manual)

RNOH has no Detox harness yet. Run the hand checklist in
`docs/e2e/harmony-checklist.md` on an emulator (API 19+) or device.

## Cross-platform linkage tests

Scenarios in `docs/development/papex-app.md §9.3` (web ↔ app ↔ desktop) require a live
papex backend. Start it (`docker db` + `npm run dev`), then exercise the shared
accounts/seeds (`app-e2e`, `desktop-e2e`, `cross-e2e`, password `password123`) from
each client.

## Type check / lint

```bash
npm run typecheck     # tsc --noEmit (strict)
npm run lint          # eslint
```
