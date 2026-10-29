"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  email: string | null;
  open: boolean;
  onClose: () => void;
};

export default function DeleteAccountModal({ email, open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"warn" | "otp" | "done">("warn");
  const [code, setCode] = useState("");
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function sendCode() {
    if (!email) {
      setError("No login email on this account. Contact support.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Could not send the code.");
        setBusy(false);
        return;
      }
      setStep("otp");
    } catch {
      setError("Could not send the code. Check your connection.");
    }
    setBusy(false);
  }

  async function confirmDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (phrase.trim().toUpperCase() !== "DELETE") {
      setError("Type DELETE in capitals to confirm.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const verify = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const vjson = (await verify.json()) as { error?: string };
      if (!verify.ok) {
        setError(vjson.error || "Incorrect code.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: email, phrase: "DELETE" }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Could not delete the account.");
        setBusy(false);
        return;
      }
      setStep("done");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 800);
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5" onClick={(e) => e.stopPropagation()}>
        {step === "warn" && (
          <>
            <h2 className="text-base font-semibold text-danger">Delete account</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              This permanently removes your public profile and proof data. We will send a code to {email || "your login email"}. Enter that code and type DELETE to finish.
            </p>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg bg-danger px-3 py-2 text-xs font-medium text-white" disabled={busy} onClick={sendCode}>
                {busy ? "Sending…" : "Send code"}
              </button>
              <button type="button" className="btn-ghost text-xs" onClick={onClose} disabled={busy}>Cancel</button>
            </div>
          </>
        )}
        {step === "otp" && (
          <form onSubmit={confirmDelete} className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Confirm deletion</h2>
            <p className="text-sm text-foreground-muted">Code sent to {email}. Type DELETE to confirm.</p>
            <input className="input text-sm" value={code} onChange={(e) => setCode(e.target.value)} placeholder="4-digit code" inputMode="numeric" maxLength={6} />
            <input className="input text-sm" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="DELETE" />
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-danger px-3 py-2 text-xs font-medium text-white" disabled={busy}>
                {busy ? "Deleting…" : "Permanently delete"}
              </button>
              <button type="button" className="btn-ghost text-xs" onClick={onClose} disabled={busy}>Cancel</button>
            </div>
          </form>
        )}
        {step === "done" && <p className="text-sm text-foreground">Account deleted. Redirecting…</p>}
      </div>
    </div>
  );
}
