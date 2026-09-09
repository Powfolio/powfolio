export const REPORT_REASONS = [
  { id: "impersonation", label: "Fake or impersonation profile" },
  { id: "fabricated", label: "Fabricated trading or proof data" },
  { id: "scam", label: "Spam or scam links" },
  { id: "abuse", label: "Harassment or abusive content" },
  { id: "wallet_fraud", label: "Wallet or identity fraud" },
  { id: "other", label: "Other" },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];

export const REPORT_STATUSES = ["pending", "reviewed", "actioned", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const ACCOUNT_STATUSES = ["active", "suspended", "under_review"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const MIN_ACCOUNT_AGE_MS = 60 * 60 * 1000;
export const DAILY_REPORT_CAP = 1;
export const PER_TARGET_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const GROUP_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const SIGNUP_IP_LIMIT = 6;
export const SIGNUP_IP_WINDOW_MS = 6 * 60 * 60 * 1000;
