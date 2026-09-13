export const SNAPSHOT_BATCH_MS = 3 * 60 * 1000;
export const ROLLING_SNAPSHOT_LIMIT = 100;
export const RETENTION_DAYS = 180;
export const MONTHLY_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

export const PROFILE_SECRET_KEYS = [
  "ai_chat_history",
] as const;

export type SnapshotKind = "event" | "monthly" | "final_deletion" | "admin";

export type SnapshotActorKind = "user" | "admin" | "system";

export type SnapshotRequest = {
  userId: string;
  kind: SnapshotKind;
  changeType: string;
  changeSection?: string | null;
  actorKind?: SnapshotActorKind;
  actorId?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  force?: boolean;
};

export type ProfilePayload = {
  capturedAt: string;
  profile: Record<string, unknown> | null;
  writings: unknown[];
  trades: unknown[];
  tradeUpdates: unknown[];
  community: unknown[];
  airdrops: unknown[];
  collectibles: unknown[];
  credentials: unknown[];
  media: string[];
};
