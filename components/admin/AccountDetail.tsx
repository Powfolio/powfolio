"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/admin/AccountsTable";

type Detail = {
  profile: {
    id: string;
    username: string;
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
  };
  email: string | null;
  emailConfirmed: boolean;
  providers: string[];
  reports: Array<{
    id: string;
    reasons: string[];
    note: string;
    status: string;
    created_at: string;
    attachments: string[];
  }>;
  audit: Array<{
    id: string;
    actor_email: string | null;
    action: string;
    reason: string | null;
    created_at: string;
  }>;
};

export default function AccountDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/accounts/${id}`);
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
    if (action === "delete" && !window.confirm("Permanently delete this account and auth user?")) return;
    setBusy(action);
    const res = await fetch(`/api/admin/accounts/${id}/action`, {
      method: "POST",
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
      window.location.href = "/ops";
      return;
    }
    await load();
  }

  if (error && !data) return <p className="text-sm text-danger">{error}</p>;
  if (!data) return <p className="text-sm text-foreground-muted">Loading account\u2026</p>;
  const p = data.profile;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/ops" className="text-xs text-foreground-subtle hover:text-foreground">
            \u2190 Back to accounts
          </Link>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Account file</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">@{p.username}</h1>
          <p className="text-sm text-foreground-muted">{p.displayName || "No display name"}</p>
        </div>
        <StatusPill status={p.status} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Email" value={data.email || "\u2014"} />
        <Info label="Email confirmed" value={data.emailConfirmed ? "Yes" : "No"} />
        <Info label="Signed up" value={new Date(p.createdAt).toLocaleString()} />
        <Info label="Public profile" value={p.isPublic ? "Yes" : "No"} />
        <Info label="Wallet" value={p.wallet || "\u2014"} mono />
        <Info label="Providers" value={data.providers.join(", ") || "email"} />
      </section>

      {p.bio && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-medium mb-1">Bio</h2>
          <p className="text-sm text-foreground-muted">{p.bio}</p>
        </section>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <div>
          <h2 className="text-base font-semibold">Moderation actions</h2>
          <p className="mt-1 text-xs text-foreground-subtle">Every click writes an audit row. Add a reason first.</p>
        </div>
        <textarea
          className="input text-sm min-h-20"
          placeholder="Reason (stored in the audit log)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("review")}>
            {busy === "review" ? "\u2026" : "Mark under review"}
          </button>
          <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("warn")}>
            {busy === "warn" ? "\u2026" : "Log warning"}
          </button>
          <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("suspend")}>
            {busy === "suspend" ? "\u2026" : "Suspend"}
          </button>
          <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => act("unsuspend")}>
            {busy === "unsuspend" ? "\u2026" : "Un-suspend"}
          </button>
          <button className="btn-ghost text-xs text-danger" disabled={!!busy} onClick={() => act("delete")}>
            {busy === "delete" ? "\u2026" : "Delete account"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">Reports against this account</h2>
        {data.reports.length === 0 && <p className="text-sm text-foreground-subtle">None</p>}
        <div className="space-y-2">
          {data.reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
              <div className="flex items-center justify-between gap-2 text-xs text-foreground-subtle">
                <span>{(r.reasons || []).join(", ")}</span>
                <StatusPill status={r.status} />
              </div>
              <p className="mt-1 text-foreground-muted">{r.note}</p>
              <p className="mt-1 text-[11px] text-foreground-subtle">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">Audit entries</h2>
        {data.audit.length === 0 && <p className="text-sm text-foreground-subtle">None yet</p>}
        <ul className="space-y-1 text-xs text-foreground-muted">
          {data.audit.map((a) => (
            <li key={a.id} className="rounded-lg border border-border/70 px-3 py-2">
              {new Date(a.created_at).toLocaleString()} \u00b7 {a.actor_email || "admin"} \u00b7 {a.action}
              {a.reason ? ` \u00b7 ${a.reason}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <div className="text-[11px] text-foreground-subtle">{label}</div>
      <div className={`mt-1 text-sm break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}
