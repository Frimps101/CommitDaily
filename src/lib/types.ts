// Client-facing DTOs. Kept in sync with the server payloads but defined
// separately so client bundles never import server-only modules.

export type StreakStatus = "safe" | "at_risk" | "broken";

export type StreakDTO = {
  currentStreak: number;
  longestStreak: number;
  freezeUsed: boolean;
  lastCountedDate: string | null;
  todayDate: string;
  todayCount: number;
  todayMet: boolean;
  status: StreakStatus;
};

export type ProgressDTO = {
  goalTotal: number;
  total: number;
  remaining: number;
  daysRemaining: number;
  pace: number;
  percent: number;
  deadline: string;
  lastMilestone: number | null;
  nextMilestone: number | null;
};

export type SettingsDTO = {
  timezone: string;
  dailyThreshold: number;
  freezeEnabled: boolean;
  reminderTime: string;
  lastCallEnabled: boolean;
  lastCallTime: string;
  goalTotal: number;
};

export type DashboardDTO = {
  streak: StreakDTO;
  progress: ProgressDTO;
  newMilestones: number[];
  settings: SettingsDTO;
  heatmap: Array<{ date: string; count: number }>;
  milestones: { all: number[]; awarded: number[] };
};
