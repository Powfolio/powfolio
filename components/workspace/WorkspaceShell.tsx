"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/ui/BrandMark";

export type WorkspaceTab = { id: string; short: string; icon: string };

function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function WorkspaceShell({
  title,
  eyebrow,
  intro,
  username,
  note,
  tabs,
  tab,
  onTab,
  children,
  hideDock = false,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  username: string;
  note: string;
  tabs: WorkspaceTab[];
  tab: string;
  onTab: (id: string) => void;
  children: React.ReactNode;
  hideDock?: boolean;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dock, setDock] = useState<"closed" | "open" | "closing">("closed");
  const [sideCollapsed, setSideCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pow3folio-theme");
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  function closeDock() {
    setDock("closing");
    window.setTimeout(() => setDock("closed"), 380);
  }
  function select(id: string) {
    onTab(id);
    history.replaceState(null, "", `#${id}`);
    if (dock !== "closed") closeDock();
  }

  return (
    <div className="profile-identity" data-theme={theme} data-collapsed={sideCollapsed ? "1" : "0"}>
      <header className="topbar">
        <Link className="back" href="/dashboard" aria-label="Back to dashboard"><Icon d="M15 5 8 12l7 7" size={18} /></Link>
        <Link className="brand" href="/" aria-label="Powfolio home"><SiteLogo /><span className="brand-name">Powfolio</span></Link>
      </header>
      <aside className={`side${sideCollapsed ? " collapsed" : ""}`}>
        <nav className="side-nav" aria-label={`${title} sections`}>
          {tabs.map((item) => (
            <button key={item.id} className={`side-tab${tab === item.id ? " active" : ""}`} type="button" onClick={() => select(item.id)}>
              <Icon d={item.icon} size={16} />
              <span>{item.short}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-meta"><div className="side-handle" title={username}>@{username || "profile"}</div><div className="side-note">{note}</div></div>
          <button className="side-collapse" type="button" aria-label={sideCollapsed ? "Expand sidebar" : "Minimize sidebar"} onClick={() => setSideCollapsed((v) => !v)}>
            <Icon d={sideCollapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} size={16} />
          </button>
        </div>
      </aside>
      <main className="shell">
        <section className="hero">
          <div className="eyebrow">{eyebrow}</div>
          <div className="hero-row"><div><h1>{title}</h1><p>{intro}</p></div></div>
        </section>
        <section className="panel active">{children}</section>
      </main>
      {!hideDock && <>
      <button className={`tab-fab${dock === "open" ? " open" : ""}`} type="button" aria-label={dock === "open" ? "Close sections" : "Open sections"} onClick={() => { if (dock === "open") closeDock(); else setDock("open"); }}>
        <svg className="burger" viewBox="0 0 24 18" width="22" height="16" aria-hidden>
          <rect x="1" y="1" width="22" height="3.2" rx="1.6" />
          <rect x="1" y="7.4" width="22" height="3.2" rx="1.6" />
          <rect x="1" y="13.8" width="22" height="3.2" rx="1.6" />
        </svg>
      </button>
      <div className={`tab-dock${dock === "open" ? " open" : ""}${dock === "closing" ? " closing" : ""}`}>
        {tabs.map((item, index) => (
          <button key={item.id} className={`dock-tab${tab === item.id ? " active" : ""}`} style={{ transitionDelay: `${index * 45}ms` }} type="button" onClick={() => select(item.id)}>
            <Icon d={item.icon} size={16} />
            <span>{item.short}</span>
          </button>
        ))}
      </div>
      {dock !== "closed" && <button className="dock-backdrop" type="button" aria-label="Close sections" onClick={closeDock} />}
      </>}
    </div>
  );
}
