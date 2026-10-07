"use client";

import { useState } from "react";
import Link from "next/link";

const THEMES = [
  { id: "editorial", label: "Editorial" },
  { id: "classic", label: "Classic" },
  { id: "bronze", label: "Bronze" },
  { id: "swiss", label: "Swiss" },
  { id: "ink", label: "Ink" },
];

export default function ResumeStudio({ username, children }: { username: string; children: React.ReactNode }) {
  const [theme, setTheme] = useState("editorial");

  return (
    <div className="resume-page min-h-screen" data-theme={theme}>
      <style>{`
        .resume-page { background: #e8ece8; color: #12201a; }
        .resume-page[data-theme="ink"] { background: #1c1c1c; }
        .resume-sheet { position: relative; background: #fff; color: #12201a; }
        .resume-mark {
          position: absolute; left: 50%; top: 50%; z-index: 0; pointer-events: none;
          transform: translate(-50%, -50%) rotate(-24deg);
          font-size: clamp(34px, 8vw, 78px); font-weight: 800; letter-spacing: 0.12em;
          color: rgba(184, 134, 59, 0.28); white-space: nowrap;
        }
        .resume-inner { position: relative; z-index: 1; }
        .resume-link { color: var(--cv-link); text-decoration: underline; text-underline-offset: 2px; }
        .resume-kicker, .resume-h2, .resume-role { color: var(--cv-accent); }
        .resume-rule { height: 1px; background: var(--cv-rule); }
        .resume-bar { height: 6px; background: var(--cv-bar); }
        .resume-chip { border: 1px solid var(--cv-chip); color: var(--cv-accent); background: #fff; }
        .resume-side { background: var(--cv-side); border-radius: 12px; padding: 14px; }
        .resume-page { --cv-accent: #0f766e; --cv-link: #9a6b24; --cv-rule: #d1fae5; --cv-bar: linear-gradient(90deg,#059669,#5eead4); --cv-chip: #a7f3d0; --cv-side: #f4faf6; }
        .resume-page[data-theme="classic"] { --cv-accent: #111; --cv-link: #1d4ed8; --cv-rule: #111; --cv-bar: #111; --cv-chip: #d4d4d8; --cv-side: transparent; }
        .resume-page[data-theme="classic"] .resume-grid { display: block; }
        .resume-page[data-theme="classic"] .resume-name { font-family: Georgia, "Times New Roman", serif; }
        .resume-page[data-theme="bronze"] { --cv-accent: #8a5a16; --cv-link: #8a5a16; --cv-rule: #ead7b8; --cv-bar: #b8863b; --cv-chip: #ead7b8; --cv-side: #fbf6ee; }
        .resume-page[data-theme="swiss"] { --cv-accent: #111; --cv-link: #111; --cv-rule: #111; --cv-bar: #111; --cv-chip: transparent; --cv-side: transparent; }
        .resume-page[data-theme="swiss"] .resume-chip { border-radius: 0; }
        .resume-page[data-theme="ink"] { --cv-accent: #f4f4f3; --cv-link: #d7b06a; --cv-rule: #3a3a3a; --cv-bar: #d7b06a; --cv-chip: #3a3a3a; --cv-side: #171717; }
        .resume-page[data-theme="ink"] .resume-sheet { background: #111; color: #f4f4f3; }
        .resume-page[data-theme="ink"] .resume-muted { color: #b8b8b8; }
        .resume-lead-block { width: 100%; }
        @media (max-width: 700px) {
          .resume-lead-block { text-align: center; }
        }
        .resume-summary { text-align: left; }
        .cv-download { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; white-space: nowrap; border: 0; background: transparent; color: inherit; font-size: 13px; font-weight: 650; text-decoration: underline; text-underline-offset: 3px; }
        .theme-pick { border: 0; background: transparent; color: #5c6570; font-size: 12px; padding: 0; cursor: pointer; }
        .theme-pick.on { color: #12201a; text-decoration: underline; text-underline-offset: 3px; }
        @media print {
          .no-print { display: none !important; }
          html, body, .resume-page { background: white !important; }
          .resume-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .resume-mark { position: fixed; color: rgba(184, 134, 59, 0.22); }
          .resume-inner, .resume-inner p, .resume-inner h1, .resume-inner h2, .resume-inner li { position: relative; z-index: 1; }
          a { color: var(--cv-link) !important; }
        }
        @page { margin: 12mm; size: A4; }
      `}</style>
      <div className="no-print mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/dashboard" className="text-sm text-zinc-500">Back to dashboard</Link>
        <div className="flex flex-wrap items-center gap-3">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={`theme-pick ${theme === t.id ? "on" : ""}`} onClick={() => setTheme(t.id)}>
              {t.label}
            </button>
          ))}
          <button
            type="button"
            className="cv-download"
            onClick={() => {
              document.title = `${username} PowFolio`;
              window.print();
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12 4v10" />
              <path d="m8 10 4 4 4-4" />
              <path d="M5 19h14" />
            </svg>
            Download
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
