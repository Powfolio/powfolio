"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthModal({
  nextPath,
  onClose,
  onSignedIn,
}: {
  nextPath: string;
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    onSignedIn();
  }

  async function oauth(provider: "google" | "github") {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (oauthErr) setError(oauthErr.message);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Sign in to continue</h2>
            <p className="mt-1 text-sm text-foreground-muted">You stay on this page after login.</p>
          </div>
          <button type="button" className="btn-ghost text-xs" onClick={onClose}>
            Close
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-4 grid gap-2">
          <button type="button" className="btn-secondary w-full text-sm" onClick={() => oauth("google")}>
            Continue with Google
          </button>
          <button type="button" className="btn-secondary w-full text-sm" onClick={() => oauth("github")}>
            Continue with GitHub
          </button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input className="input" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
