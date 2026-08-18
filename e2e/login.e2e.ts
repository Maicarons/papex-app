/**
 * Detox E2E — login flow (docs §9.2, scenario 1).
 * Run with `npm run e2e:ios` or `npm run e2e:android`.
 * HarmonyOS uses the manual checklist in docs/e2e/harmony-checklist.md.
 */
import { device, element, by, expect } from 'detox';

describe('Login flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('shows the login screen', async () => {
    await expect(element(by.text('Sign in to Papex'))).toBeVisible();
  });

  it('logs in and reaches the home feed', async () => {
    await element(by.id('login.username')).typeText('app-e2e');
    await element(by.id('login.password')).typeText('password123');
    await element(by.id('login.submit')).tap();
    // Home feed should appear after a successful login.
    await expect(element(by.text('Latest papers'))).toBeVisible();
  });
});
