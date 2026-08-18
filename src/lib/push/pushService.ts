/**
 * Push service — unified abstraction over the three delivery channels:
 *   - FCM       (Android)
 *   - APNs      (iOS)
 *   - PushKit   (HarmonyOS, via AGC — wired later)
 *
 * The app registers a device token with `POST /api/push/register` so the papex
 * backend can target it. Registration is a no-op in demo mode / when disabled.
 *
 * @see docs/development/papex-app.md §3 (push), §11 (HarmonyOS AGC caveat).
 */
import { Platform } from 'react-native';
import { config } from '../config';
import { Endpoints } from '../api/endpoints';
import { apiClient } from '../api/client';
import { mmkv, Keys } from '../storage/mmkv';

export type PushPlatform = 'android' | 'ios' | 'harmony';

export interface PushTokenRecord {
  platform: PushPlatform;
  token: string;
  registeredAt: number;
}

export interface PushHandler {
  /** Fetch the OS-provided device token (stubbed per-platform). */
  getDeviceToken(): Promise<string | null>;
}

class FcmHandler implements PushHandler {
  async getDeviceToken(): Promise<string | null> {
    // TODO(push): wire @react-native-firebase/messaging (RNOH 0.82.x compatible build).
    return null;
  }
}

class ApnsHandler implements PushHandler {
  async getDeviceToken(): Promise<string | null> {
    // TODO(push): wire react-native-push-notification / Notifee for APNs token.
    return null;
  }
}

class PushKitHandler implements PushHandler {
  async getDeviceToken(): Promise<string | null> {
    // TODO(push): wire HarmonyOS PushKit (AGC project required).
    return null;
  }
}

function handlerFor(platform: PushPlatform): PushHandler {
  switch (platform) {
    case 'android':
      return new FcmHandler();
    case 'ios':
      return new ApnsHandler();
    case 'harmony':
      return new PushKitHandler();
  }
}

export function currentPlatform(): PushPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'harmony';
}

export const pushService = {
  async register(): Promise<PushTokenRecord | null> {
    if (!config.PUSH_ENABLED) return null;
    const platform = currentPlatform();
    const handler = handlerFor(platform);
    const token = await handler.getDeviceToken();
    if (!token) return null;

    const record: PushTokenRecord = { platform, token, registeredAt: Date.now() };
    mmkv.set(Keys.pushToken, JSON.stringify(record));

    if (!config.API_DEMO_MODE) {
      try {
        await apiClient.post(Endpoints.push.register, { platform, deviceToken: token });
      } catch {
        // Best-effort registration; retry on next launch.
      }
    }
    return record;
  },

  async unregister(): Promise<void> {
    mmkv.delete(Keys.pushToken);
    if (!config.API_DEMO_MODE) {
      try {
        await apiClient.post(Endpoints.push.unregister, {});
      } catch {
        /* ignore */
      }
    }
  },

  getStoredToken(): PushTokenRecord | null {
    const raw = mmkv.getString(Keys.pushToken);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PushTokenRecord;
    } catch {
      return null;
    }
  },
};
