import type { ReactNode } from "react";

export function GoogleIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export function XIcon({ className }: { className: string }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function GithubIcon({ className }: { className: string }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function WalletIcon({ className }: { className: string }) {
  return (
    <svg className={`${className} text-slate-800 dark:text-white stroke-current`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="15" rx="3.5" strokeWidth="1.8" />
      <path d="M2 9.5H22" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 14H19.5" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17.5" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function EyeButton({ hidden, onClick, compact }: { hidden: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label="Toggle password visibility"
      className={`z-20 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-zinc-200 ${compact ? "absolute right-2 top-3 p-0.5" : "absolute right-3 top-3.5 p-1"} ${hidden ? "eye-hidden" : ""}`}
    >
      <svg className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path className="eye-pupil" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <line className="eye-slash-line" x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export const socialBtn = "flex items-center justify-center transition-opacity hover:opacity-70 text-slate-800 dark:text-white";

export function SocialRow({ compact, onGoogle, onX, onGithub, onWallet, titles, showDivider }: { compact?: boolean; onGoogle: () => void; onX: () => void; onGithub: () => void; onWallet: () => void; titles: { google: string; x: string; github: string; wallet: string }; showDivider?: boolean }) {
  const size = compact ? "h-5 w-5" : "h-6 w-6";
  return (
    <div className={compact ? "mb-2" : "mb-3"}>
      <div className="flex items-center justify-center gap-6">
        <button type="button" className={socialBtn} title={titles.google} onClick={onGoogle}><GoogleIcon className={size} /></button>
        <button type="button" className={socialBtn} title={titles.x} onClick={onX}><XIcon className={size} /></button>
        <button type="button" className={socialBtn} title={titles.github} onClick={onGithub}><GithubIcon className={size} /></button>
        <button type="button" className={socialBtn} title={titles.wallet} onClick={onWallet}><WalletIcon className={size} /></button>
      </div>
      {showDivider ? (
        <div className="mt-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-current opacity-10" />
          <span className="text-[10px] uppercase tracking-wider opacity-40">or</span>
          <div className="h-px flex-1 bg-current opacity-10" />
        </div>
      ) : null}
    </div>
  );
}

export function ThemeToggle({ dark, onClick }: { dark: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label="Toggle dark mode" onClick={onClick} className="rounded-full bg-white/80 p-2.5 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:bg-slate-100 hover:text-bronze-500 dark:bg-darkSurface/80 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-bronze-300">
      <svg className={`h-5 w-5 text-bronze-300 ${dark ? "block" : "hidden"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg className={`h-5 w-5 text-zinc-700 ${dark ? "hidden" : "block"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  );
}
