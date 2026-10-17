"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = {
  id: string;
  status?: string;
  friendly_name?: string;
  factor_type?: string;
};

const APPS = [
  { id: "google", name: "Google Authenticator", hint: "Free on iOS and Android" },
  { id: "authy", name: "Authy", hint: "Backs up across devices" },
  { id: "1password", name: "1Password", hint: "If you already store logins there" },
  { id: "microsoft", name: "Microsoft Authenticator", hint: "Work and personal accounts" },
];

function collectFactors(data: { all?: Factor[]; totp?: Factor[] } | null): Factor[] {
  const all = data?.all || [];
  const totp = data?.totp || [];
  const byId = new Map<string, Factor>();
  for (const f of [...all, ...totp]) {
    if (f?.id) byId.set(f.id, f);
  }
  return [...byId.values()].filter((f) => (f.factor_type || "totp") === "totp");
}

export default function MfaSetup({ enrolled }: { enrolled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"loading" | "enroll" | "verify">(enrolled ? "verify" : "loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [app, setApp] = useState("google");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [existingName, setExistingName] = useState("Powfolio ops");
  const bootstrapped = useRef(false);

  const groupedSecret = useMemo(() => {
    if (!secret) return "";
    return secret.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
  }, [secret]);

  const selectedApp = APPS.find((a) => a.id === app) || APPS[0];

  const clearStuck = useCallback(async (action: "clear_unverified" | "reset_all") => {
    await fetch("/api/admin/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }, []);

  const startEnroll = useCallback(async () => {
    const supabase = createClient();
    const friendlyName = "Powfolio ops";
    const first = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName });
    if (!first.error && first.data) return first.data;

    const retryName = `Powfolio ops ${Date.now().toString().slice(-6)}`;
    const second = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: retryName });
    if (second.error) throw new Error(second.error.message);
    return second.data;
  }, []);

  const bootstrap = useCallback(
    async (forceNew: boolean) => {
      setBusy(true);
      setError(null);
      const supabase = createClient();
      try {
        const listed = await supabase.auth.mfa.listFactors();
        if (listed.error) throw new Error(listed.error.message);
        const factors = collectFactors(listed.data);
        const verified = factors.filter((f) => f.status === "verified");
        const unverified = factors.filter((f) => f.status !== "verified");

        if (verified[0]?.friendly_name) setExistingName(verified[0].friendly_name);

        if (verified.length && !forceNew) {
          setFactorId(verified[0].id);
          setQr(null);
          setSecret(null);
          setMode("verify");
          setBusy(false);
          return;
        }

        await clearStuck(forceNew ? "reset_all" : "clear_unverified");
        for (const factor of forceNew ? [...verified, ...unverified] : unverified) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => undefined);
        }

        const enrolledFactor = await startEnroll();
        setFactorId(enrolledFactor.id);
        setQr(enrolledFactor.totp.qr_code);
        setSecret(enrolledFactor.totp.secret);
        setCode("");
        setShowSecret(false);
        setMode("enroll");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not start authenticator setup";
        if (message.toLowerCase().includes("already exists")) {
          setError(
            "An authenticator named \u201cPowfolio ops\u201d is already on this account. Enter the current 6-digit code from that app."
          );
          setMode("verify");
        } else {
          setError(message);
          setMode(enrolled ? "verify" : "enroll");
        }
      }
      setBusy(false);
    },
    [clearStuck, enrolled, startEnroll]
  );

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void bootstrap(false);
  }, [bootstrap]);

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
        id = collectFactors(factors).find((f) => f.status === "verified" || f.status === "unverified")?.id || null;
      }
      if (!id) {
        setError("No authenticator is attached yet. Start setup again so a QR code and key appear.");
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
    <div className="mx-auto max-w-xl animate-fade-in">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Ops security</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Connect an authenticator</h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Super Admin needs a time-based code from an app on your phone. Regular builder accounts are not asked for this.
        </p>
      </div>

      {mode === "loading" && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-foreground-muted">
          Checking authenticator status\u2026
        </div>
      )}

      {mode === "enroll" && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-subtle">Step 1</p>
                <h2 className="mt-1 text-base font-semibold">Choose an authenticator app</h2>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">Required once</span>
            </div>
            <p className="mt-1 text-xs text-foreground-subtle">Install one if you do not already have it, then come back here.</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {APPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setApp(item.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    app === item.id
                      ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                      : "border-border bg-surface-elevated hover:border-border-strong"
                  }`}
                >
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="mt-0.5 text-[11px] text-foreground-subtle">{item.hint}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-subtle">Step 2</p>
            <h2 className="mt-1 text-base font-semibold">Scan the QR or type the setup key</h2>
            <p className="mt-1 text-xs text-foreground-subtle">
              In {selectedApp.name}: Add account \u2192 Scan QR code. If the camera cannot scan, use the setup key instead.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="Powfolio ops authenticator QR code" className="h-44 w-44" />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center text-xs text-zinc-500">Preparing QR\u2026</div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-surface-elevated p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">Setup key</h3>
                  <button type="button" className="btn-ghost px-2 py-1 text-[11px]" onClick={() => setShowSecret((v) => !v)}>
                    {showSecret ? "Hide key" : "Show key"}
                  </button>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-foreground-subtle">
                  Add account \u2192 Enter a setup key \u2192 account name <span className="text-foreground">Powfolio ops</span> \u2192 type Time-based.
                </p>
                <code className="mt-3 block break-all rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-xs tracking-wide">
                  {secret ? (showSecret ? groupedSecret : "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022") : "Generating key\u2026"}
                </code>
                <button type="button" className="btn-secondary mt-3 w-full text-xs" onClick={copySecret} disabled={!secret}>
                  {copied ? "Setup key copied" : "Copy setup key"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {mode === "verify" && !qr && (
        <section className="mb-4 rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-subtle">Already connected</p>
          <h2 className="mt-1 text-base font-semibold">Open the app that already has this account</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Look for <span className="font-medium text-foreground">{existingName}</span> in your authenticator and type the current 6-digit code below.
          </p>
        </section>
      )}

      {mode !== "loading" && (
        <form onSubmit={verify} className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-subtle">
            {mode === "enroll" ? "Step 3" : "Confirm"}
          </p>
          <label htmlFor="ops-otp" className="mt-1 block text-base font-semibold">
            Enter the 6-digit code
          </label>
          <input
            id="ops-otp"
            className="input mt-3 text-center text-2xl tracking-[0.55em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            required
          />
          {error && (
            <div className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
          )}
          <button className="btn-primary mt-4 w-full" disabled={busy || code.trim().length < 6}>
            {busy ? "Checking\u2026" : "Verify and enter Ops"}
          </button>
        </form>
      )}
    </div>
  );
}
