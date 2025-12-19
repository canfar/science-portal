/**
 * Session Store (Zustand)
 *
 * Manages ephemeral session-related state that doesn't belong in the URL
 * or isn't fetched from the server.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SessionType } from '@/lib/api/skaha';

interface SessionFormData {
  sessionType: SessionType;
  sessionName: string;
  containerImage: string;
  cores: number;
  ram: number;
  env?: Record<string, string>;
  cmd?: string;
}

interface SessionState {
  // Selected sessions for bulk operations
  selectedSessions: string[];
  selectSession: (id: string) => void;
  deselectSession: (id: string) => void;
  toggleSession: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;

  // Session form draft (persist between mounts)
  sessionFormDraft: Partial<SessionFormData> | null;
  updateSessionFormDraft: (data: Partial<SessionFormData>) => void;
  clearSessionFormDraft: () => void;

  // Recently viewed sessions
  recentSessions: string[];
  addRecentSession: (id: string) => void;

  // Session comparison
  comparingSessions: string[];
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // Selected sessions for bulk operations
      selectedSessions: [],
      selectSession: (id) =>
        set((state) => ({
          selectedSessions: state.selectedSessions.includes(id)
            ? state.selectedSessions
            : [...state.selectedSessions, id],
        })),
      deselectSession: (id) =>
        set((state) => ({
          selectedSessions: state.selectedSessions.filter((sid) => sid !== id),
        })),
      toggleSession: (id) => {
        const { selectedSessions } = get();
        if (selectedSessions.includes(id)) {
          get().deselectSession(id);
        } else {
          get().selectSession(id);
        }
      },
      clearSelection: () => set({ selectedSessions: [] }),
      selectAll: (ids) => set({ selectedSessions: ids }),

      // Session form draft
      sessionFormDraft: null,
      updateSessionFormDraft: (data) =>
        set((state) => ({
          sessionFormDraft: { ...state.sessionFormDraft, ...data },
        })),
      clearSessionFormDraft: () => set({ sessionFormDraft: null }),

      // Recently viewed sessions (keep last 10)
      recentSessions: [],
      addRecentSession: (id) =>
        set((state) => {
          const filtered = state.recentSessions.filter((sid) => sid !== id);
          return {
            recentSessions: [id, ...filtered].slice(0, 10),
          };
        }),

      // Session comparison (max 4)
      comparingSessions: [],
      addToComparison: (id) =>
        set((state) => {
          if (state.comparingSessions.length >= 4) {
            return state; // Max 4 sessions
          }
          if (state.comparingSessions.includes(id)) {
            return state; // Already in comparison
          }
          return {
            comparingSessions: [...state.comparingSessions, id],
          };
        }),
      removeFromComparison: (id) =>
        set((state) => ({
          comparingSessions: state.comparingSessions.filter((sid) => sid !== id),
        })),
      clearComparison: () => set({ comparingSessions: [] }),
    }),
    {
      name: 'SessionStore',
    }
  )
);
