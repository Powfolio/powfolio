"use client";

import Link from "next/link";
import AuthOtpModal from "@/components/auth/AuthOtpModal";
import { EyeButton, SocialRow, ThemeToggle } from "@/components/auth/auth-icons";
import { useAuthExperience, type AuthMode } from "@/components/auth/use-auth-experience";
import BrandMark from "@/components/ui/BrandMark";

const primaryBtn =
  "w-full rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-pressed active:scale-[0.99]";
const overlayBtn = "overlay-btn-soft";

export default function AuthExperience({
  initialMode,
  nextPath = "/dashboard",
}: {
  initialMode: AuthMode;
  nextPath?: string;
}) {
  const a = useAuthExperience(initialMode, nextPath);
  const confirmClass = ["pr-7 text-xs confirm-pw-field", a.pwState, a.pwAnim % 2 === 0 ? "pw-replay-even" : "pw-replay-odd"].filter(Boolean).join(" ");
  return (
    <div className="pow-auth-page relative flex min-h-screen flex-col items-center justify-between bg-[#FDFCFA] p-4 text-[#171614] dark:bg-darkBg dark:text-[#F2F0EC] sm:p-8">
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <header className="z-10 flex w-full max-w-5xl items-center justify-between py-2">
        <BrandMark compact href="/" />
        <ThemeToggle dark={a.dark} onClick={a.toggleTheme} />
      </header>
      <main className="z-10 my-auto flex w-full items-center justify-center py-2">
        <div className={a.mode === "signup" ? "auth-container right-panel-active" : "auth-container"}>
          <div className="form-panel sign-in-panel">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-4 text-left">
                <h2 className="text-2xl font-semibold tracking-tight text-[#171614] dark:text-[#F2F0EC] sm:text-3xl">Welcome back</h2>
                <p className="mt-1 text-xs text-[#6B675F] dark:text-[#9C9890] sm:text-sm">Log in to manage your Powfolio.</p>
              </div>
              <SocialRow
                onGoogle={() => a.signInWithProvider("google")}
                onX={() => a.signInWithProvider("x")}
                onGithub={() => a.signInWithProvider("github")}
                onWallet={a.connectWallet}
                titles={{ google: "Sign in with Google", x: "Sign in with X", github: "Sign in with GitHub", wallet: "Connect Web3 Wallet" }}
              />
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-full border-t border-[#E2DED5] dark:border-[#2C2B27]" />
                <span className="absolute bg-white px-3 text-[10px] font-semibold uppercase tracking-wider text-[#8C877C] dark:bg-[#171715] dark:text-[#6B675F]">or email</span>
              </div>
              <form onSubmit={a.handleSignIn} className="space-y-3">
                <div className="field-group">
                  <input type="text" required autoComplete="username" value={a.identifier} onChange={(e) => a.setIdentifier(e.target.value)} />
                  <label className="field-notch-label">Email / Username</label>
                </div>
                <div className="field-group relative">
                  <input type={a.showLoginPw ? "text" : "password"} required autoComplete="current-password" className="pr-10" value={a.loginPassword} onChange={(e) => a.setLoginPassword(e.target.value)} />
                  <label className="field-notch-label">Password</label>
                  <EyeButton hidden={!a.showLoginPw} onClick={() => a.setShowLoginPw((v) => !v)} />
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center">
                    <input id="rememberMe" type="checkbox" checked={a.rememberMe} onChange={(e) => a.setRememberMe(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer rounded accent-[#B8863B]" />
                    <label htmlFor="rememberMe" className="ml-2 cursor-pointer text-xs text-[#6B675F] dark:text-[#9C9890]">Remember me</label>
                  </div>
                  <button type="button" onClick={a.handleForgot} className="text-xs text-[#9C6F2C] hover:underline">Forgot password?</button>
                </div>
                <button type="submit" className={primaryBtn + " text-sm"}>
                  Sign In
                </button>
              </form>
              <p className="auth-switch">
                New here? <button type="button" onClick={() => a.setMode("signup")}>Create an account</button>
              </p>
            </div>
          </div>
          <div className="form-panel sign-up-panel">
            <div className="mx-auto w-full max-w-sm sm:max-w-md">
              <div className="mb-2 text-left">
                <h2 className="text-xl font-semibold tracking-tight text-[#171614] dark:text-[#F2F0EC] sm:text-2xl">Create account</h2>
                <p className="text-[11px] text-[#6B675F] dark:text-[#9C9890] sm:text-xs">One public link for the work you can prove.</p>
              </div>
              <SocialRow
                compact
                onGoogle={() => a.signInWithProvider("google")}
                onX={() => a.signInWithProvider("x")}
                onGithub={() => a.signInWithProvider("github")}
                onWallet={a.connectWallet}
                titles={{ google: "Sign up with Google", x: "Sign up with X", github: "Sign up with GitHub", wallet: "Connect Web3 Wallet" }}
              />
              <form onSubmit={a.handleSignUp} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="field-group">
                    <input type="text" required autoComplete="given-name" value={a.firstName} onChange={(e) => a.setFirstName(e.target.value)} />
                    <label className="field-notch-label">First Name</label>
                  </div>
                  <div className="field-group">
                    <input type="text" required autoComplete="family-name" value={a.lastName} onChange={(e) => a.setLastName(e.target.value)} />
                    <label className="field-notch-label">Last Name</label>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="field-group">
                    <input type="text" required autoComplete="username" value={a.username} onChange={(e) => a.setUsername(e.target.value)} />
                    <label className="field-notch-label">Username</label>
                  </div>
                  <div className="field-group relative">
                    <input type="email" required autoComplete="email" className={a.emailVerified ? "pr-20 email-verified-border" : "pr-20"} value={a.email} onChange={(e) => a.setEmail(e.target.value)} />
                    <label className="field-notch-label">Email Address</label>
                    <div className="absolute right-2.5 top-2.5 z-20 flex items-center">
                      {a.emailVerified ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#4C9A6A]">Verified</span>
                      ) : (
                        <button type="button" onClick={() => a.sendOtp(false)} className={a.sendBounce ? "text-[11px] font-semibold text-[#9C6F2C] hover:underline animate-bounce" : "text-[11px] font-semibold text-[#9C6F2C] hover:underline"}>
                          Send Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="field-group relative">
                    <input type={a.showSignupPw ? "text" : "password"} required autoComplete="new-password" className="pr-7 text-xs" value={a.signupPassword} onChange={(e) => a.setSignupPassword(e.target.value)} />
                    <label className="field-notch-label">Password</label>
                    <EyeButton compact hidden={!a.showSignupPw} onClick={() => a.setShowSignupPw((v) => !v)} />
                  </div>
                  <div className="field-group relative">
                    <input type={a.showConfirmPw ? "text" : "password"} required autoComplete="new-password" className={confirmClass} value={a.confirmPassword} onChange={(e) => a.setConfirmPassword(e.target.value)} />
                    <label className="field-notch-label">Confirm</label>
                    <EyeButton compact hidden={!a.showConfirmPw} onClick={() => a.setShowConfirmPw((v) => !v)} />
                  </div>
                </div>
                <div className="flex items-start pt-1">
                  <input id="agreeTerms" type="checkbox" checked={a.accepted} onChange={(e) => a.setAccepted(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 cursor-pointer rounded accent-[#B8863B]" />
                  <label htmlFor="agreeTerms" className="ml-2 cursor-pointer text-[11px] leading-tight text-[#6B675F] dark:text-[#9C9890]">
                    I accept the <Link href="/terms" className="text-[#9C6F2C] underline">Terms</Link> and <Link href="/privacy" className="text-[#9C6F2C] underline">Privacy Policy</Link>
                  </label>
                </div>
                <button type="submit" className={primaryBtn + " mt-1 text-xs sm:text-sm"}>
                  Create Account
                </button>
              </form>
              <p className="auth-switch">
                Already have an account? <button type="button" onClick={() => a.setMode("signin")}>Sign in</button>
              </p>
            </div>
          </div>
          <div className="overlay-wrapper">
            <div className="overlay-content">
              <div className="overlay-box overlay-left-box">
                <h3 className="mb-1 text-xl font-semibold tracking-tight text-white sm:mb-2 sm:text-3xl">Already here?</h3>
                <p className="mb-4 max-w-xs text-xs font-normal leading-relaxed text-white/70 sm:mb-6 sm:text-sm">Sign in to keep building the public record of your work.</p>
                <button type="button" onClick={() => a.setMode("signin")} className={overlayBtn}>Sign In</button>
              </div>
              <div className="overlay-box overlay-right-box">
                <h3 className="mb-1 text-xl font-semibold tracking-tight text-white sm:mb-2 sm:text-3xl">New here?</h3>
                <p className="mb-4 max-w-xs text-xs font-normal leading-relaxed text-white/70 sm:mb-6 sm:text-sm">Create a profile, add proof, and share one link.</p>
                <button type="button" onClick={() => a.setMode("signup")} className={overlayBtn}>Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="z-10 flex w-full max-w-5xl flex-col items-center justify-between py-3 text-xs text-[#8C877C] dark:text-[#6B675F] sm:flex-row">
        <p>2026 Powfolio</p>
        <div className="mt-1 flex space-x-5 sm:mt-0">
          <a href="mailto:dev@powfolio.app" className="hover:underline">Support</a>
        </div>
      </footer>
      {a.otpOpen ? (
        <AuthOtpModal
          dark={a.dark}
          otp={a.otp}
          otpPhase={a.otpPhase}
          orbiting={a.orbiting}
          resendLeft={a.resendLeft}
          otpRefs={a.otpRefs}
          onClose={() => {
            a.setOtpOpen(false);
            a.resetOtpUi();
          }}
          onChange={a.handleOtpInput}
          onKey={a.handleOtpKey}
          onPaste={a.handleOtpPaste}
          onVerify={a.verifyOtp}
          onResend={() => a.sendOtp(true)}
        />
      ) : null}
      {a.toast ? (
        <div className="fixed bottom-5 right-5 z-[350] flex items-center space-x-2 rounded-xl border border-[#2C2B27] bg-[#201F1C]/95 px-4 py-2.5 text-xs text-[#F2F0EC] shadow-xl backdrop-blur-md">
          <span>{a.toast}</span>
        </div>
      ) : null}
    </div>
  );
}
