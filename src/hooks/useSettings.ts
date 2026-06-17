"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateSettings } from "@/lib/api";
import type { SettingsDTO } from "@/lib/types";

const SETTINGS_KEY = ["settings"] as const;

export function useSettings() {
  return useQuery<SettingsDTO>({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<SettingsDTO>) => updateSettings(patch),
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_KEY, data);
      // Settings affect streak math + pace, so refresh the dashboard read model.
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
