# HarmonyOS E2E Manual Checklist

Detox does not support HarmonyOS today. Until an RNOH E2E harness exists, run
these flows by hand on a HarmonyOS emulator (API 19+) or device:

## P0
- [ ] Login with username/password → home feed loads.
- [ ] Browse category tree (257 bilingual) → paper detail opens.
- [ ] PDF opens in the reader and progress is stored locally.
- [ ] Bookmark / unbookmark a paper; appears in Library → Bookmarks.
- [ ] Submit feedback; appears in Messages → Feedback.

## Tokens
- [ ] Refresh token is stored only in HUKS (verify no token in MMKV/logs).
- [ ] Force a 401 (expire access token) → silent refresh replays the request.
- [ ] Revoke a device from web → this device is signed out on next request.

## Push
- [ ] AGC project configured; device token registers via POST /api/push/register.

## Known issues
- react-native-pdf / react-native-keychain RNOH 0.82.30 adaptation not yet
  verified — a HUKS native bridge is provided under harmony/entry/src/main/ets/papex.
