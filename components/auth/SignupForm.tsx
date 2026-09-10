"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { markNewSignup } from "@/components/onboarding/OnboardingTour";

export default function SignupForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loginHref = nextPath && nextPath !== "/dashboard" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  async function guardSignup() {
    const res = await fetch("/api/auth/signup-guard", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (res.status === 429) {
      setError(json.error || "Too many signups from this network. Try again later.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const allowed = await guardSignup();
    if (!allowed) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath || "/dashboard")}`,
      },
    });

    setLoading(false);

    if (signError) {
      const msg = signError.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        signError.status === 422
      ) {
        setError("This email is already connected to an active account. Log in instead.");
      } else {
        setError(signError.message);
      }
      return;
    }

    const identities = data?.user?.identities;
    if (data?.user && Array.isArray(identities) && identities.length === 0) {
      setError("This email is already connected to an active account. Log in instead.");
      return;
    }

    markNewSignup();
    setSuccess(true);
  }

  async function signInWithProvider(provider: "google" | "twitter") {
    setError(null);
    setOauthLoading(provider);
    const allowed = await guardSignup();
    if (!allowed) {
      setOauthLoading(null);
      return;
    }
    markNewSignup();
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath || "/dashboard")}`,
      },
    });
    if (oauthError) {
      const msg = oauthError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        setError("This Google or X account is already connected to an active Pow3Folio account. Log in instead.");
      } else {
        setError(oauthError.message);
      }
      setOauthLoading(null);
    }
  }

  if (success) {
    return (
      <div className="card text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          ✓
        </div>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          We sent a confirmation link to{" "}
          <strong className="text-foreground">{email}</strong>. Click it to activate your
          account.
        </p>
        <Link href={loginHref} className="btn-secondary mt-6 inline-flex">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <p>{error}</p>
          {(error.includes("already connected") || error.includes("Log in")) && (
            <Link href={loginHref} className="mt-2 inline-block font-medium text-primary hover:underline">
              Go to login
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <button
          type="button"
          disabled={!!oauthLoading}
          onClick={() => signInWithProvider("google")}
          className="btn-secondary w-full justify-center text-sm"
        >
          {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          disabled={!!oauthLoading}
          onClick={() => signInWithProvider("twitter")}
          className="btn-secondary w-full justify-center text-sm"
        >
          {oauthLoading === "twitter" ? "Redirecting…" : "Continue with X"}
        </button>
      </div>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-surface px-2 text-foreground-subtle">or email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-11"
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-foreground-subtle hover:bg-surface-hover hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
