"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { connectEthereumWallet, signWalletMessage } from "@/lib/wallet";
import { startXAuth } from "@/lib/x-oauth";
import { checkWalletAvailable } from "@/lib/wallets/client-check";
import { markNewSignup } from "@/components/onboarding/OnboardingTour";
import { isReservedDeletedUsername, reservedUsernameMessage } from "@/lib/usernames";
import { startRouteLoader, stopRouteLoader } from "@/lib/route-loader";

export type AuthMode = "signin" | "signup";
export type OtpPhase = "idle" | "orbit" | "success" | "error";

function formatLockout(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

function oauthQuery(id: "google" | "github"): Record<string, string> {
  if (id === "google") {
    return { prompt: "consent select_account", access_type: "offline" };
  }
  return { prompt: "consent" };
}

export function useAuthExperience(initialMode: AuthMode, nextPath = "/dashboard") {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [toast, setToast] = useState<string | null>(null);
  const [loader, setLoader] = useState({ open: true, title: "Loading...", subtitle: "Preparing environment" });
  const [dark, setDark] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwAnim, setPwAnim] = useState(0);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendBounce, setSendBounce] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpPhase, setOtpPhase] = useState<OtpPhase>("idle");
  const [orbiting, setOrbiting] = useState(false);
  const [resendLeft, setResendLeft] = useState(30);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const toastTimer = useRef<number | null>(null);
  const animTimers = useRef<number[]>([]);
  const holdNav = useRef(false);

  const pwState = useMemo(() => {
    if (!confirmPassword) return "";
    return signupPassword.startsWith(confirmPassword) ? "pw-match" : "pw-mismatch";
  }, [signupPassword, confirmPassword]);

  function setConfirmPasswordLive(value: string) {
    setConfirmPassword(value);
    setPwAnim((n) => n + 1);
  }

  function setSignupPasswordLive(value: string) {
    setSignupPassword(value);
    if (confirmPassword) setPwAnim((n) => n + 1);
  }

  function notice(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }
  function showLoader(title: string, subtitle: string, dest?: string) {
    setLoader({ open: true, title, subtitle });
    startRouteLoader(title, subtitle, dest);
  }
  function hideLoader() {
    if (holdNav.current) return;
    setLoader((s) => ({ ...s, open: false }));
    stopRouteLoader();
  }
  function goNext() {
    const dest = nextPath || "/dashboard";
    holdNav.current = true;
    showLoader("Opening workspace...", "Your dashboard is being prepared", dest);
    router.replace(dest);
    router.refresh();
  }
  function clearAnimTimers() {
    animTimers.current.forEach((id) => window.clearTimeout(id));
    animTimers.current = [];
  }

  function persistRemember(on: boolean, savedIdentifier?: string) {
    try {
      localStorage.setItem("pow3folio_remember", on ? "1" : "0");
      if (on && savedIdentifier) localStorage.setItem("pow3folio_remember_id", savedIdentifier);
      if (!on) localStorage.removeItem("pow3folio_remember_id");
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("color-theme") || localStorage.getItem("pow3folio-theme");
    const preferred = stored === "light" || stored === "dark" ? stored : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setDark(preferred === "dark");
    document.documentElement.classList.toggle("dark", preferred === "dark");
    document.documentElement.classList.toggle("light", preferred !== "dark");
    try {
      const remember = localStorage.getItem("pow3folio_remember") !== "0";
      setRememberMe(remember);
      if (remember) {
        const saved = localStorage.getItem("pow3folio_remember_id") || "";
        if (saved) setIdentifier(saved);
      }
    } catch {
      /* ignore */
    }
    startRouteLoader("Loading...", "Preparing environment");
    const t = window.setTimeout(() => {
      if (!holdNav.current) hideLoader();
    }, 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!otpOpen || resendLeft <= 0) return;
    const id = window.setInterval(() => setResendLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [otpOpen, resendLeft]);

  // Lockout countdown ticker
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutSeconds(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutSeconds(left);
      if (left <= 0) setLockoutUntil(null);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockoutUntil]);

  useEffect(() => () => clearAnimTimers(), []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    localStorage.setItem("color-theme", next);
    localStorage.setItem("pow3folio-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next !== "dark");
  }

  async function signInWithProvider(id: "google" | "x" | "github") {
    if (mode === "signup" && !accepted) return notice("Accept the Terms and Privacy Policy first");
    if (lockoutSeconds > 0) return;
    const label = id === "x" ? "X" : id === "github" ? "GitHub" : "Google";
    const dest = nextPath || "/dashboard";
    holdNav.current = true;
    showLoader(`Connecting ${label}...`, "Open the provider page and accept the connection", dest);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(dest)}`;
    if (id === "x") {
      const { error } = await startXAuth(supabase, "signIn", redirectTo);
      if (error) {
        holdNav.current = false;
        hideLoader();
        notice(error);
      }
      return;
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: id as Provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: oauthQuery(id),
      },
    });
    if (error) {
      holdNav.current = false;
      hideLoader();
      notice(error.message);
      return;
    }
    if (data?.url) {
      window.location.assign(data.url);
      return;
    }
    holdNav.current = false;
    hideLoader();
    notice("No OAuth URL returned. This provider is not configured.");
  }

  async function loginWithLinkedWallet(address: string) {
    showLoader("Verify wallet...", "Sign the Powfolio message in your wallet");
    const challengeRes = await fetch("/api/wallets/challenge");
    const challenge = await challengeRes.json().catch(() => ({}));
    if (!challengeRes.ok || !challenge.message) {
      throw new Error(challenge.error || "Could not start wallet login.");
    }
    const signature = await signWalletMessage(address, challenge.message);
    const res = await fetch("/api/auth/wallet-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature, message: challenge.message }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      throw new Error(json.error || "Wallet login failed.");
    }
    const supabase = createClient();
    const { error } = await supabase.auth.setSession({
      access_token: json.session.access_token,
      refresh_token: json.session.refresh_token,
    });
    if (error) throw error;
    persistRemember(rememberMe);
    goNext();
  }

  async function connectWallet() {
    if (lockoutSeconds > 0) return;
    showLoader("Connecting Web3 Wallet...", "Establishing secure connection");
    try {
      const address = await connectEthereumWallet();
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const check = await checkWalletAvailable(address);

      if (user) {
        if (!check.ok) {
          hideLoader();
          notice(check.error);
          return;
        }
        const { error: upErr } = await supabase.from("profiles").update({ wallet_address: address }).eq("id", user.id);
        if (upErr) {
          hideLoader();
          notice(upErr.code === "23505" || upErr.message.toLowerCase().includes("wallet") ? "This wallet is already linked to another Powfolio account." : upErr.message);
          return;
        }
        goNext();
        return;
      }

      if (!check.ok) {
        if (mode === "signup") {
          hideLoader();
          notice("This wallet is already linked to a Powfolio account. Log in with the wallet to continue.");
          return;
        }
        await loginWithLinkedWallet(address);
        return;
      }

      try { localStorage.setItem("pow3folio_pending_wallet", address); } catch { /* ignore */ }
      hideLoader();
      notice(`Wallet ${address.slice(0, 6)}…${address.slice(-4)} saved. Sign in or create an account to link it.`);
    } catch (err) {
      hideLoader();
      notice(err instanceof Error ? err.message : "Wallet connection failed");
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    showLoader("Signing in...", "Welcome back to Powfolio");
    persistRemember(rememberMe, identifier.trim());
    const res = await fetch("/api/auth/password-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password: loginPassword }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      hideLoader();
      if (json.locked || json.retryAfterSeconds) {
        const secs = Number(json.retryAfterSeconds) || 600;
        setLockoutUntil(Date.now() + secs * 1000);
        setLockoutSeconds(secs);
      }
      notice(json.error || "Invalid login credentials.");
      return;
    }
    setLockoutUntil(null);
    setLockoutSeconds(0);
    const supabase = createClient();
    const { error } = await supabase.auth.setSession({ access_token: json.session.access_token, refresh_token: json.session.refresh_token });
    if (error) { hideLoader(); notice(error.message); return; }
    if (json.userId) await attachPendingWallet(json.userId);
    goNext();
  }

  async function handleForgot() {
    const target = identifier.includes("@") ? identifier.trim() : "";
    if (!target) { notice("Enter your account email in the Email / Username field first"); return; }
    showLoader("Sending reset code...", "Check your inbox shortly");
    const res = await fetch("/api/auth/password-reset/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: target }) });
    const json = await res.json().catch(() => ({}));
    hideLoader();
    if (!res.ok || !json.ok) { notice(json.error || "Could not send reset code"); return; }
    notice("Reset code sent. Check your email.");
  }

  function resetOtpUi() {
    clearAnimTimers();
    setOrbiting(false);
    setOtpPhase("idle");
    setOtp(["", "", "", ""]);
  }

  async function sendOtp(isResend = false) {
    const emailVal = email.trim();
    if (!emailVal.includes("@")) { notice("Please enter a valid email address first"); return; }
    showLoader(isResend ? "Resending code..." : "Sending code...", "Delivering your verification email");
    const res = await fetch("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailVal }) });
    const json = await res.json().catch(() => ({}));
    hideLoader();
    if (!res.ok || !json.ok) { notice(json.error || "Could not send verification code"); return; }
    setEmailVerified(false);
    resetOtpUi();
    setResendLeft(30);
    setOtpOpen(true);
    notice("Verification code sent to your email");
    window.setTimeout(() => otpRefs.current[0]?.focus(), 200);
  }

  async function verifyOtp() {
    if (otpPhase !== "idle") return;
    const code = otp.join("");
    if (code.length < 4) { notice("Please enter 4 digits"); return; }
    setOtpPhase("orbit");
    setOrbiting(false);
    const verifyPromise = fetch("/api/auth/otp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), code }) }).then(async (res) => {
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok && Boolean(json.ok), error: String(json.error || "Incorrect code") };
    });
    const t1 = window.setTimeout(() => setOrbiting(true), 350);
    const t2 = window.setTimeout(() => {
      setOrbiting(false);
      window.setTimeout(async () => {
        const result = await verifyPromise;
        if (result.ok) {
          setOtpPhase("success");
          setEmailVerified(true);
          const t3 = window.setTimeout(() => { setOtpOpen(false); resetOtpUi(); notice("Email verified & secured"); }, 1400);
          animTimers.current.push(t3);
        } else {
          setOtpPhase("error");
          notice(result.error);
          const t4 = window.setTimeout(() => { resetOtpUi(); otpRefs.current[0]?.focus(); }, 1400);
          animTimers.current.push(t4);
        }
      }, 450);
    }, 1750);
    animTimers.current.push(t1, t2);
  }

  function handleOtpInput(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setOtp((prev) => { const next = [...prev]; next[index] = digit; return next; });
    if (digit && index < 3) otpRefs.current[index + 1]?.focus();
  }
  function handleOtpKey(index: number, key: string) {
    if (key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }
  function handleOtpPaste(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 4).split("");
    if (!digits.length) return;
    setOtp((prev) => { const next = [...prev]; digits.forEach((d, i) => { next[i] = d; }); return next; });
    otpRefs.current[Math.min(digits.length, 3)]?.focus();
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    if (!accepted) return notice("Accept the Terms and Privacy Policy to create an account.");
    if (!emailVerified) {
      notice('Email verification required! Please tap "Send Code"');
      setSendBounce(true);
      window.setTimeout(() => setSendBounce(false), 1500);
      return;
    }
    if (signupPassword !== confirmPassword) return notice("Passwords do not match");
    const uname = username.trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_]{3,30}$/.test(uname)) return notice("Username must be 3-30 characters: letters, numbers, underscore.");
    if (isReservedDeletedUsername(uname)) return notice(reservedUsernameMessage());
    const ready = await fetch("/api/auth/signup-ready", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
    if (!ready.ok) return notice("Email verification required before creating an account.");
    showLoader("Creating Powfolio...", "Setting up your web3 identity");
    const guard = await fetch("/api/auth/signup-guard", { method: "POST" });
    const guardJson = await guard.json().catch(() => ({}));
    if (guard.status === 429) { hideLoader(); return notice(guardJson.error || "Too many signups from this network. Try again later."); }
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
    if (data.session) return goNext();
    hideLoader();
    notice("Account created. Check your email if a confirmation step remains.");
    setMode("signin");
  }

  return {
    mode, setMode, toast, loader, dark, toggleTheme,
    identifier, setIdentifier, loginPassword, setLoginPassword, showLoginPw, setShowLoginPw, rememberMe, setRememberMe,
    firstName, setFirstName, lastName, setLastName, username, setUsername, email, setEmail,
    signupPassword, setSignupPassword: setSignupPasswordLive, confirmPassword, setConfirmPassword: setConfirmPasswordLive,
    showSignupPw, setShowSignupPw, showConfirmPw, setShowConfirmPw,
    accepted, setAccepted, emailVerified, sendBounce, pwState, pwAnim,
    otpOpen, otp, otpPhase, orbiting, resendLeft, otpRefs,
    lockoutSeconds, lockoutFormatted: formatLockout(lockoutSeconds),
    signInWithProvider, connectWallet, handleSignIn, handleForgot, handleSignUp, sendOtp, verifyOtp,
    handleOtpInput, handleOtpKey, handleOtpPaste, resetOtpUi, setOtpOpen,
  };
}
