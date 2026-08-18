/**
 * Push feature entry point (docs §3, P1).
 * Registers the device token with the backend on app launch / login.
 * Invoked from App bootstrap and authStore.login.
 */
import { pushService } from '@lib/push/pushService';

export function registerPushOnLaunch(): void {
  void pushService.register();
}

export { pushService };
