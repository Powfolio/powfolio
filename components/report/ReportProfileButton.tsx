"use client";

import { useEffect, useState } from "react";
import { REPORT_REASONS } from "@/lib/reports/constants";
import AuthModal from "@/components/auth/AuthModal";

export default function ReportProfileButton({
  targetId,
  targetUsername,
  signedIn,
  autoOpen = false,
}: {
  targetId: string;
  targetUsername: string;
  signedIn: boolean;
  autoOpen?: boolean;
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);

  async function start() {
    if (!signedIn) {
      setAuthOpen(true);
      return;
    }
    setError(null);
    const res = await fetch(`/api/reports/eligibility?target=${targetId}`);
    const json = await res.json();
    if (!json.ok) {
      setOpen(true);
      setError(json.reason || json.error || "You cannot submit a report right now.");
      return;
    }
    setOpen(true);
  }

  useEffect(() => {
    if (autoOpen) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  function toggleReason(id: string) {
    setReasons((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("Confirm that this report is accurate before sending.");
      return;
    }
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.set("targetId", targetId);
    body.set("reasons", reasons.join(","));
    body.set("note", note);
    files.forEach((f) => body.append("files", f));
    const res = await fetch("/api/reports/submit", { method: "POST", body });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not send the report");
      return;
    }
    setThanks(true);
  }

  return (
    <div className="mt-16 pb-8 text-center">
      <button type="button" className="text-[11px] text-foreground-subtle underline-offset-4 hover:text-foreground-muted hover:underline" onClick={start}>
        Report @{targetUsername}
      </button>
      {authOpen && (
        <AuthModal
          nextPath={`/${targetUsername}?report=1`}
          onClose={() => setAuthOpen(false)}
          onSignedIn={() => {
            setAuthOpen(false);
            window.location.href = `/${targetUsername}?report=1`;
          }}
        />
      )}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{thanks ? "Report received" : `Report @${targetUsername}`}</h2>
              <button type="button" className="btn-ghost text-xs" onClick={() => setOpen(false)} aria-label="Close">Close</button>
            </div>
            {thanks ? (
              <p className="text-sm text-foreground-muted">Thank you, your report has been received.</p>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                {error && <p className="text-xs text-danger">{error}</p>}
                <div className="grid gap-1.5">
                  {REPORT_REASONS.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={reasons.includes(r.id)} onChange={() => toggleReason(r.id)} />
                      {r.label}
                    </label>
                  ))}
                </div>
                <textarea className="input min-h-24 text-sm" required minLength={8} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short written note. Required." />
                <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 3))} className="text-xs" />
                <p className="text-[11px] text-foreground-subtle">Optional. Up to 3 images, 5MB each.</p>
                <label className="flex items-start gap-2 text-xs leading-5 text-foreground-muted">
                  <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                  <span>I confirm this report is accurate and may be reviewed by Pow3Folio ops.</span>
                </label>
                <button className="btn-primary w-full text-sm" disabled={busy || !consent}>
                  {busy ? "Sending..." : "Submit report"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
