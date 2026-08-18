/**
 * libraryStore — bookmarks, subscriptions, and offline downloads.
 * Reads/writes go through `apiClient`; cross-feature reads use this store so
 * features never import each other (docs §4.3).
 */
import { create } from 'zustand';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import { pdfCache } from '@lib/storage/pdfCache';
import type { Bookmark, Subscription, Paper } from '@lib/types';

interface LibraryState {
  bookmarks: string[]; // paper ids
  subscriptions: Subscription[];
  downloads: ReturnType<typeof pdfCache.listEntries>;
  loading: boolean;

  loadBookmarks: () => Promise<void>;
  toggleBookmark: (paperId: string) => Promise<void>;
  isBookmarked: (paperId: string) => boolean;

  loadSubscriptions: () => Promise<void>;
  toggleSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => Promise<void>;

  refreshDownloads: () => void;
  downloadPaper: (paper: Paper, version: string, fetchPdf: () => Promise<Uint8Array>) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  bookmarks: [],
  subscriptions: [],
  downloads: [],
  loading: false,

  loadBookmarks: async () => {
    if (isDemoMode()) {
      set({ bookmarks: [] });
      return;
    }
    set({ loading: true });
    try {
      const list = await apiClient.get<Bookmark[]>(Endpoints.bookmarks.list);
      set({ bookmarks: list.map((b) => b.paperId), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  toggleBookmark: async (paperId) => {
    const has = get().bookmarks.includes(paperId);
    // optimistic
    set((s) => ({
      bookmarks: has ? s.bookmarks.filter((id) => id !== paperId) : [...s.bookmarks, paperId],
    }));
    if (isDemoMode()) return;
    try {
      if (has) await apiClient.del(Endpoints.bookmarks.paper(paperId));
      else await apiClient.post(Endpoints.bookmarks.paper(paperId), { paperId });
    } catch {
      // revert on failure
      set((s) => ({
        bookmarks: has ? [...s.bookmarks, paperId] : s.bookmarks.filter((id) => id !== paperId),
      }));
    }
  },

  isBookmarked: (paperId) => get().bookmarks.includes(paperId),

  loadSubscriptions: async () => {
    if (isDemoMode()) {
      set({ subscriptions: [] });
      return;
    }
    try {
      const list = await apiClient.get<Subscription[]>(Endpoints.subscriptions);
      set({ subscriptions: list });
    } catch {
      set({ subscriptions: [] });
    }
  },

  toggleSubscription: async (sub) => {
    const existing = get().subscriptions.find((s) => s.kind === sub.kind && s.refId === sub.refId);
    const nextSubs: Subscription[] = existing
      ? get().subscriptions.filter((x) => x !== existing)
      : [...get().subscriptions, { ...sub, id: `local_${Date.now()}`, createdAt: new Date().toISOString() }];
    set({ subscriptions: nextSubs });
    if (isDemoMode()) return;
    try {
      if (existing) await apiClient.del(`${Endpoints.subscriptions}/${existing.id}`);
      else await apiClient.post(Endpoints.subscriptions, sub);
    } catch {
      /* keep optimistic state */
    }
  },

  refreshDownloads: () => set({ downloads: pdfCache.listEntries() }),

  downloadPaper: async (paper, version, fetchPdf) => {
    const data = await fetchPdf();
    await pdfCache.save(paper.id, version, data);
    set({ downloads: pdfCache.listEntries() });
  },
}));
