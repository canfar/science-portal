/**
 * UI State Store (Zustand)
 *
 * Manages global UI state like sidebar visibility, notifications, loading states, etc.
 * Use this for client-side UI state that needs to be shared across components.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Modals
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Preferences (persisted)
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;

  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Sidebar
        sidebarOpen: true,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

        // Notifications
        notifications: [],
        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random()}`;
          set((state) => ({
            notifications: [...state.notifications, { ...notification, id }],
          }));

          // Auto-remove after duration (default 5 seconds)
          if (notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration || 5000);
          }
        },
        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
        clearNotifications: () => set({ notifications: [] }),

        // Loading states
        globalLoading: false,
        setGlobalLoading: (loading) => set({ globalLoading: loading }),

        // Modals
        activeModal: null,
        openModal: (modalId) => set({ activeModal: modalId }),
        closeModal: () => set({ activeModal: null }),

        // Preferences (persisted)
        compactMode: false,
        setCompactMode: (compact) => set({ compactMode: compact }),

        animationsEnabled: true,
        setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      }),
      {
        name: 'ui-storage',
        // Only persist certain fields
        partialize: (state) => ({
          compactMode: state.compactMode,
          animationsEnabled: state.animationsEnabled,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    {
      name: 'UIStore',
    }
  )
);

/**
 * Helper hooks for common UI operations
 */

/**
 * Show a success notification
 */
export function useSuccessNotification() {
  const addNotification = useUIStore((state) => state.addNotification);
  return (message: string, title?: string) =>
    addNotification({ type: 'success', message, title });
}

/**
 * Show an error notification
 */
export function useErrorNotification() {
  const addNotification = useUIStore((state) => state.addNotification);
  return (message: string, title?: string) =>
    addNotification({ type: 'error', message, title });
}

/**
 * Show a warning notification
 */
export function useWarningNotification() {
  const addNotification = useUIStore((state) => state.addNotification);
  return (message: string, title?: string) =>
    addNotification({ type: 'warning', message, title });
}

/**
 * Show an info notification
 */
export function useInfoNotification() {
  const addNotification = useUIStore((state) => state.addNotification);
  return (message: string, title?: string) =>
    addNotification({ type: 'info', message, title });
}
