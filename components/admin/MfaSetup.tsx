"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = {
  id: string;
  status?: string;
  friendly_name?: string;
  factor_type?: string;
};

const APPS = [
  { id: "google", name: "Google Authenticator", hint: "iOS and Android" },
  { id: "authy", name: "Authy", hint: "Multi-device backup" },
  { id: "1password", name: "1Password", hint: "If you already use it" },
  { id: "microsoft", name: "Microsoft Authenticator", hint: "Work and personal" },
];

export default function MfaSetup({ enrolled }: { enrolled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"loading" | "enroll" | "verify">(enrolled ? "verify" : "loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [app, setApp] = useState("google");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const groupedSecret = useMemo(() => {
    if (!secret) return "";
    return secret.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
  }, [secret]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error: listErr } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (listErr) {
        setError(listErr.message);
        setMode(enrolled ? "verify" : "enroll");
        return;
      }

      const all = ((data as { all?: Factor[] } | null)?.all || []) as Factor[];
      const totpAll = all.filter((f) => (f.factor_type || "totp") === "totp");
      const verified = (data?.totp || totpAll.filter((f) => f.status === "verified")) as Factor[];
      const unverified = totpAll.filter((f) => f.status === "unverified");

      if (verified.length) {
        setFactorId(verified[0].id);
        setMode("verify");
        return;
      }

      for (const factor of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data: enrolledFactor, error: startErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Pow3Folio ops",
      });
      if (cancelled) return;
      if (startErr) {
        setError(startErr.message);
        setMode("verify");
        return;
      }
      setFactorId(enrolledFactor.id);
      setQr(enrolledFactor.totp.qr_code);
      setSecret(enrolledFactor.totp.secret);
      setUri(enrolledFactor.totp.uri);
      setMode("enroll");
    })();
    return () => {
      cancelled = true;
    };
  }, [enrolled]);

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setShowSecret(true);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    try {
      let id = factorId;
      if (!id) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        id = factors?.totp.find((f) => f.status === "verified")?.id || null;
      }
      if (!id) {
        setError("No authenticator is attached to this admin account yet.");
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

  async function resetSetup() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const all = ((data as { all?: Factor[] } | null)?.all || []) as Factor[];
      for (const factor of all.filter((f) => (f.factor_type || "totp") === "totp" && f.status === "unverified")) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      const { data: enrolledFactor, error: startErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Pow3Folio ops " + Date.now(),
      });
      if (startErr) {
        setError(
          startErr.message.toLowerCase().includes("already exists")
            ? "This account already has an authenticator. Open that app and enter the 6-digit code. A verified factor can only be replaced after you verify once."
            : startErr.message
        );
        setMode("verify");
        setBusy(false);
        return;
      }
      setFactorId(enrolledFactor.id);
      setQr(enrolledFactor.totp.qr_code);
      setSecret(enrolledFactor.totp.secret);
      setUri(enrolledFactor.totp.uri);
      setCode("");
      setMode("enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restart setup");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 animate-fade-in">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Ops security</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Admin two-factor</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Only Super Admin sessions need this. Builder accounts stay on normal login.
        </p>
      </div>

      {mode === "loading" && <div className="card text-sm text-foreground-muted">Checking authenticator status…</div>}

      {mode === "enroll" && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-sm font-medium">1. Pick an authenticator app</h2>
            <p className="mt-1 text-xs text-foreground-subtle">Install one of these, then scan the QR or type the setup key.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {APPS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setApp(item.id)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  app === item.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-surface-elevated hover:border-border-strong"
                }`}
              >
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-[11px] text-foreground-subtle">{item.hint}</div>
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-sm font-medium">2. Scan this QR code</h2>
            <p className="mt-1 text-xs text-foreground-subtle">
              In {APPS.find((a) => a.id === app)?.name}, choose Add account, then Scan QR code.
            </p>
          </div>
          {qr ? (
            <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Authenticator QR code" className="h-48 w-48" />
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">Preparing QR code…</p>
          )}

          {secret && (
            <div className="rounded-xl border border-border bg-surface-elevated p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium">Or type the setup key</h2>
                <button type="button" className="btn-ghost text-[11px]" onClick={() => setShowSecret((v) => !v)}>
                  {showSecret ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-foreground-subtle">
                Add account → Enter a setup key → account name Pow3Folio ops → time-based.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs">
                  {showSecret ? groupedSecret : "•••• •••• •••• ••••"}
                </code>
                <button type="button" className="btn-secondary text-xs" onClick={copySecret}>
                  {copied ? "Copied" : "Copy key"}
                </button>
              </div>
              {uri && <p className="mt-2 break-all text-[11px] text-foreground-subtle">URI: {uri}</p>}
            </div>
          )}
        </div>
      )}

      {mode === "verify" && !qr && (
        <div className="card space-y-3">
          <h2 className="text-sm font-medium">Authenticator already connected</h2>
          <p className="text-sm text-foreground-muted">
            Open the app that already has <span className="font-medium text-foreground">Pow3Folio ops</span> and enter the current 6-digit code.
          </p>
          <button type="button" className="btn-ghost px-0 text-xs" onClick={resetSetup} disabled={busy}>
            Set up a new authenticator instead
          </button>
        </div>
      )}

      {mode !== "loading" && (
        <form onSubmit={verify} className="card space-y-3">
          <div>
            <label htmlFor="ops-otp" className="label">
              Enter the 6-digit code
            </label>
            <input
              id="ops-otp"
              className="input text-center text-lg tracking-[0.45em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
          )}
          <button className="btn-primary w-full" disabled={busy || code.trim().length < 6}>
            {busy ? "Checking…" : "Verify and enter Ops"}
          </button>
        </form>
      )}
    </div>
  );
}
