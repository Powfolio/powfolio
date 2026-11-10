"use client";

import type { MutableRefObject } from "react";

type OtpPhase = "idle" | "orbit" | "success" | "error";

export default function AuthOtpModal({
  dark, otp, otpPhase, orbiting, resendLeft, otpRefs, onClose, onChange, onKey, onPaste, onVerify, onResend,
}: {
  dark: boolean;
  otp: string[];
  otpPhase: OtpPhase;
  orbiting: boolean;
  resendLeft: number;
  otpRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  onClose: () => void;
  onChange: (index: number, raw: string) => void;
  onKey: (index: number, key: string) => void;
  onPaste: (text: string) => void;
  onVerify: () => void;
  onResend: () => void;
}) {
  const verifying = otpPhase === "orbit";
  const resendLabel = resendLeft > 0 ? `Resend in 00:${resendLeft < 10 ? "0" : ""}${resendLeft}` : null;
  const showResult = otpPhase === "success" || otpPhase === "error";

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-2xl transition-all duration-300">
      <div className={`glassy-otp-panel relative mx-4 w-full max-w-md select-none p-6 text-center sm:p-8 ${dark ? "" : "light-otp"}`}>
        <div className="glass-corner-tl" />
        <div className="glass-corner-br" />
        <button type="button" aria-label="Close modal" onClick={onClose} className="absolute right-4 top-4 z-30 rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="mb-3 flex justify-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg transition-all duration-400 ${otpPhase === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/20" : otpPhase === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-rose-500/20" : "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-amber-500/10"}`}>
            {otpPhase === "success" ? (
              <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            ) : otpPhase === "error" ? (
              <svg className="h-6 w-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            )}
          </div>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Verify <span className="text-amber-400">OTP</span></h2>
        <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-400">{otpPhase === "success" ? "Your security verification code has been confirmed." : otpPhase === "error" ? "Incorrect code. Please try again." : "Enter the 4-digit security code sent to your email"}</p>

        <div className="relative my-6 flex h-44 items-center justify-center">
          {otpPhase === "success" ? (
            <div className="pointer-events-none absolute flex h-52 w-52 items-center justify-center">
              <div className="pulse-ring-1 absolute h-36 w-36 rounded-full border border-emerald-500/50" />
              <div className="pulse-ring-2 absolute h-48 w-48 rounded-full border border-emerald-500/30" />
            </div>
          ) : null}

          <div className={`otp-orbit-stage ${orbiting || otpPhase === "orbit" ? "is-orbiting" : ""} ${showResult ? "is-done" : ""}`}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="otp-orbit-arm" style={{ ["--delay" as string]: `${(3 - i) * 0.1}s`, ["--start" as string]: `${(3 - i) * 50}deg` }}>
                <input
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  readOnly={otpPhase !== "idle"}
                  value={otpPhase === "idle" ? otp[i] : ""}
                  onChange={(e) => onChange(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e.key)}
                  onPaste={(e) => { e.preventDefault(); onPaste(e.clipboardData.getData("text")); }}
                  className="otp-squircle"
                  aria-label={`Digit ${i + 1}`}
                />
              </div>
            ))}
          </div>

          {showResult ? (
            <div className={`absolute left-1/2 top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border-2 shadow-xl ${otpPhase === "success" ? "border-emerald-500 bg-[#0e1713] shadow-emerald-500/25" : "shake-error border-rose-500 bg-[#1d1013] shadow-rose-500/25"}`}>
              {otpPhase === "success" ? (
                <svg className="h-8 w-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path className="drawn-check-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-8 w-8 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path className="drawn-x-path-1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6" /><path className="drawn-x-path-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 6l12 12" /></svg>
              )}
            </div>
          ) : null}
        </div>

        <p className="mb-5 text-xs text-zinc-400">Didn't receive the code? {resendLabel ? <span className="font-semibold text-amber-400">{resendLabel}</span> : <button type="button" className="font-semibold text-amber-400 underline hover:text-amber-300" onClick={onResend}>Resend Code</button>}</p>
        <button type="button" disabled={verifying || otpPhase === "success"} onClick={onVerify} className={otpPhase === "success" ? "flex w-full items-center justify-center rounded-2xl bg-[#20B268] px-5 py-2.5 text-[15px] font-bold tracking-wide text-white shadow-[0_8px_20px_rgba(32,178,104,0.25)]" : otpPhase === "error" ? "flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-bold tracking-wide text-white" : "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-bronze-400 to-amber-500 px-5 py-3 text-sm font-bold tracking-wide text-black shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-[0.98]"}>
          {verifying ? (<><svg className="h-4 w-4 animate-spin text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg><span>Verifying Code...</span></>) : otpPhase === "success" ? (<span className="flex flex-col items-center justify-center gap-0.5"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg><span>Verified & Secured</span></span>) : otpPhase === "error" ? "Retry Code" : "Verify OTP"}
        </button>
      </div>
    </div>
  );
}
