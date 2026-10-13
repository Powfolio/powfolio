"use client";

import { useState } from "react";
import Link from "next/link";

const THEMES = [
  { id: "editorial", label: "Editorial" },
  { id: "classic", label: "Classic" },
];

export default function ResumeStudio({ username, children }: { username: string; children: React.ReactNode }) {
  const [theme, setTheme] = useState("editorial");

  return (
    <div className="resume-page min-h-screen" data-theme={theme}>
      <style>{`
        .resume-page { background: #e8ece8; color: #12201a; --cv-accent: #0f766e; --cv-link: #9a6b24; --cv-rule: #d1fae5; --cv-bar: linear-gradient(90deg,#059669,#5eead4); --cv-chip: #a7f3d0; --cv-side: #f4faf6; }
        .resume-sheet { position: relative; background: #fff; color: #12201a; }
        .resume-mark {
          position: absolute; z-index: 0; pointer-events: none; width: 70%;
          font-size: clamp(34px, 8vw, 78px); font-weight: 800; letter-spacing: 0.12em;
          color: rgba(184, 134, 59, 0.55); white-space: nowrap;
        }
        .resume-inner { position: relative; z-index: 1; }
        .resume-link { color: var(--cv-link); text-decoration: underline; text-underline-offset: 2px; }
        .resume-kicker, .resume-h2, .resume-role { color: var(--cv-accent); }
        .resume-rule { height: 1px; background: var(--cv-rule); }
        .resume-bar { height: 6px; background: var(--cv-bar); }
        .resume-chip { border: 1px solid var(--cv-chip); color: var(--cv-accent); background: #fff; }
        .resume-side { background: var(--cv-side); border-radius: 12px; padding: 0; }
        .resume-lead-block { width: 100%; text-align: justify; text-align-last: left; }
        .resume-summary { text-align: left; }
        .cv-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; max-width: 860px; margin: 0 auto; padding: 8px 16px 6px; }
        .cv-tools { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .cv-download { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; white-space: nowrap; border: 0; background: transparent; color: #12201a; font-size: 13px; font-weight: 650; text-decoration: underline; text-underline-offset: 3px; }
        .theme-pick { border: 0; background: transparent; color: #5c6570; font-size: 12px; padding: 0; cursor: pointer; white-space: nowrap; }
        .theme-pick.on { color: #12201a; text-decoration: underline; text-underline-offset: 3px; }
        .resume-page[data-theme="classic"] { --cv-accent: #1a1a1a; --cv-link: #1d4ed8; --cv-rule: #1a1a1a; --cv-bar: #1a1a1a; --cv-chip: #d4d4d8; --cv-side: transparent; }
        .resume-page[data-theme="classic"] .resume-grid { display: block; }
        .resume-page[data-theme="classic"] .resume-name { font-family: Georgia, "Times New Roman", serif; font-weight: 700; letter-spacing: -0.03em; }
        .resume-page[data-theme="classic"] .resume-kicker { letter-spacing: 0.28em; color: #6b7280; }
        .resume-page[data-theme="classic"] .resume-h2 { letter-spacing: 0.16em; border-bottom: 1px solid #1a1a1a; padding-bottom: 4px; }
        .resume-page[data-theme="classic"] .resume-rule { display: none; }
        .resume-page[data-theme="classic"] .resume-side { padding: 0; }
        .resume-page[data-theme="classic"] .resume-chip { border-radius: 0; background: transparent; color: #1a1a1a; }
        .resume-page[data-theme="classic"] .resume-bar { height: 2px; }
        @media print {
          .no-print { display: none !important; }
          html, body, .resume-page { background: white !important; }
          .resume-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .resume-mark { position: fixed; }
          .resume-inner, .resume-inner p, .resume-inner h1, .resume-inner h2, .resume-inner li { position: relative; z-index: 1; }
          a { color: var(--cv-link) !important; }
        }
        @page { margin: 12mm; size: A4; }
      `}</style>
      <div className="no-print cv-toolbar">
        <Link href="/dashboard" className="text-sm text-zinc-500 whitespace-nowrap">Back</Link>
        <div className="cv-tools">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={`theme-pick ${theme === t.id ? "on" : ""}`} onClick={() => setTheme(t.id)}>{t.label}</button>
          ))}
          <button type="button" className="cv-download" onClick={() => { document.title = `${username} PowFolio`; window.print(); }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12 4v10" /><path d="m8 10 4 4 4-4" /><path d="M5 19h14" />
            </svg>
            Download
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
