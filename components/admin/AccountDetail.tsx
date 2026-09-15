"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusPill, Avatar } from "@/components/admin/AccountsTable";
import ProfileLifecycle from "@/components/admin/ProfileLifecycle";

type Detail = {
  profile: {
    id: string;
    username: string;
    originalUsername: string | null;
    displayName: string | null;
    bio: string | null;
    status: string;
    createdAt: string;
    wallet: string | null;
    extraWallets: Array<{ address?: string; label?: string }>;
    isPublic: boolean;
    xUrl: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
    avatarUrl: string | null;
    suspensionReason: string | null;
    suspendedAt: string | null;
    deletedAt: string | null;
    purgeAt?: string | null;
    legalHold?: boolean;
    legalHoldReason?: string | null;
    deletionState?: string | null;
  };
  email: string | null;
  emailConfirmed: boolean;
  providers: string[];
  reports: Array<{ id: string; reasons: string[]; note: string; status: string; created_at: string; attachments: string[] }>;
  audit: Array<{ id: string; actor_email: string | null; action: string; reason: string | null; created_at: string }>;
  activity: Array<{ id: string; action: string; detail: string | null; created_at: string }>;
};

export default function AccountDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/accounts/${id}`, { credentials: "same-origin" });
    const json = await res.json();
    if (!res.ok) setError(json.error || "Could not load");
    else {
      setError(null);
      setData(json);
    }
  }

  useEffect(() => {
    load().catch(() => setError("Could not load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(action: string) {
    if (action === "delete" && !window.confirm("Create a final snapshot, hide the public profile, and keep a 180-day admin archive?")) return;
    if (action === "restore" && !window.confirm("Restore this account to active and return the public username if it is free?")) return;
    setBusy(action);
    const res = await fetch(`/api/admin/accounts/${id}/action`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(json.error || "Action failed");
      return;
    }
    setReason("");
    if (action === "delete") {
      window.location.href = "/ops/deleted";
      return;
    }
    await load();
  }

  if (error && !data) return <p className="text-sm text-danger">{error}</p>;
  if (!data) return <p className="text-sm text-foreground-muted">Loading account...</p>;
  const p = data.profile;
  const publicName = p.originalUsername || p.username.replace(/_del\d*$/i, "");

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/ops" className="text-xs text-foreground-subtle hover:text-foreground">Back to accounts</Link>
      <div className="flex items-start gap-4">
        <Avatar url={p.avatarUrl} name={p.displayName || publicName} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Account file</p>
          <a href={`/${publicName}`} target="_blank" rel="noreferrer" className="mt-1 block text-3xl font-semibold tracking-tight hover:text-primary">@{publicName}</a>
          <p className="text-sm text-foreground-muted">{p.displayName || "No display name"}</p>
        </div>
        <StatusPill status={p.status} />
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Email" value={data.email || "-"} />
        <Info label="Email confirmed" value={data.emailConfirmed ? "Yes" : "No"} />
        <Info label="Signed up" value={new Date(p.createdAt).toLocaleString()} />
        <Info label="Public profile" value={p.isPublic ? "Yes" : "No"} />
        <Info label="Wallet" value={p.wallet || "-"} mono />
        <Info label="Providers" value={data.providers.join(", ") || "email"} />
      </section>
      {p.bio && <p className="text-sm text-foreground-muted">{p.bio}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Moderation actions</h2>
        <textarea className="input min-h-20 text-sm" placeholder="Reason (stored in the audit log and shown on a suspended public page)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("review")}>{busy === "review" ? "..." : "Mark under review"}</button>
          <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("warn")}>{busy === "warn" ? "..." : "Log warning"}</button>
          <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("suspend")}>{busy === "suspend" ? "..." : "Suspend"}</button>
          <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("unsuspend")}>{busy === "unsuspend" ? "..." : "Un-suspend"}</button>
          <button className="btn-ghost text-xs text-danger" disabled={!!busy} onClick={() => act("delete")}>{busy === "delete" ? "..." : "Archive / delete"}</button>
          {p.status === "deleted" && (
            <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("restore")}>{busy === "restore" ? "..." : "Restore account"}</button>
          )}
        </div>
      </section>
      <ProfileLifecycle
        userId={id}
        deleted={p.status === "deleted"}
        purgeAt={p.purgeAt || null}
        legalHold={Boolean(p.legalHold)}
        legalHoldReason={p.legalHoldReason || null}
        deletionState={p.deletionState || null}
      />
      <section>
        <h2 className="mb-2 text-sm font-medium">Reports against this account</h2>
        {data.reports.length === 0 && <p className="text-sm text-foreground-subtle">None</p>}
        <div className="space-y-2">
          {data.reports.map((r) => (
            <div key={r.id} className="py-2 text-sm">
              <div className="flex items-center justify-between gap-2 text-xs text-foreground-subtle">
                <span>{(r.reasons || []).join(", ")}</span>
                <StatusPill status={r.status} />
              </div>
              <p className="mt-1 text-foreground-muted">{r.note}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">Last 100 account actions</h2>
        {(data.activity || []).length === 0 && <p className="text-sm text-foreground-subtle">None yet</p>}
        <ul className="space-y-1 text-xs text-foreground-muted">
          {(data.activity || []).map((a) => (
            <li key={a.id}>{new Date(a.created_at).toLocaleString()} - {a.action}{a.detail ? ` - ${a.detail}` : ""}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="py-1">
      <div className="text-[11px] text-foreground-subtle">{label}</div>
      <div className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}
