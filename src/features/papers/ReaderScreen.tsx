import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import { useTheme } from '@theme/index';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { config, isDemoMode } from '@lib/config';
import { paperCache } from '@lib/storage/mmkv';
import { analytics } from '@lib/analytics';
import type { HomeStackParamList } from '@app/routes';

type RouteP = RouteProp<HomeStackParamList, 'Reader'>;

/**
 * PDF reader (P0). Streams the PDF via react-native-pdf.
 * NOTE: react-native-pdf performs its own fetch, so the auth header is not
 * attached automatically — the papex PDF endpoint must accept the same session
 * (cookie or a pre-signed URL). TODO(backend): return an authenticated/signed
 * PDF URL, or proxy through apiClient.
 */
export function ReaderScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteP>();
  const navigation = useNavigation();
  const { paperId, version } = route.params;
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const pdfUrl = `${config.API_BASE_URL}${Endpoints.papers.pdf(paperId, version)}`;
  const span = analytics.startSpan('reader.open');

  useEffect(() => () => span(), [span]);

  const syncProgress = useCallback(
    async (p: number, percent: number) => {
      paperCache.setProgress(paperId, { page: p, percent });
      if (!isDemoMode()) {
        // TODO(backend): PUT /api/reading-progress/[paperId]
        try {
          await apiClient.put(Endpoints.readingProgress(paperId), { version, page: p, percent });
        } catch {
          /* offline — local cache keeps last progress */
        }
      }
    },
    [paperId, version],
  );

  if (isDemoMode()) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.textMuted }}>{t('errors:unknown')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Pdf
        source={{ uri: pdfUrl, cache: true }}
        trustAllCerts={false}
        onLoadComplete={(numPages: number) => setTotal(numPages)}
        onPageChanged={(p: number) => {
          setPage(p);
          const percent = total ? p / total : 0;
          void syncProgress(p, percent);
        }}
        onError={() => navigation.goBack()}
        style={{ flex: 1 }}
      />
      <Text style={{ color: theme.colors.textMuted, textAlign: 'center', padding: 4 }}>
        {page}/{total || '—'}
      </Text>
    </View>
  );
}
