"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaSetup({ enrolled }: { enrolled: boolean }) {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (enrolled) return;
    (async () => {
      const supabase = createClient();
      const { data, error: startErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Pow3Folio ops",
      });
      if (startErr) {
        setError(startErr.message);
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
    })();
  }, [enrolled]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    try {
      let id = factorId;
      if (enrolled && !id) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        id = factors?.totp.find((f) => f.status === "verified")?.id || null;
      }
      if (!id) {
        setError("No authenticator factor found.");
        setBusy(false);
        return;
      }
      const challenge = await supabase.auth.mfa.challenge({ factorId: id });
      if (challenge.error) {
        setError(challenge.error.message);
        setBusy(false);
        return;
      }
      const result = await supabase.auth.mfa.verify({
        factorId: id,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (result.error) {
        setError(result.error.message);
        setBusy(false);
        return;
      }
      router.replace("/ops");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-lg font-semibold">Admin two-factor</h1>
      <p className="text-sm text-foreground-muted">
        Admin accounts require an authenticator app. Regular builder accounts are not affected.
      </p>
      {qr && (
        <div className="rounded-xl border border-border p-4 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Authenticator QR code" className="mx-auto h-44 w-44" />
        </div>
      )}
      {enrolled && <p className="text-sm">Enter a code from your authenticator to continue.</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <form onSubmit={verify} className="space-y-3">
        <input
          className="input text-center tracking-[0.3em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Checking…" : "Verify"}
        </button>
      </form>
    </div>
  );
}
