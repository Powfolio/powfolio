"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  User,
  Download,
  Upload,
  ExternalLink,
  Copy,
  RotateCcw,
  LogOut,
  Trash2,
  Link2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Circle,
  UserRound,
  FolderGit2,
  FileText,
  CandlestickChart,
  Blocks,
  Gift,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import OnboardingTour, { resetOnboarding } from "@/components/onboarding/OnboardingTour";
import { savePendingAutofill, type AutofillPayload } from "@/lib/autofill-store";
import { SITE_URL } from "@/lib/site";

type SectionKey =
  | "show_writing"
  | "show_trading"
  | "show_community"
  | "show_airdrops"
  | "show_nfts";

type ModuleDef = {
  id: string;
  title: string;
  desc: string;
  href: string;
  icon: typeof UserRound;
  flag?: SectionKey;
};

const MODULES: ModuleDef[] = [
  {
    id: "profile",
    title: "Profile & identity",
    desc: "Your introduction, professional background, skills, social accounts and the information people need to understand who you are.",
    href: "/dashboard/profile",
    icon: UserRound,
  },
  {
    id: "projects",
    title: "Projects & contributions",
    desc: "Show the projects you have contributed to, the roles you held, what you worked on and the impact or responsibilities behind each one.",
    href: "/dashboard/community",
    icon: FolderGit2,
    flag: "show_community",
  },
  {
    id: "writing",
    title: "Writing & research",
    desc: "Collect your articles, X threads, research, guides and other published work so visitors can see how you think and communicate.",
    href: "/dashboard/writing",
    icon: FileText,
    flag: "show_writing",
  },
  {
    id: "trading",
    title: "Trading record",
    desc: "Document selected trades with direction, outcome, ROI, charts, reasoning and updates. Give visitors context instead of just a list of wins and losses.",
    href: "/dashboard/trading",
    icon: CandlestickChart,
    flag: "show_trading",
  },
  {
    id: "onchain",
    title: "Onchain & collectibles",
    desc: "Connect your Web3 identity with wallet activity, verified collectibles, badges and other onchain evidence that supports your profile.",
    href: "/dashboard/collectibles",
    icon: Blocks,
    flag: "show_nfts",
  },
  {
    id: "airdrops",
    title: "Airdrops & testnets",
    desc: "Document testnets, airdrop campaigns and ecosystem participation, including your role, dates and claim status.",
    href: "/dashboard/airdrops",
    icon: Gift,
    flag: "show_airdrops",
  },
];

export type DashboardHomeProps = {
  userId: string;
  username: string | null;
  profileScore: number;
  checks: { basics: boolean; proof: boolean; social: boolean };
  flags: Record<SectionKey, boolean>;
};

