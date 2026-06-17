import { create } from "zustand";
import type { SettingsDTO } from "@/lib/types";

/**
 * Draft settings live in Zustand (local UI state) while the user edits the
 * form. The persisted settings remain owned by TanStack Query; we only push the
 * draft to the server on save, then clear it.
 */
type SettingsDraftState = {
  draft: SettingsDTO | null;
  setDraft: (s: SettingsDTO) => void;
  patch: (p: Partial<SettingsDTO>) => void;
  clear: () => void;
};

export const useSettingsDraft = create<SettingsDraftState>((set) => ({
  draft: null,
  setDraft: (s) => set({ draft: s }),
  patch: (p) => set((state) => (state.draft ? { draft: { ...state.draft, ...p } } : {})),
  clear: () => set({ draft: null }),
}));
