import { z } from "zod";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const settingsUpdateSchema = z
  .object({
    timezone: z.string().min(1).max(64),
    dailyThreshold: z.number().int().min(1).max(100),
    freezeEnabled: z.boolean(),
    reminderTime: z.string().regex(HHMM, "Expected HH:mm"),
    lastCallEnabled: z.boolean(),
    lastCallTime: z.string().regex(HHMM, "Expected HH:mm"),
    goalTotal: z.number().int().min(1).max(1_000_000),
  })
  .partial();

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(512).optional(),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});
