import { create } from "zustand";

/**
 * Zustand holds LOCAL UI state only — modal visibility and the milestone
 * celebration queue. Server state (dashboard, settings) lives in TanStack
 * Query, never here.
 */
type UIState = {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // Queue of milestone thresholds waiting to be celebrated.
  celebrationQueue: number[];
  enqueueCelebrations: (thresholds: number[]) => void;
  dismissCelebration: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  celebrationQueue: [],
  enqueueCelebrations: (thresholds) =>
    set((state) => {
      const existing = new Set(state.celebrationQueue);
      const next = thresholds.filter((t) => !existing.has(t));
      return { celebrationQueue: [...state.celebrationQueue, ...next] };
    }),
  dismissCelebration: () =>
    set((state) => ({ celebrationQueue: state.celebrationQueue.slice(1) })),
}));
