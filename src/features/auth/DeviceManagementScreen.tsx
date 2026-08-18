import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { useAuthStore } from '@stores/authStore';
import { isDemoMode } from '@lib/config';
import type { Device } from '@lib/types';

/**
 * Device management — list active sessions and remotely revoke a device
 * (docs P0). Backend `/api/me/devices` is not yet implemented; in demo mode we
 * show the local device only (TODO(backend)).
 */
export function DeviceManagementScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const loadDevices = useAuthStore((s) => s.loadDevices);
  const revokeDevice = useAuthStore((s) => s.revokeDevice);
  const session = useAuthStore((s) => s.session);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const list = await loadDevices();
      setDevices(list);
      setLoading(false);
    })();
  }, [loadDevices]);

  const onRevoke = async (id: string) => {
    await revokeDevice(id);
    setDevices((d) => d.filter((x) => x.id !== id));
  };

  if (isDemoMode()) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg }}>{t('auth:deviceManagement')}</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.md }}>
          {/* TODO(backend): replace with real device list from /api/me/devices */}
          {t('auth:deviceName')}: {session?.deviceId || 'local'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        refreshing={loading}
        onRefresh={() => void loadDevices().then(setDevices)}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.md,
              borderBottomWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View>
              <Text style={{ color: theme.colors.text }}>{item.deviceName}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.size.sm }}>
                {item.platform}
                {item.current ? ` · ${t('auth:currentDevice')}` : ''}
              </Text>
            </View>
            {!item.current ? (
              <Pressable onPress={() => void onRevoke(item.id)}>
                <Text style={{ color: theme.colors.danger }}>{t('auth:revokeDevice')}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
      <View style={{ padding: theme.spacing.md }}>
        <Button title={t('common:refresh')} variant="secondary" onPress={() => void loadDevices().then(setDevices)} />
      </View>
    </View>
  );
}
