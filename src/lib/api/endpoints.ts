/**
 * Endpoint constants for the Papex API.
 * Grouped by feature; backend-dependent (not yet implemented in papex) calls
 * are flagged with a comment so they are easy to find during integration.
 *
 * @see docs/development/papex-app.md §6.1 (existing) and §6.2 (new).
 */

const base = (p: string) => p;

export const Endpoints = {
  auth: {
    login: base('/api/auth/login'),
    register: base('/api/auth/register'),
    logout: base('/api/auth/logout'),
    // NEW (§6.2): returns rotated token pair bound to deviceId.
    refresh: base('/api/auth/refresh'),
    me: base('/api/auth/me'),
    // NEW (§6.2): device management.
    devices: base('/api/me/devices'),
    device: (id: string) => base(`/api/me/devices/${id}`),
  },
  papers: {
    list: base('/api/papers'),
    detail: (id: string) => base(`/api/papers/${id}`),
    versions: (id: string) => base(`/api/papers/${id}/versions`),
    pdf: (id: string, version: string) => base(`/api/papers/${id}/pdf/${version}`),
    comments: (id: string) => base(`/api/papers/${id}/comments`),
  },
  search: base('/api/search'),
  categories: base('/api/categories'),
  bookmarks: {
    list: base('/api/bookmarks'),
    paper: (paperId: string) => base(`/api/bookmarks/${paperId}`),
  },
  subscriptions: base('/api/subscriptions'),
  endorsements: base('/api/endorsements'),
  messages: base('/api/messages'),
  tickets: base('/api/tickets'),
  feedback: base('/api/feedback'),
  settings: {
    apiKeys: base('/api/settings/api-keys'),
  },
  // NEW (§6.2): reading progress sync.
  readingProgress: (paperId: string) => base(`/api/reading-progress/${paperId}`),
  // NEW (§6.2): notes (annotations) — mobile is read-only (P3).
  notes: base('/api/notes'),
  avatar: base('/api/me/avatar'),
  // NEW (§6.2): push registration.
  push: {
    register: base('/api/push/register'),
    unregister: base('/api/push/unregister'),
  },
} as const;

export type EndpointGroup = keyof typeof Endpoints;
