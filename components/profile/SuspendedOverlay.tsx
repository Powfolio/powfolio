"use client";

import { useMemo, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

const GROUNDS = [
  { id: "mistake", label: "This is a mistake" },
  { id: "compromised", label: "My account was compromised" },
  { id: "removed", label: "I removed the flagged content" },
  { id: "identity", label: "I can prove this is my identity" },
  { id: "other", label: "Other" },
];

export default function SuspendedOverlay({
  username,
  reason,
  suspendedAt,
  signedIn,
  isOwner,
}: {
  username: string;
  reason: string | null;
  suspendedAt: string | null;
  signedIn: boolean;
  isOwner: boolean;
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const [grounds, setGrounds] = useState("mistake");
  const [statement, setStatement] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const deadline = useMemo(() => {
    if (!suspendedAt) return null;
    const end = new Date(new Date(suspendedAt).getTime() + 60 * 24 * 60 * 60 * 1000);
    return end;
  }, [suspendedAt]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/appeals/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grounds, statement, contactEmail }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not send appeal");
      return;
    }
    setDone(true);
  }

  const nextPath = `/${username}?appeal=1`;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-md" />
      <div className="fixed inset-0 z-50 overflow-y-auto p-4">
        <div className="mx-auto mt-10 w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-danger">Account status</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">This Account Has Been Suspended</h1>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            We found some suspicious or malicious activities or information on @{username}. Public content stays
            visible behind this notice so visitors can see the page exists, but it is not an active profile.
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-foreground-subtle">Reason</dt>
              <dd className="text-foreground">{reason || "Suspicious or malicious activity"}</dd>
            </div>
            <div>
              <dt className="text-foreground-subtle">Suspended</dt>
              <dd>{suspendedAt ? new Date(suspendedAt).toLocaleString() : "Recently"}</dd>
            </div>
            <div>
              <dt className="text-foreground-subtle">Appeal window</dt>
              <dd>{deadline ? `Open until ${deadline.toLocaleDateString()}` : "60 days from suspension"}</dd>
            </div>
          </dl>

          {done ? (
            <p className="mt-5 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
              Appeal received. Super Admin will review it in the Appeals queue.
            </p>
          ) : !signedIn ? (
            <button type="button" className="btn-primary mt-5 w-full" onClick={() => setAuthOpen(true)}>
              Login to submit an appeal if you think this is a mistake
            </button>
          ) : !isOwner ? (
            <p className="mt-5 text-sm text-foreground-muted">
              You are signed in as a different account. Sign in as @{username} to appeal.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-3">
              <p className="text-sm font-medium">Submit an appeal</p>
              <div className="grid gap-1.5">
                {GROUNDS.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="grounds" checked={grounds === g.id} onChange={() => setGrounds(g.id)} />
                    {g.label}
                  </label>
                ))}
              </div>
              <textarea
                className="input min-h-28 text-sm"
                required
                minLength={20}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Explain what happened, include dates, links, or anything an admin should check."
              />
              <input
                className="input text-sm"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Contact email for this appeal"
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? "Sending..." : "Submit appeal"}
              </button>
            </form>
          )}
        </div>
      </div>
      {authOpen && (
        <AuthModal
          nextPath={nextPath}
          onClose={() => setAuthOpen(false)}
          onSignedIn={() => {
            setAuthOpen(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
