/**
 * Centralized route names and parameter types (docs §4.2). Screens reference
 * these constants instead of raw strings so navigation stays type-safe.
 */
import type { Paper, Category, Device, Endorsement } from '@lib/types';

export const Routes = {
  // Auth (guest)
  Login: 'Login',
  Register: 'Register',
  AccountSwitcher: 'AccountSwitcher',
  DeviceManagement: 'DeviceManagement',
  // App shell
  Home: 'Home',
  Search: 'Search',
  Library: 'Library',
  Messages: 'Messages',
  Profile: 'Profile',
  // Library sub
  Bookmarks: 'Bookmarks',
  Subscriptions: 'Subscriptions',
  Downloads: 'Downloads',
  // Messages sub
  Inbox: 'Inbox',
  Tickets: 'Tickets',
  Feedback: 'Feedback',
  // Profile sub
  Endorsements: 'Endorsements',
  EditProfile: 'EditProfile',
  Stats: 'Stats',
  // Settings sub
  Settings: 'Settings',
  Language: 'Language',
  Theme: 'Theme',
  Account: 'Account',
  Push: 'Push',
  About: 'About',
  // Paper
  PaperDetail: 'PaperDetail',
  Reader: 'Reader',
  Comments: 'Comments',
} as const;

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  AccountSwitcher: undefined;
};

export type AppTabsParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Feed: undefined;
  Categories: { onPick?: 'feed' } | undefined;
  PaperDetail: { paperId: string };
  Reader: { paperId: string; version: string };
  Comments: { paperId: string };
};

export type SearchStackParamList = {
  Search: undefined;
  PaperDetail: { paperId: string };
  Reader: { paperId: string; version: string };
};

export type LibraryStackParamList = {
  LibraryHome: undefined;
  Bookmarks: undefined;
  Subscriptions: undefined;
  Downloads: undefined;
  PaperDetail: { paperId: string };
  Reader: { paperId: string; version: string };
};

export type MessagesStackParamList = {
  Inbox: undefined;
  Tickets: undefined;
  Feedback: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Endorsements: undefined;
  EditProfile: undefined;
  Stats: undefined;
  DeviceManagement: undefined;
  Settings: undefined;
  Language: undefined;
  Theme: undefined;
  Account: undefined;
  Push: undefined;
  About: undefined;
  PaperDetail: { paperId: string };
};

export type PaperParam = { paper: Paper };
export type CategoryParam = { category: Category };
export type DeviceParam = { device: Device };
export type EndorsementParam = { endorsement: Endorsement };
