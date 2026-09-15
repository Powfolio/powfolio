"use client";

import { useEffect, useState } from "react";

type SnapshotRow = {
  id: string;
  version: number;
  kind: string;
  change_type: string | null;
  is_final: boolean;
  created_at: string;
};

type HistoryRow = {
  id: string;
  snapshot_id: string | null;
  version: number | null;
  change_type: string;
  created_at: string;
};

export default function ProfileLifecycle({
  userId,
  deleted,
  purgeAt,
  legalHold,
  legalHoldReason,
  deletionState,
}: {
  userId: string;
  deleted: boolean;
  purgeAt: string | null;
  legalHold: boolean;
  legalHoldReason: string | null;
  deletionState: string | null;
}) {
  const [tab, setTab] = useState<"history" | "snapshots" | "retention">("history");
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/accounts/${userId}/snapshots`, { credentials: "same-origin" }),
      fetch(`/api/admin/accounts/${userId}/history`, { credentials: "same-origin" }),
    ])
      .then(async ([s, h]) => {
        const snaps = await s.json();
        const hist = await h.json();
        if (s.ok) setSnapshots(snaps.rows || []);
        if (h.ok) setHistory(hist.rows || []);
        if (!s.ok) setError(snaps.error || "Could not load snapshots");
      })
      .catch(() => setError("Could not load history"));
  }, [userId]);

  async function openSnapshot(id: string) {
    const res = await fetch(`/api/admin/accounts/${userId}/snapshots/${id}`, { credentials: "same-origin" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Could not open snapshot");
      return;
    }
    setPayload((json.snapshot?.payload || {}) as Record<string, unknown>);
    setActiveVersion(json.snapshot?.version ?? null);
    setTab("snapshots");
  }

  async function postJson(path: string, body: Record<string, unknown>) {
    const res = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  }

  const profile = (payload?.profile || {}) as Record<string, unknown>;
  const tabs = deleted ? (["history", "snapshots", "retention"] as const) : (["history", "snapshots"] as const);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === id ? "bg-primary text-zinc-950" : "text-foreground-muted hover:text-foreground"}`}
          >
            {id === "history" ? "Profile history" : id === "snapshots" ? "Snapshots" : "Retention"}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      {tab === "history" && (
        <ul className="space-y-1 text-sm text-foreground-muted">
          {history.length === 0 && <li>No profile history yet.</li>}
          {history.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span>
                {new Date(row.created_at).toLocaleString()} - {row.change_type.replaceAll("_", " ")}
                {row.version ? ` · Snapshot #${row.version}` : ""}
              </span>
              {row.snapshot_id && (
                <button type="button" className="text-xs text-primary" onClick={() => openSnapshot(row.snapshot_id as string)}>
                  Open snapshot
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === "snapshots" && (
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <ul className="space-y-1">
            {snapshots.map((row) => (
              <li key={row.id}>
                <button type="button" className="w-full py-2 text-left text-sm hover:text-primary" onClick={() => openSnapshot(row.id)}>
                  <span className="font-medium">Snapshot #{row.version}</span>
                  <span className="block text-[11px] text-foreground-subtle">
                    {row.is_final ? "FINAL · " : ""}
                    {row.kind} · {new Date(row.created_at).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="space-y-2 text-sm text-foreground-muted">
            {!payload && <p>Select a snapshot to reconstruct the profile at that moment.</p>}
            {payload && (
              <>
                <p className="text-base font-semibold text-foreground">Profile snapshot #{activeVersion}</p>
                <p>Name: {String(profile.display_name || "-")}</p>
                <p>Username: {String(profile.username || "-")}</p>
                <p>Bio: {String(profile.bio || "-")}</p>
                <p>Writing: {Array.isArray(payload.writings) ? payload.writings.length : 0}</p>
                <p>Trading: {Array.isArray(payload.trades) ? payload.trades.length : 0}</p>
                <p>Community: {Array.isArray(payload.community) ? payload.community.length : 0}</p>
                <p>Airdrops: {Array.isArray(payload.airdrops) ? payload.airdrops.length : 0}</p>
                <p>NFTs: {Array.isArray(payload.collectibles) ? payload.collectibles.length : 0}</p>
                <p>Credentials: {Array.isArray(payload.credentials) ? payload.credentials.length : 0}</p>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "retention" && (
        <div className="space-y-3 text-sm">
          <p>Deletion state: {deletionState || (deleted ? "deleted_pending_retention" : "active")}</p>
          <p>Scheduled purge: {purgeAt ? new Date(purgeAt).toLocaleString() : "-"}</p>
          <p>Legal hold: {legalHold ? "ON" : "Off"}</p>
          {legalHoldReason && <p>Hold reason: {legalHoldReason}</p>}
          <textarea className="input min-h-20 text-sm" placeholder="Documented legal / investigation reason" value={holdReason} onChange={(e) => setHoldReason(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-xs" disabled={!!busy} onClick={async () => {
              setBusy("hold");
              try {
                await postJson(`/api/admin/accounts/${userId}/hold`, { enable: true, reason: holdReason });
                window.location.reload();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Hold failed");
                setBusy(null);
              }
            }}>{busy === "hold" ? "..." : "Place legal hold"}</button>
            <button type="button" className="btn-secondary text-xs" disabled={!!busy} onClick={async () => {
              setBusy("unhold");
              try {
                await postJson(`/api/admin/accounts/${userId}/hold`, { enable: false, reason: holdReason });
                window.location.reload();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Hold failed");
                setBusy(null);
              }
            }}>{busy === "unhold" ? "..." : "Remove legal hold"}</button>
            <button type="button" className="btn-ghost text-xs" disabled={!!busy} onClick={async () => {
              setBusy("export");
              const res = await fetch(`/api/admin/accounts/${userId}/export`, { credentials: "same-origin" });
              const json = await res.json();
              setBusy(null);
              if (!res.ok) { setError(json.error || "Export failed"); return; }
              const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `pow3folio-archive-${userId}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>{busy === "export" ? "..." : "Export archive"}</button>
            <button type="button" className="btn-ghost text-xs text-danger" disabled={!!busy} onClick={async () => {
              if (!window.confirm("Permanently purge retained profile data? This cannot be undone.")) return;
              setBusy("purge");
              try {
                await postJson(`/api/admin/accounts/${userId}/purge`, { reason: holdReason || "Manual purge", force: true });
                window.location.href = "/ops/deleted";
              } catch (err) {
                setError(err instanceof Error ? err.message : "Purge failed");
                setBusy(null);
              }
            }}>{busy === "purge" ? "..." : "Purge now"}</button>
          </div>
        </div>
      )}
    </section>
  );
}
