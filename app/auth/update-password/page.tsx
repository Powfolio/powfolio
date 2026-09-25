"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StairsLoader from "@/components/auth/StairsLoader";
import "../../auth-ui.css";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setToast("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setToast("Passwords do not match");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setToast(error.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="pow-auth-page flex min-h-screen items-center justify-center bg-[#F8F9FA] p-4 dark:bg-darkBg">
      <StairsLoader open={loading} title="Updating password..." subtitle="Securing your account" />
      <form onSubmit={submit} className="auth-container w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Set a new password</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Choose a new password for your Powfolio account.</p>
        <div className="field-group">
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <label className="field-notch-label">New password</label>
        </div>
        <div className="field-group">
          <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          <label className="field-notch-label">Confirm password</label>
        </div>
        <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-bronze-300 via-bronze-400 to-amber-400 px-4 py-2.5 text-sm font-semibold text-black">
          Update password
        </button>
        {toast && <p className="text-sm text-rose-500">{toast}</p>}
      </form>
    </div>
  );
}