export default function DashboardHome({
  userId,
  username,
  profileScore,
  checks,
  flags,
}: DashboardHomeProps) {
  const router = useRouter();
  const [state, setState] = useState(flags);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [tourKey, setTourKey] = useState(0);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicUrl = username ? `${SITE_URL.replace(/\/$/, "")}/${username}` : "";

  useEffect(() => {
    const stored = localStorage.getItem("pow3folio-theme");
    const next = stored === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function toast(msg: string) {
    setToastMsg(msg);
    setToastOn(true);
    window.setTimeout(() => setToastOn(false), 2400);
  }

  function setThemeValue(next: "dark" | "light") {
    setTheme(next);
    localStorage.setItem("pow3folio-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function toggle(flag: SectionKey, title: string) {
    const next = !state[flag];
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ [flag]: next }).eq("id", userId);
    if (error) {
      toast(error.message.includes("column") ? "Run the profile section columns SQL first." : error.message);
      return;
    }
    setState((s) => ({ ...s, [flag]: next }));
    toast(next ? `${title} is now visible` : `${title} is hidden from your profile`);
    router.refresh();
  }

  async function copyLink() {
    if (!publicUrl) {
      toast("Set a username in Profile first");
      return;
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast("Profile link copied to clipboard!");
    } catch {
      toast("Could not copy link");
    }
    setMenuOpen(false);
  }

  async function signOut() {
    setMenuOpen(false);
    toast("Signing out of Powfolio...");
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/auth/signout";
    document.body.appendChild(form);
    form.submit();
  }

  async function handleImport() {
    const url = importUrl.trim();
    if (!url) {
      toast("Paste a public link first");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/ai/autofill-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Could not read link");
        return;
      }
      if (!data.profile) {
        toast("No data extracted from link");
        return;
      }
      const stored = savePendingAutofill(data.profile as AutofillPayload, data.source || url);
      if (!stored.pending.length) {
        toast("Nothing useful extracted. Try another link.");
        return;
      }
      toast("Import started: review results before publishing");
      const first = stored.pending[0];
      const dest =
        first === "writing"
          ? "/dashboard/writing"
          : first === "community"
            ? "/dashboard/community"
            : "/dashboard/profile";
      router.push(dest);
    } catch {
      toast("Network error");
    } finally {
      setImporting(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.(pdf|txt|md|doc|docx|png|jpe?g|webp|gif)$/i.test(file.name)) {
      toast("Use a PDF, text file, or image");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast("File must be under 4MB");
      return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const res = await fetch("/api/ai/autofill", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error || "Could not read file"); return; }
      if (!data.profile) { toast("No data extracted from that file"); return; }
      const stored = savePendingAutofill(data.profile as AutofillPayload, file.name);
      if (!stored.pending.length) { toast("Nothing useful extracted. Try another file or image."); return; }
      toast("Import started: review results before publishing");
      const first = stored.pending[0];
      router.push(first === "writing" ? "/dashboard/writing" : first === "community" ? "/dashboard/community" : "/dashboard/profile");
    } catch {
      toast("Could not read file");
    } finally {
      setImporting(false);
    }
  }

  const visibleCount = MODULES.filter((m) => (m.flag ? state[m.flag] : true)).length;

  return (
    <div className="dash-app">
      <OnboardingTour key={tourKey} force={tourKey > 0} />
      <header className="d-topbar">
        <Link href="/" className="d-brand" aria-label="Powfolio home">
          <span className="d-mark">P</span>
          <span className="d-title">Powfolio</span>
        </Link>
        <div className="d-actions">
          <button type="button" className="nav-icon-btn" title="Switch theme" aria-label="Switch theme" onClick={() => setThemeValue(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className={`account-avatar-btn${menuOpen ? " active" : ""}`} aria-label="Open account menu" aria-expanded={menuOpen} title="Account & settings" onClick={() => setMenuOpen((v) => !v)}>
            <User size={17} />
          </button>
        </div>
      </header>
      <div className={`menu-backdrop${menuOpen ? " show" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`account-menu${menuOpen ? " open" : ""}`}>
        <div className="mobile-handle" />
        <Link href="/dashboard/resume" className="menu-row" onClick={() => setMenuOpen(false)}>
          <Download />
          <span>Download Powfolio</span>
        </Link>
        <div className="menu-row-link">
          {username ? (
            <a href={publicUrl} target="_blank" rel="noreferrer" className="menu-link-text" onClick={() => setMenuOpen(false)}>
              <ExternalLink />
              <span>Profile Link</span>
            </a>
          ) : (
            <Link href="/dashboard/profile" className="menu-link-text" onClick={() => setMenuOpen(false)}>
              <ExternalLink />
              <span>Set username</span>
            </Link>
          )}
          <button type="button" className="menu-copy-btn" aria-label="Copy public link" onClick={copyLink}>
            <Copy size={15} />
          </button>
        </div>
        <button type="button" className="menu-row" onClick={() => { resetOnboarding(); setTourKey((k) => k + 1); setMenuOpen(false); toast("Starting the Powfolio dashboard tour..."); }}>
          <RotateCcw />
          <span>Replay Tour</span>
        </button>
        <button type="button" className="menu-row" onClick={signOut}>
          <LogOut />
          <span>Sign out</span>
        </button>
        <div className="menu-divider" />
        <Link href="/dashboard/profile#delete-account" className="menu-row danger" onClick={() => setMenuOpen(false)}>
          <Trash2 />
          <span>Delete account</span>
        </Link>
      </div>
      <section className="d-content">
        <div className="page-head">
          <div>
            <div className="eyebrow">Profile workspace</div>
            <h1>Build your public profile.</h1>
            <p className="sub">Control what people see, add proof of your work, and keep your Web3 identity in one place.</p>
          </div>
        </div>
        <div className="grid-top">
          <section>
            <div className="panel-title">Import your existing work</div>
            <div className="panel-desc">Paste a public link, or upload a CV, PDF, text file, or image. Powfolio reads it and prefills the matching sections.</div>
            <div className="import-row">
              <div className="input-wrap">
                <Link2 />
                <input className="d-input" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="Paste a public link..." disabled={importing} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleImport(); } }} />
              </div>
              <div className="import-actions">
                <button type="button" className="d-btn d-btn-primary" disabled={importing} onClick={() => void handleImport()}>
                  <Sparkles size={14} />
                  {importing ? "Working…" : "Autofill"}
                </button>
                <button
                  type="button"
                  className="d-btn d-btn-primary"
                  disabled={importing}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  {importing ? "Working…" : "Upload file"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.doc,.docx,image/png,image/jpeg,image/webp,image/gif"
                  hidden
                  disabled={importing}
                  onChange={(e) => void handleFile(e)}
                />
              </div>
            </div>
            <div className="hint"><b>Tip:</b> You stay in control: review imported information before it appears publicly.</div>
          </section>
          <section>
            <div className="progress-top">
              <div>
                <div className="eyebrow">Profile strength</div>
                <div className="percent">{profileScore}%</div>
              </div>
              <ShieldCheck size={19} color="#B8860B" />
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, profileScore))}%` }} />
            </div>
            <div className="checklist">
              <div className={`check${checks.basics ? " done" : ""}`}>{checks.basics ? <CheckCircle2 /> : <Circle />}Profile basics completed</div>
              <div className={`check${checks.proof ? " done" : ""}`}>{checks.proof ? <CheckCircle2 /> : <Circle />}At least one proof of work section</div>
              <div className={`check${checks.social ? " done" : ""}`}>{checks.social ? <CheckCircle2 /> : <Circle />}Add a social identity</div>
            </div>
          </section>
        </div>
        <div className="section-head">
          <div>
            <h2>Profile sections</h2>
            <span>Choose what appears publicly</span>
          </div>
          <span>{visibleCount} of {MODULES.length} visible</span>
        </div>
        <section>
          {MODULES.map((m) => {
            const enabled = m.flag ? state[m.flag] : true;
            const Icon = m.icon;
            return (
              <div key={m.id} className={`module${enabled ? "" : " off"}`}>
                <Link href={m.href} className="module-main" aria-label={`Open ${m.title}`}>
                  <div className="mod-icon"><Icon /></div>
                  <div className="module-copy">
                    <div className="module-title">{m.title}</div>
                    <div className="module-desc">{m.desc}</div>
                  </div>
                  <span className="edit" aria-hidden="true"><ChevronRight /></span>
                </Link>
                <button type="button" className={`switch${enabled ? " on" : ""}`} aria-label={`Toggle ${m.title}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!m.flag) { toast("Profile & identity stays on your public page"); return; } void toggle(m.flag, m.title); }}><span /></button>
              </div>
            );
          })}
        </section>
        <div className="helper">
          <section>
            <div className="helper-title"><Eye />Visibility</div>
            <p>Turning a section off removes it from your public profile. Your saved information stays in your dashboard.</p>
          </section>
          <section>
            <div className="helper-title"><SlidersHorizontal />Keep it focused</div>
            <p>Only publish the sections that strengthen your professional story. You can keep other information saved privately and turn it on whenever it is ready.</p>
          </section>
        </div>
      </section>
      <div className={`toast${toastOn ? " show" : ""}`}>{toastMsg}</div>
    </div>
  );
}
