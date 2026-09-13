"use client";

export function recordProfileChange(changeType: string, changeSection = "profile") {
  if (typeof window === "undefined") return;
  fetch("/api/profile/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ changeType, changeSection }),
  }).catch(() => {
    /* snapshot batching is best-effort */
  });
}
