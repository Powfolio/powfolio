"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { connectEthereumWallet } from "@/lib/wallet";
import { startXAuth } from "@/lib/x-oauth";
import { checkWalletAvailable } from "@/lib/wallets/client-check";
import { markNewSignup } from "@/components/onboarding/OnboardingTour";
import { isReservedDeletedUsername, reservedUsernameMessage } from "@/lib/usernames";
import StairsLoader from "@/components/auth/StairsLoader";

type Mode = "signin" | "signup";

async function attachPendingWallet(userId: string) {
  try {
    const pending = localStorage.getItem("pow3folio_pending_wallet");
    if (!pending) return;
    const check = await checkWalletAvailable(pending);
    if (!check.ok) {
      localStorage.removeItem("pow3folio_pending_wallet");
      return;
    }
    const supabase = createClient();
    await supabase.from("profiles").update({ wallet_address: pending.toLowerCase() }).eq("id", userId);
    localStorage.removeItem("pow3folio_pending_wallet");
  } catch {
    /* ignore */
  }
}

function EyeButton({ hidden, onClick }: { hidden: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={hidden ? "Show password" : "Hide password"} className={`absolute right-3 top-3.5 z-20 p-1 text-slate-400 hover:text-bronze-500 ${hidden ? "eye-hidden" : ""}`}>
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path className="eye-pupil" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <line className="eye-slash-line" x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function SocialRow({ compact, onGoogle, onX, onGithub, onWallet }: { compact?: boolean; onGoogle: () => void; onX: () => void; onGithub: () => void; onWallet: () => void }) {
  const cls = `flex items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition-all hover:bg-slate-200/70 dark:bg-darkInput dark:text-white dark:hover:bg-zinc-800 ${compact ? "p-1.5 text-[10px]" : "p-2 text-xs"}`;
  return (
    <div className="mb-3 grid grid-cols-4 gap-2">
      <button type="button" className={cls} title="Continue with Google" onClick={onGoogle}>G</button>
      <button type="button" className={cls} title="Continue with X" onClick={onX}>X</button>
      <button type="button" className={cls} title="Continue with GitHub" onClick={onGithub}>GH</button>
      <button type="button" className={cls} title="Connect Web3 Wallet" onClick={onWallet}>W3</button>
    </div>
  );
}

export default function AuthExperience({ initialMode, nextPath = "/dashboard" }: { initialMode: Mode; nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [toast, setToast] = useState<string | null>(null);
  const [loader, setLoader] = useState({ open: true, title: "Loading...", subtitle: "Preparing environment" });
  const [dark, setDark] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpPhase, setOtpPhase] = useState<"idle" | "orbit" | "success" | "error">("idle");
  const [resendLeft, setResendLeft] = useState(30);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const toastTimer = useRef<number | null>(null);

  const pwState = useMemo(() => {
    if (!confirmPassword) return "";
    if (signupPassword.startsWith(confirmPassword)) return signupPassword === confirmPassword ? "pw-match" : "";
    return "pw-mismatch";
  }, [signupPassword, confirmPassword]);

  function notice(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }
  function showLoader(title: string, subtitle: string) {
    setLoader({ open: true, title, subtitle });
  }
  function hideLoader() {
    setLoader((s) => ({ ...s, open: false }));
  }
  function goNext() {
    router.replace(nextPath || "/dashboard");
    router.refresh();
  }

  useEffect(() => {
    const stored = localStorage.getItem("pow3folio-theme");
    const preferred = stored === "light" || stored === "dark" ? stored : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setDark(preferred === "dark");
    document.documentElement.classList.toggle("dark", preferred === "dark");
    const t = window.setTimeout(() => hideLoader(), 600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!otpOpen || resendLeft <= 0) return;
    const id = window.setInterval(() => setResendLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [otpOpen, resendLeft]);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    localStorage.setItem("pow3folio-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function signInWithProvider(id: "google" | "x" | "github") {
    if (mode === "signup" && !accepted) {
      notice("Accept the Terms and Privacy Policy first");
      return;
    }
    showLoader(`Connecting ${id === "x" ? "X" : id === "github" ? "GitHub" : "Google"}...`, "Establishing secure connection");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath || "/dashboard")}`;
    if (id === "x") {
      const { error } = await startXAuth(supabase, "signIn", redirectTo);
      if (error) {
        hideLoader();
        notice(error);
      }
      return;
    }
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: id as Provider, options: { redirectTo, skipBrowserRedirect: true } });
    if (error) {
      hideLoader();
      notice(error.message);
      return;
    }
    if (data?.url) {
      window.location.assign(data.url);
      return;
    }
    hideLoader();
    notice("No OAuth URL returned. This provider is not configured.");
  }

  async function connectWallet() {
    showLoader("Connecting Web3 Wallet...", "Establishing secure connection");
    try {
      const address = await connectEthereumWallet();
      const check = await checkWalletAvailable(address);
      if (!check.ok) {
        hideLoader();
        notice(check.error);
        return;
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: upErr } = await supabase.from("profiles").update({ wallet_address: address }).eq("id", user.id);
        hideLoader();
        if (upErr) {
          notice(upErr.code === "23505" || upErr.message.toLowerCase().includes("wallet") ? "This wallet is already linked to another Pow3Folio account." : upErr.message);
          return;
        }
        goNext();
        return;
      }
      try { localStorage.setItem("pow3folio_pending_wallet", address); } catch { /* ignore */ }
      hideLoader();
      notice(`Wallet ${address.slice(0, 6)}…${address.slice(-4)} saved. Sign in to link it.`);
    } catch (err) {
      hideLoader();
      notice(err instanceof Error ? err.message : "Wallet connection failed");
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    showLoader("Signing in...", "Checking your credentials");
    try { localStorage.setItem("pow3folio_remember", rememberMe ? "1" : "0"); } catch { /* ignore */ }
    const res = await fetch("/api/auth/password-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password: loginPassword }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      hideLoader();
      notice(json.error || "Invalid login credentials.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.setSession({ access_token: json.session.access_token, refresh_token: json.session.refresh_token });
    if (error) {
      hideLoader();
      notice(error.message);
      return;
    }
    if (json.userId) await attachPendingWallet(json.userId);
    hideLoader();
    goNext();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    const target = forgotEmail.trim() || (identifier.includes("@") ? identifier.trim() : "");
    if (!target || !target.includes("@")) {
      notice("Enter the email for your account");
      return;
    }
    showLoader("Sending reset link...", "Check your inbox shortly");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(target, { redirectTo: `${window.location.origin}/auth/update-password` });
    hideLoader();
    if (error) notice(error.message);
    else {
      notice("Password reset email sent if that account exists");
      setForgotOpen(false);
    }
  }

  async function sendOtp(isResend = false) {
    const emailVal = email.trim();
    if (!emailVal.includes("@")) {
      notice("Please enter a valid email address first");
      return;
    }
    showLoader(isResend ? "Resending code..." : "Sending code...", "Delivering your verification email");
    const res = await fetch("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailVal }) });
    const json = await res.json().catch(() => ({}));
    hideLoader();
    if (!res.ok || !json.ok) {
      notice(json.error || "Could not send verification code");
      return;
    }
    setEmailVerified(false);
    setOtp(["", "", "", ""]);
    setOtpPhase("idle");
    setResendLeft(30);
    setOtpOpen(true);
    notice("Verification code sent to your email");
    window.setTimeout(() => otpRefs.current[0]?.focus(), 200);
  }

  async function verifyOtp() {
    if (otpPhase !== "idle") return;
    const code = otp.join("");
    if (code.length < 4) {
      notice("Enter all 4 digits from your email");
      return;
    }
    setOtpPhase("orbit");
    const res = await fetch("/api/auth/otp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), code }) });
    const json = await res.json().catch(() => ({}));
    window.setTimeout(() => {
      if (res.ok && json.ok) {
        setOtpPhase("success");
        setEmailVerified(true);
        window.setTimeout(() => { setOtpOpen(false); setOtpPhase("idle"); notice("Email verified & secured"); }, 1400);
      } else {
        setOtpPhase("error");
        notice(json.error || "Incorrect code");
        window.setTimeout(() => { setOtp(["", "", "", ""]); setOtpPhase("idle"); otpRefs.current[0]?.focus(); }, 1400);
      }
    }, 1750);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) return notice("Accept the Terms and Privacy Policy to create an account.");
    if (!emailVerified) return notice('Email verification required! Please tap "Send Code"');
    if (signupPassword !== confirmPassword) return notice("Passwords do not match");
    const uname = username.trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_]{3,30}$/.test(uname)) return notice("Username must be 3-30 characters: letters, numbers, underscore.");
    if (isReservedDeletedUsername(uname)) return notice(reservedUsernameMessage());
    const ready = await fetch("/api/auth/signup-ready", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
    if (!ready.ok) return notice("Email verification required before creating an account.");
    showLoader("Creating Powfolio...", "Setting up your web3 identity");
    const guard = await fetch("/api/auth/signup-guard", { method: "POST" });
    const guardJson = await guard.json().catch(() => ({}));
    if (guard.status === 429) {
      hideLoader();
      return notice(guardJson.error || "Too many signups from this network. Try again later.");
    }
    const supabase = createClient();
    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath || "/dashboard")}`,
        data: { first_name: firstName.trim(), last_name: lastName.trim(), username: uname, display_name: displayName },
      },
    });
    if (error) {
      hideLoader();
      const msg = error.message.toLowerCase();
      return notice(msg.includes("already") || msg.includes("registered") || msg.includes("exists") || error.status === 422 ? "This email is already connected to an active account. Log in instead." : error.message);
    }
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      hideLoader();
      return notice("This email is already connected to an active account. Log in instead.");
    }
    if (data.user) {
      await supabase.from("profiles").update({ username: uname, display_name: displayName || null }).eq("id", data.user.id);
      await attachPendingWallet(data.user.id);
    }
    markNewSignup();
    hideLoader();
    if (data.session) return goNext();
    notice("Account created. Check your email if a confirmation step remains.");
    setMode("signin");
  }

  const otpClass = (i: number) => {
    if (otpPhase === "orbit") return `otp-squircle ${["pos-d-top", "pos-d-right", "pos-d-bottom", "pos-d-left"][i]}`;
    if (otpPhase === "success" || otpPhase === "error") return "otp-squircle pos-merged";
    return `otp-squircle pos-h${i}`;
  };

  const goldBtn = "w-full rounded-xl bg-gradient-to-r from-bronze-300 via-bronze-400 to-amber-400 px-4 py-2.5 text-sm font-semibold text-black shadow-md shadow-bronze-500/10 transition-all hover:brightness-105 active:scale-[0.99]";

  return (
    <div className="pow-auth-page relative flex min-h-screen flex-col items-center justify-between bg-[#F8F9FA] p-4 text-slate-800 dark:bg-darkBg dark:text-zinc-100 sm:p-8">
      <StairsLoader open={loader.open} title={loader.title} subtitle={loader.subtitle} />
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <header className="z-10 flex w-full max-w-5xl items-center justify-end py-2">
        <button type="button" aria-label="Toggle dark mode" onClick={toggleTheme} className="rounded-full bg-white/80 p-2.5 text-slate-600 shadow-sm backdrop-blur-md hover:text-bronze-500 dark:bg-darkSurface/80 dark:text-zinc-400">
          {dark ? "Light" : "Dark"}
        </button>
      </header>
      <main id="main" className="z-10 my-auto flex w-full items-center justify-center py-2">
        <div className={`auth-container ${mode === "signup" ? "right-panel-active" : ""}`}>
          <div className="form-panel sign-in-panel">
            <div className="mx-auto w-full max-w-sm">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Welcome back</h2>
              <p className="mb-4 mt-0.5 text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">Log in to manage your proof of work Powfolio.</p>
              <SocialRow onGoogle={() => signInWithProvider("google")} onX={() => signInWithProvider("x")} onGithub={() => signInWithProvider("github")} onWallet={connectWallet} />
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-full border-t border-slate-200/60 dark:border-zinc-800/80" />
                <span className="absolute bg-white px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:bg-[#101014] dark:text-zinc-500">or email</span>
              </div>
              {forgotOpen ? (
                <form onSubmit={handleForgot} className="space-y-3">
                  <div className="field-group">
                    <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} autoComplete="email" />
                    <label className="field-notch-label">Account email</label>
                  </div>
                  <button type="submit" className={goldBtn}>Send reset link</button>
                  <button type="button" className="w-full text-xs text-slate-500 underline" onClick={() => setForgotOpen(false)}>Back to sign in</button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="field-group">
                    <input type="text" required autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                    <label className="field-notch-label">Email / Username</label>
                  </div>
                  <div className="field-group relative">
                    <input type={showLoginPw ? "text" : "password"} required autoComplete="current-password" className="pr-10" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                    <label className="field-notch-label">Password</label>
                    <EyeButton hidden={!showLoginPw} onClick={() => setShowLoginPw((v) => !v)} />
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center text-xs text-slate-500 dark:text-zinc-400">
                      <input type="checkbox" className="h-3.5 w-3.5 cursor-pointer rounded accent-[#C59B27]" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                      <span className="ml-2">Remember me</span>
                    </label>
                    <button type="button" className="text-xs text-bronze-600 hover:underline dark:text-bronze-400" onClick={() => setForgotOpen(true)}>Forgot password?</button>
                  </div>
                  <button type="submit" className={goldBtn}>Sign In</button>
                </form>
              )}
            </div>
          </div>

          <div className="form-panel sign-up-panel">
            <div className="mx-auto w-full max-w-sm sm:max-w-md">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Create Account</h2>
              <p className="mb-2 text-[11px] text-slate-500 dark:text-zinc-400 sm:text-xs">Build your Web3 proof of work Powfolio.</p>
              <SocialRow compact onGoogle={() => signInWithProvider("google")} onX={() => signInWithProvider("x")} onGithub={() => signInWithProvider("github")} onWallet={connectWallet} />
              <form onSubmit={handleSignUp} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="field-group">
                    <input type="text" required autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <label className="field-notch-label">First Name</label>
                  </div>
                  <div className="field-group">
                    <input type="text" required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    <label className="field-notch-label">Last Name</label>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="field-group">
                    <input type="text" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <label className="field-notch-label">Username</label>
                  </div>
                  <div className="field-group relative">
                    <input type="email" required autoComplete="email" className={`pr-20 ${emailVerified ? "email-verified-border" : ""}`} value={email} onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); }} />
                    <label className="field-notch-label">Email Address</label>
                    <div className="absolute right-2.5 top-2.5 z-20">
                      {emailVerified ? <span className="text-[10px] font-bold text-emerald-500">Verified</span> : <button type="button" className="text-[11px] font-semibold text-bronze-600 hover:underline dark:text-bronze-400" onClick={() => sendOtp(false)}>Send Code</button>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="field-group relative">
                    <input type={showSignupPw ? "text" : "password"} required autoComplete="new-password" minLength={6} className="pr-7 text-xs" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                    <label className="field-notch-label">Password</label>
                    <EyeButton hidden={!showSignupPw} onClick={() => setShowSignupPw((v) => !v)} />
                  </div>
                  <div className="field-group relative">
                    <input type={showConfirmPw ? "text" : "password"} required autoComplete="new-password" className={`pr-7 text-xs ${pwState}`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <label className="field-notch-label">Confirm</label>
                    <EyeButton hidden={!showConfirmPw} onClick={() => setShowConfirmPw((v) => !v)} />
                  </div>
                </div>
                <label className="flex items-start pt-1 text-[11px] leading-tight text-slate-500 dark:text-zinc-400">
                  <input type="checkbox" required className="mt-0.5 h-3.5 w-3.5 cursor-pointer rounded accent-[#C59B27]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                  <span className="ml-2">I accept the <Link href="/terms" className="text-bronze-600 underline dark:text-bronze-400">Terms</Link> & <Link href="/privacy" className="text-bronze-600 underline dark:text-bronze-400">Privacy Policy</Link></span>
                </label>
                <button type="submit" className={`${goldBtn} mt-1`}>Create Account</button>
              </form>
            </div>
          </div>

          <div className="overlay-wrapper">
            <div className="overlay-content">
              <div className="overlay-box overlay-left-box">
                <h3 className="mb-1 text-xl font-bold text-white sm:text-3xl">Welcome Back!</h3>
                <p className="mb-4 max-w-xs text-xs text-bronze-100/80 sm:mb-6 sm:text-sm">To keep connected with your Web3 proof of work Powfolio, please login with your personal credentials.</p>
                <button type="button" onClick={() => setMode("signin")} className="rounded-full border border-white/70 px-7 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-white hover:text-black sm:px-8 sm:text-sm">Sign In</button>
              </div>
              <div className="overlay-box overlay-right-box">
                <h3 className="mb-1 text-xl font-bold text-white sm:text-3xl">Hello, Creator!</h3>
                <p className="mb-4 max-w-xs text-xs text-bronze-100/80 sm:mb-6 sm:text-sm">Enter your personal details or connect your wallet to start your Web3 Powfolio journey.</p>
                <button type="button" onClick={() => setMode("signup")} className="rounded-full border border-white/70 px-7 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-white hover:text-black sm:px-8 sm:text-sm">Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {otpOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glassy-otp-panel relative w-full max-w-sm px-6 py-7 text-center">
            <span className="glass-corner-tl" />
            <span className="glass-corner-br" />
            <button type="button" className="absolute right-4 top-4 text-xs text-zinc-400" onClick={() => setOtpOpen(false)}>Close</button>
            <h3 className="text-lg font-bold text-white">{otpPhase === "success" ? "Verified Successfully" : otpPhase === "error" ? "Verification Failed" : "Verify OTP"}</h3>
            <p className="mt-1 text-xs text-zinc-400">{otpPhase === "success" ? "Your security verification code has been confirmed." : otpPhase === "error" ? "Incorrect or expired code. Try again." : "Enter the 4-digit security code sent to your email"}</p>
            <div className="otp-stage-container">
              <div className={`otp-orbit-wrapper ${otpPhase === "orbit" ? "orbiting-circular-5x" : ""}`}>
                {otp.map((digit, i) => (
                  <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} className={otpClass(i)} value={digit} readOnly={otpPhase !== "idle"} onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 1);
                    setOtp((prev) => { const n = [...prev]; n[i] = val; return n; });
                    if (val && i < 3) otpRefs.current[i + 1]?.focus();
                  }} onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }} onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4).split("");
                    setOtp([pasted[0] || "", pasted[1] || "", pasted[2] || "", pasted[3] || ""]);
                  }} />
                ))}
              </div>
            </div>
            <p className="mb-5 text-xs text-zinc-400">
              Didn't receive the code?{" "}
              {resendLeft > 0 ? <span className="font-semibold text-amber-400">Resend in 00:{String(resendLeft).padStart(2, "0")}</span> : <button type="button" className="font-semibold text-amber-400 underline" onClick={() => sendOtp(true)}>Resend Code</button>}
            </p>
            <button type="button" onClick={verifyOtp} disabled={otpPhase !== "idle"} className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 via-bronze-400 to-amber-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-70">
              {otpPhase === "orbit" ? "Verifying Code..." : otpPhase === "success" ? "Verified & Secured" : otpPhase === "error" ? "Retry Code" : "Verify OTP"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[350] rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs text-white shadow-xl">{toast}</div>
      )}
    </div>
  );
}
