"use client";

import { useState } from "react";
import Link from "next/link";

const THEMES = [
  { id: "editorial", label: "Editorial" },
  { id: "classic", label: "Classic" },
  { id: "sidebar", label: "Sidebar" },
  { id: "ledger", label: "Ledger" },
];

export default function ResumeStudio({ username, children }: { username: string; children: React.ReactNode }) {
  const [theme, setTheme] = useState("editorial");

  return (
    <div className="resume-page min-h-screen" data-theme={theme}>
      <style>{`
        html:has(.resume-page), body:has(.resume-page) { overflow-x: hidden !important; background: #e8ece8; }
        .resume-page { background: #e8ece8; color: #12201a; overflow-x: hidden; width: 100%; max-width: 100vw; --cv-accent: #0f766e; --cv-link: #9a6b24; --cv-rule: #d1fae5; --cv-bar: linear-gradient(90deg,#059669,#5eead4); --cv-chip: #a7f3d0; --cv-side: transparent; }
        .resume-sheet { position: relative; background: #fff; color: #12201a; overflow: hidden; }
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
        .resume-chip { border: 1px solid var(--cv-chip); color: var(--cv-accent); background: transparent; }
        .resume-side { background: transparent; border-radius: 0; padding: 0; }
        .resume-lead-block { width: 100%; text-align: justify; text-align-last: left; }
        .resume-summary { text-align: left; }
        .cv-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; max-width: 860px; width: 100%; margin: 0 auto; padding: 8px 16px 6px; box-sizing: border-box; }
        .cv-tools { display: flex; align-items: center; justify-content: flex-end; gap: 12px 14px; flex-wrap: wrap; min-width: 0; }
        .cv-download { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; white-space: nowrap; border: 0; background: transparent; color: #12201a; font-size: 13px; font-weight: 650; text-decoration: underline; text-underline-offset: 3px; }
        .theme-pick { border: 0; background: transparent; color: #5c6570; font-size: 12px; padding: 0; cursor: pointer; white-space: nowrap; }
        .theme-pick.on { color: #12201a; text-decoration: underline; text-underline-offset: 3px; }
        .resume-page .resume-aside { margin-top: 1.5rem; }
        @media (min-width: 640px) {
          .resume-page:not([data-theme="classic"]):not([data-theme="sidebar"]):not([data-theme="ledger"]) .resume-inner {
            display: grid;
            grid-template-columns: minmax(0, 1.55fr) minmax(0, 0.85fr);
            column-gap: 2rem;
            row-gap: 1.5rem;
          }
          .resume-page:not([data-theme="classic"]):not([data-theme="sidebar"]):not([data-theme="ledger"]) .resume-head,
          .resume-page:not([data-theme="classic"]):not([data-theme="sidebar"]):not([data-theme="ledger"]) .resume-extras,
          .resume-page:not([data-theme="classic"]):not([data-theme="sidebar"]):not([data-theme="ledger"]) .resume-contact { grid-column: 1 / -1; }
          .resume-page:not([data-theme="classic"]):not([data-theme="sidebar"]):not([data-theme="ledger"]) .resume-aside { margin-top: 0; }
        }
        .resume-page[data-theme="classic"] { --cv-accent: #1a1a1a; --cv-link: #1d4ed8; --cv-rule: #1a1a1a; --cv-bar: #1a1a1a; --cv-chip: #d4d4d8; --cv-side: transparent; }
        .resume-page[data-theme="classic"] .resume-inner { display: block !important; }
        .resume-page[data-theme="classic"] .resume-aside { margin-top: 1.5rem; }
        .resume-page[data-theme="classic"] .resume-name { font-family: Georgia, "Times New Roman", serif; font-weight: 700; letter-spacing: -0.03em; }
        .resume-page[data-theme="classic"] .resume-kicker { letter-spacing: 0.28em; color: #6b7280; }
        .resume-page[data-theme="classic"] .resume-h2 { letter-spacing: 0.16em; border-bottom: 1px solid #1a1a1a; padding-bottom: 4px; }
        .resume-page[data-theme="classic"] .resume-rule { display: none; }
        .resume-page[data-theme="classic"] .resume-side { padding: 0; }
        .resume-page[data-theme="classic"] .resume-chip { border-radius: 0; background: transparent; color: #1a1a1a; }
        .resume-page[data-theme="classic"] .resume-bar { height: 2px; }
        .resume-page[data-theme="sidebar"] { --cv-accent: #9a6b24; --cv-link: #9a6b24; --cv-rule: rgba(154, 107, 36, 0.35); --cv-chip: rgba(243, 215, 161, 0.45); background: #d9e2dc; }
        .resume-page[data-theme="sidebar"] .resume-sheet { background: #f7f4ee; }
        .resume-page[data-theme="sidebar"] .resume-bar { display: none; }
        .resume-page[data-theme="sidebar"] .resume-mark { left: auto !important; right: 6%; width: auto; max-width: 48%; overflow: hidden; }
        .resume-page[data-theme="sidebar"] .resume-inner {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0 !important;
        }
        .resume-page[data-theme="sidebar"] .resume-head { order: 1; }
        .resume-page[data-theme="sidebar"] .resume-aside { order: 2; }
        .resume-page[data-theme="sidebar"] .resume-main { order: 3; }
        .resume-page[data-theme="sidebar"] .resume-extras { order: 4; }
        .resume-page[data-theme="sidebar"] .resume-contact { order: 5; }
        .resume-page[data-theme="sidebar"] .resume-aside {
          margin-top: 0;
          background: #10211b;
          color: #f4efe4;
          padding: 22px 18px 28px;
        }
        .resume-page[data-theme="sidebar"] .resume-aside .resume-h2,
        .resume-page[data-theme="sidebar"] .resume-aside h2 { color: #e7c27a !important; }
        .resume-page[data-theme="sidebar"] .resume-aside .resume-muted,
        .resume-page[data-theme="sidebar"] .resume-aside p,
        .resume-page[data-theme="sidebar"] .resume-aside li,
        .resume-page[data-theme="sidebar"] .resume-aside span,
        .resume-page[data-theme="sidebar"] .resume-aside .text-zinc-500,
        .resume-page[data-theme="sidebar"] .resume-aside .text-zinc-600,
        .resume-page[data-theme="sidebar"] .resume-aside .text-zinc-700 { color: #e7e2d6 !important; }
        .resume-page[data-theme="sidebar"] .resume-aside .resume-link,
        .resume-page[data-theme="sidebar"] .resume-aside a { color: #f3d7a1 !important; }
        .resume-page[data-theme="sidebar"] .resume-aside .resume-chip {
          color: #f6f1e6 !important;
          background: transparent;
          border-color: rgba(243, 215, 161, 0.55) !important;
          border-radius: 999px;
        }
        .resume-page[data-theme="sidebar"] .resume-head,
        .resume-page[data-theme="sidebar"] .resume-main { padding: 20px 18px 0; }
        .resume-page[data-theme="sidebar"] .resume-extras,
        .resume-page[data-theme="sidebar"] .resume-contact { padding: 0 18px 20px; }
        .resume-page[data-theme="sidebar"] .resume-head { padding-top: 22px; }
        .resume-page[data-theme="sidebar"] .resume-name { font-size: clamp(26px, 7vw, 34px); overflow-wrap: anywhere; }
        @media (min-width: 720px) {
          .resume-page[data-theme="sidebar"] .resume-inner {
            display: grid !important;
            grid-template-columns: 232px minmax(0, 1fr);
            column-gap: 0;
            row-gap: 0;
            align-items: stretch;
          }
          .resume-page[data-theme="sidebar"] .resume-aside { grid-column: 1; grid-row: 1 / span 4; align-self: stretch; min-height: 100%; padding: 32px 20px; }
          .resume-page[data-theme="sidebar"] .resume-head { grid-column: 2; grid-row: 1; order: 0; padding: 28px 32px 0; }
          .resume-page[data-theme="sidebar"] .resume-main { grid-column: 2; grid-row: 2; order: 0; padding: 18px 32px 0; }
          .resume-page[data-theme="sidebar"] .resume-extras { grid-column: 2; grid-row: 3; order: 0; padding: 0 32px; }
          .resume-page[data-theme="sidebar"] .resume-contact { grid-column: 2; grid-row: 4; order: 0; padding: 0 32px 28px; }
        }
        .resume-page[data-theme="ledger"] { --cv-accent: #1c1917; --cv-link: #9a3412; --cv-rule: #b8863b; --cv-bar: #1c1917; --cv-chip: #1c1917; background: #eceae4; }
        .resume-page[data-theme="ledger"] .resume-sheet { background: #fbfaf7; }
        .resume-page[data-theme="ledger"] .resume-bar { display: none; }
        .resume-page[data-theme="ledger"] .resume-inner { display: flex !important; flex-direction: column; gap: 0; padding: 0 !important; }
        .resume-page[data-theme="ledger"] .resume-head { order: 1; background: #161616; color: #fff; padding: 22px 18px 12px; }
        .resume-page[data-theme="ledger"] .resume-head .flex { align-items: center; }
        .resume-page[data-theme="ledger"] .resume-avatar { margin-top: 0 !important; }
        .resume-page[data-theme="ledger"] .resume-avatar p { max-width: 132px; overflow-wrap: anywhere; text-align: right; }
        .resume-page[data-theme="ledger"] .resume-name { color: #fff; font-family: Georgia, "Times New Roman", serif; letter-spacing: -0.03em; font-size: clamp(26px, 6vw, 34px) !important; overflow-wrap: anywhere; }
        .resume-page[data-theme="ledger"] .resume-kicker { color: #e0b15a; letter-spacing: 0.24em; }
        .resume-page[data-theme="ledger"] .resume-role { color: #f3efe6; }
        .resume-page[data-theme="ledger"] .resume-head .resume-muted,
        .resume-page[data-theme="ledger"] .resume-head .text-zinc-500,
        .resume-page[data-theme="ledger"] .resume-head .text-zinc-600,
        .resume-page[data-theme="ledger"] .resume-avatar p { color: #cfc6b8 !important; }
        .resume-page[data-theme="ledger"] .resume-contact { order: 2; background: #161616; color: #f6f1e6; margin: 0 !important; border: 0 !important; padding: 0 18px 16px !important; }
        .resume-page[data-theme="ledger"] .resume-contact .resume-h2 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
        .resume-page[data-theme="ledger"] .resume-contact .resume-link,
        .resume-page[data-theme="ledger"] .resume-contact a { color: #f3d7a1 !important; }
        .resume-page[data-theme="ledger"] .resume-main { order: 3; padding: 18px 18px 4px; }
        .resume-page[data-theme="ledger"] .resume-aside { order: 4; margin-top: 0; padding: 8px 18px 4px; }
        .resume-page[data-theme="ledger"] .resume-extras { order: 5; padding: 0 18px 22px; }
        .resume-page[data-theme="ledger"] .resume-chip { border-radius: 2px; background: transparent; color: #1c1917; border-color: #1c1917; }
        .resume-page[data-theme="ledger"] .resume-h2 { letter-spacing: 0.2em; }
        .resume-page[data-theme="ledger"] .resume-rule { width: 36px; height: 2px; background: #b8863b; }
        .resume-page[data-theme="ledger"] .resume-job { position: relative; margin-left: 6px; padding: 0 0 12px 16px; border-left: 1px solid #1c1917; }
        .resume-page[data-theme="ledger"] .resume-job::before { content: ""; position: absolute; left: -4px; top: 5px; width: 7px; height: 7px; border-radius: 50%; background: #b8863b; }
        .resume-page[data-theme="ledger"] .resume-job:last-child { padding-bottom: 2px; }
        @media (min-width: 720px) {
          .resume-page[data-theme="ledger"] .resume-head { padding: 28px 32px 14px; }
          .resume-page[data-theme="ledger"] .resume-contact { padding: 0 32px 18px !important; }
          .resume-page[data-theme="ledger"] .resume-main { padding: 22px 32px 6px; }
          .resume-page[data-theme="ledger"] .resume-aside { padding: 10px 32px 4px; }
          .resume-page[data-theme="ledger"] .resume-extras { padding: 0 32px 28px; }
        }
        @media print {
          .no-print { display: none !important; }
          html, body, .resume-page { background: white !important; overflow: visible !important; }
          .resume-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; overflow: visible !important; }
          .resume-mark { position: fixed; }
          .resume-inner, .resume-inner p, .resume-inner h1, .resume-inner h2, .resume-inner li { position: relative; z-index: 1; }
          a { color: var(--cv-link) !important; }
          .resume-page:not([data-theme="classic"]):not([data-theme="sidebar"]):not([data-theme="ledger"]) .resume-inner {
            display: grid !important;
            grid-template-columns: minmax(0, 1.55fr) minmax(0, 0.85fr) !important;
          }
          .resume-page[data-theme="sidebar"] .resume-aside {
            background: #10211b !important;
            color: #f4efe4 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .resume-page[data-theme="sidebar"] .resume-aside,
          .resume-page[data-theme="sidebar"] .resume-aside p,
          .resume-page[data-theme="sidebar"] .resume-aside li,
          .resume-page[data-theme="sidebar"] .resume-aside span,
          .resume-page[data-theme="ledger"] .resume-head,
          .resume-page[data-theme="ledger"] .resume-head p,
          .resume-page[data-theme="ledger"] .resume-head h1,
          .resume-page[data-theme="ledger"] .resume-contact,
          .resume-page[data-theme="ledger"] .resume-contact a {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .resume-page[data-theme="sidebar"] .resume-inner { display: grid !important; grid-template-columns: 200px minmax(0, 1fr) !important; }
          .resume-page[data-theme="ledger"] .resume-head,
          .resume-page[data-theme="ledger"] .resume-contact { background: #161616 !important; color: #fff !important; }
          .resume-page[data-theme="ledger"] a,
          .resume-page[data-theme="sidebar"] .resume-aside a { color: #9a6b24 !important; }
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
