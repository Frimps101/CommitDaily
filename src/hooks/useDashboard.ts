"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchDashboard, syncDashboard } from "@/lib/api";
import type { DashboardDTO } from "@/lib/types";
import { useUIStore } from "@/store/ui";

const DASHBOARD_KEY = ["dashboard"] as const;

export function useDashboard() {
  const enqueue = useUIStore((s) => s.enqueueCelebrations);
  const query = useQuery<DashboardDTO>({
    queryKey: DASHBOARD_KEY,
    queryFn: fetchDashboard,
  });

  // Surface any milestones the read model reports as newly reached.
  useEffect(() => {
    if (query.data?.newMilestones?.length) {
      enqueue(query.data.newMilestones);
    }
  }, [query.data?.newMilestones, enqueue]);

  return query;
}

/** Triggers a fresh GitHub sync and updates the cached dashboard. */
export function useSync() {
  const qc = useQueryClient();
  const enqueue = useUIStore((s) => s.enqueueCelebrations);

  return useMutation({
    mutationFn: syncDashboard,
    onSuccess: (data) => {
      qc.setQueryData(DASHBOARD_KEY, data);
      if (data.newMilestones?.length) enqueue(data.newMilestones);
    },
  });
}
