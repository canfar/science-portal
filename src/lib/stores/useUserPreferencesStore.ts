/**
 * User Preferences Store (Zustand)
 *
 * Manages user preferences that should persist across sessions.
 * Uses localStorage for persistence.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type SessionSortField = 'name' | 'type' | 'status' | 'startedTime' | 'expiresTime';
export type SortOrder = 'asc' | 'desc';

interface UserPreferences {
  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Session preferences
  defaultSessionType: string | null;
  setDefaultSessionType: (type: string | null) => void;

  defaultCores: number;
  setDefaultCores: (cores: number) => void;

  defaultRam: number;
  setDefaultRam: (ram: number) => void;

  favoriteImages: string[];
  addFavoriteImage: (image: string) => void;
  removeFavoriteImage: (image: string) => void;

  // Display preferences
  sessionsPerPage: number;
  setSessionsPerPage: (count: number) => void;

  showTerminatedSessions: boolean;
  setShowTerminatedSessions: (show: boolean) => void;

  defaultSessionSort: {
    field: SessionSortField;
    order: SortOrder;
  };
  setDefaultSessionSort: (field: SessionSortField, order: SortOrder) => void;

  // Notifications
  enableNotifications: boolean;
  setEnableNotifications: (enabled: boolean) => void;

  notifyOnSessionStart: boolean;
  setNotifyOnSessionStart: (enabled: boolean) => void;

  notifyOnSessionExpiring: boolean;
  setNotifyOnSessionExpiring: (enabled: boolean) => void;

  expiryWarningMinutes: number;
  setExpiryWarningMinutes: (minutes: number) => void;

  // Advanced
  autoRefreshInterval: number; // seconds
  setAutoRefreshInterval: (seconds: number) => void;

  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;

  // Reset to defaults
  resetToDefaults: () => void;
}

const defaultPreferences = {
  themeMode: 'system' as ThemeMode,
  defaultSessionType: null,
  defaultCores: 2,
  defaultRam: 8,
  favoriteImages: [],
  sessionsPerPage: 10,
  showTerminatedSessions: false,
  defaultSessionSort: {
    field: 'startedTime' as SessionSortField,
    order: 'desc' as SortOrder,
  },
  enableNotifications: true,
  notifyOnSessionStart: true,
  notifyOnSessionExpiring: true,
  expiryWarningMinutes: 30,
  autoRefreshInterval: 30,
  debugMode: false,
};

export const useUserPreferencesStore = create<UserPreferences>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultPreferences,

        // Theme
        setThemeMode: (mode) => set({ themeMode: mode }),

        // Session preferences
        setDefaultSessionType: (type) => set({ defaultSessionType: type }),
        setDefaultCores: (cores) => set({ defaultCores: cores }),
        setDefaultRam: (ram) => set({ defaultRam: ram }),

        favoriteImages: [],
        addFavoriteImage: (image) =>
          set((state) => ({
            favoriteImages: state.favoriteImages.includes(image)
              ? state.favoriteImages
              : [...state.favoriteImages, image],
          })),
        removeFavoriteImage: (image) =>
          set((state) => ({
            favoriteImages: state.favoriteImages.filter((img) => img !== image),
          })),

        // Display preferences
        setSessionsPerPage: (count) => set({ sessionsPerPage: count }),
        setShowTerminatedSessions: (show) => set({ showTerminatedSessions: show }),
        setDefaultSessionSort: (field, order) =>
          set({ defaultSessionSort: { field, order } }),

        // Notifications
        setEnableNotifications: (enabled) => set({ enableNotifications: enabled }),
        setNotifyOnSessionStart: (enabled) => set({ notifyOnSessionStart: enabled }),
        setNotifyOnSessionExpiring: (enabled) =>
          set({ notifyOnSessionExpiring: enabled }),
        setExpiryWarningMinutes: (minutes) => set({ expiryWarningMinutes: minutes }),

        // Advanced
        setAutoRefreshInterval: (seconds) => set({ autoRefreshInterval: seconds }),
        setDebugMode: (enabled) => set({ debugMode: enabled }),

        // Reset to defaults
        resetToDefaults: () => set(defaultPreferences),
      }),
      {
        name: 'user-preferences',
      }
    ),
    {
      name: 'UserPreferencesStore',
    }
  )
);
