"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/ui/BrandMark";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { connectEthereumWallet } from "@/lib/wallet";
import { startXAuth } from "@/lib/x-oauth";
import { SITE_URL } from "@/lib/site";
import { isReservedUsername, reservedUsernameMessage } from "@/lib/usernames";
import { moveItem } from "@/lib/move-item";
import CvDetails from "@/components/profile/CvDetails";
import EntrySheet from "@/components/ui/EntrySheet";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import type { Credential, Education, Profile, Skill, WorkExperience } from "@/types/database";

type TabId = "identity" | "skills" | "experience" | "docs" | "cv";
type Props = {
  profile: Profile;
  email: string | null;
  credentials: Credential[];
  linkedProviders?: string[];
  googleEmail?: string | null;
};

const TABS: { id: TabId; label: string; short: string; icon: string }[] = [
  { id: "identity", label: "Identity", short: "Identity", icon: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" },
  { id: "skills", label: "Skills & Connections", short: "Skills", icon: "M9 7h6M9 11h6M9 15h4M7 3h10a2 2 0 0 1 2 2v14l-4-2-3 2-3-2-4 2V5a2 2 0 0 1 2-2Z" },
  { id: "experience", label: "Experience & Education", short: "Experience", icon: "M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm4-3h8v3H8V4Z" },
  { id: "docs", label: "Docs & Credentials", short: "Docs", icon: "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 1.5V9h4.5" },
  { id: "cv", label: "CV details", short: "CV", icon: "M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M8 13h8M8 17h5" },
];
const URL_IN_BIO = /(?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+\.(?:com|io|xyz|net|org|app|dev|co|gg|me|link|bio|ng|eth)\b/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function absoluteUrl(url: string) {
  const t = url.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
}
function parseSkill(value: unknown): Skill | null {
  if (typeof value === "string") {
    let current: unknown = value.trim();
    for (let i = 0; i < 2; i++) {
      if (typeof current !== "string") break;
      const text = current.trim();
      if (!text.startsWith("{") && !text.startsWith("[")) return text ? { name: text.slice(0, 60), description: "" } : null;
      try { current = JSON.parse(text); } catch { return { name: text.slice(0, 60), description: "" }; }
    }
    value = current;
  }
  if (value && typeof value === "object" && "name" in value) {
    const record = value as Skill;
    const name = String(record.name || "").trim();
    if (name.startsWith("{")) {
      const nested = parseSkill(name);
      if (nested) return { name: nested.name, description: nested.description || String(record.description || "").slice(0, 250) };
    }
    return name ? { name: name.slice(0, 60), description: String(record.description || "").slice(0, 250) } : null;
  }
  return null;
}
function normalizeSkills(raw: Profile["skills"]): Skill[] {
  if (!raw || !Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const next: Skill[] = [];
  for (const item of raw) {
    const skill = parseSkill(item);
    if (!skill) continue;
    const key = skill.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(skill);
  }
  return next;
}
function fileType(name: string) {
  return (name.split(".").pop() || "FILE").toUpperCase().slice(0, 5);
}
function siteLogo(url: string | null) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : null;
  } catch {
    return null;
  }
}
function isImageFile(name: string | null, type: string | null) {
  return (type || "").startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(name || "");
}

type WorkForm = {
  company: string;
  role: string;
  url: string;
  desc: string;
  achievements: string;
  type: string;
  mode: string;
  hours: string;
  start: string;
  end: string;
  logo: string;
};

type AchieveEditor = { index: number; draft: string; original: string };

const BLANK_WORK: WorkForm = {
  company: "",
  role: "",
  url: "",
  desc: "",
  achievements: "",
  type: "Full-time",
  mode: "remote",
  hours: "",
  start: "",
  end: "",
  logo: "",
};

function achievementLines(raw: string | null | undefined) {
  return (raw || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function workFromItem(item: WorkExperience): WorkForm {
  return {
    company: item.company,
    role: item.role,
    url: item.url || "",
    desc: item.description || "",
    achievements: achievementLines(item.achievements).join("\n"),
    type: item.employment_type === "part-time" ? "Part-time" : "Full-time",
    mode: item.work_mode === "onsite" ? "onsite" : "remote",
    hours: item.hours_per_day ? String(item.hours_per_day) : "",
    start: item.start_date || "",
    end: item.end_date || "",
    logo: item.logo_url || "",
  };
}

function withPendingAchievement(form: WorkForm, editor: AchieveEditor | null) {
  const lines = achievementLines(form.achievements);
  if (!editor) return lines.join("\n");
  const text = editor.draft.trim();
  if (editor.index >= 0) {
    if (text) lines[editor.index] = text;
  } else if (text) {
    lines.push(text);
  }
  return lines.join("\n");
}

function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function ProfileIdentity({ profile, email, credentials, linkedProviders = [], googleEmail = null }: Props) {
  const router = useRouter();
  const host = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const publicUrl = `${SITE_URL.replace(/\/$/, "")}/${profile.username}`;
  const [tab, setTab] = useState<TabId>("identity");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dock, setDock] = useState<"closed" | "open" | "closing">("closed");
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const [username, setUsername] = useState(profile.username || "");
  const [nameStatus, setNameStatus] = useState<"checking" | "good" | "bad">("checking");
  const [nameMsg, setNameMsg] = useState("Username availability will appear here");
  const [shake, setShake] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [region, setRegion] = useState(profile.location_region || "");
  const [country, setCountry] = useState(profile.location_country || "");
  const [detecting, setDetecting] = useState(false);
  const [bio, setBio] = useState(profile.bio || "");
  const [about, setAbout] = useState(profile.long_bio || "");
  const [openWork, setOpenWork] = useState(profile.open_to_work ?? false);
  const [mediaSheet, setMediaSheet] = useState<null | "avatar" | "banner">(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [skills, setSkills] = useState<Skill[]>(normalizeSkills(profile.skills));
  const [skillInput, setSkillInput] = useState("");
  const [xUrl, setXUrl] = useState(profile.x_url || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [telegramUrl, setTelegramUrl] = useState(profile.telegram_url || "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || "");
  const [secondaryEmail, setSecondaryEmail] = useState(profile.secondary_email || "");
  const [showPrimary, setShowPrimary] = useState(profile.show_primary_email ?? true);
  const [showSecondary, setShowSecondary] = useState(profile.show_secondary_email ?? false);
  const [ensName, setEnsName] = useState(profile.ens_name || "");
  const [wallet, setWallet] = useState(profile.wallet_address || "");
  const [editor, setEditor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const [work, setWork] = useState<WorkExperience[]>(profile.work_experience ?? []);
  const [education, setEducation] = useState<Education[]>(profile.education ?? []);
  const [workOpen, setWorkOpen] = useState(false);
  const [eduOpen, setEduOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<string | null>(null);
  const [editingEdu, setEditingEdu] = useState<string | null>(null);
  const [wForm, setWForm] = useState<WorkForm>(BLANK_WORK);
  const [achieveEditor, setAchieveEditor] = useState<AchieveEditor | null>(null);
  const [discardScope, setDiscardScope] = useState<null | "work" | "achievement">(null);
  const [workBusy, setWorkBusy] = useState(false);
  const [solo, setSolo] = useState<{ itemId: string; index: number; draft: string; original: string } | null>(null);
  const [soloDiscard, setSoloDiscard] = useState(false);
  const [soloBusy, setSoloBusy] = useState(false);
  const workBaseline = useRef(JSON.stringify(BLANK_WORK));
  const eduBaseline = useRef("");
  const docBaseline = useRef({ title: "", issuer: "", note: "" });
  const [eForm, setEForm] = useState({ institution: "", degree: "", field: "", country: "", start: "", end: "", url: "", desc: "", logo: "" });
  const [expError, setExpError] = useState("");
  const [eduError, setEduError] = useState("");
  const [dragWork, setDragWork] = useState<number | null>(null);
  const [dragEdu, setDragEdu] = useState<number | null>(null);

  const [docs, setDocs] = useState<Credential[]>(credentials);
  const [docOpen, setDocOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docIssuer, setDocIssuer] = useState("");
  const [docNote, setDocNote] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const [dragDoc, setDragDoc] = useState<number | null>(null);
  const [cvDownload, setCvDownload] = useState(profile.show_credentials !== false);

  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const locationLabel = region && country ? `${region}, ${country}` : country || region || "Not detected";
  const initials = (displayName || username || "P").slice(0, 1).toUpperCase();
  const bioHasLink = useMemo(() => URL_IN_BIO.test(bio), [bio]);

  function notify(msg: string) {
    setToast(msg);
    setToastOn(true);
    window.setTimeout(() => setToastOn(false), 2200);
  }

  useEffect(() => {
    const stored = localStorage.getItem("pow3folio-theme");
    const next = stored === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.dataset.theme = next;
    const hash = window.location.hash.replace("#", "") as TabId;
    if (["identity", "skills", "experience", "docs", "cv"].includes(hash)) setTab(hash);
    if (googleEmail && !profile.secondary_email) setSecondaryEmail(googleEmail);
  }, [profile.id, googleEmail, profile.secondary_email]);

  useEffect(() => {
    if (!workOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (discardScope) {
        setDiscardScope(null);
        return;
      }
      if (achieveEditor) {
        if (achieveEditor.draft.trim() !== achieveEditor.original.trim()) setDiscardScope("achievement");
        else setAchieveEditor(null);
        return;
      }
      if (JSON.stringify(wForm) !== workBaseline.current) setDiscardScope("work");
      else resetWork();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [workOpen, discardScope, achieveEditor, wForm]);

  useEffect(() => {
    if (!solo) return;
    const current = solo;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (soloDiscard) {
        setSoloDiscard(false);
        return;
      }
      if (current.draft.trim() !== current.original.trim()) setSoloDiscard(true);
      else setSolo(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [solo, soloDiscard]);



  useEffect(() => {
    const v = username.trim().toLowerCase().replace(/^@/, "");
    if (!v) {
      setNameStatus("checking");
      setNameMsg("Username availability will appear here");
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(v) || isReservedUsername(v)) {
      setNameStatus("bad");
      setNameMsg(isReservedUsername(v) ? reservedUsernameMessage() : "Use 3 to 30 lowercase letters, numbers or underscores");
      setShake(true);
      window.setTimeout(() => setShake(false), 460);
      return;
    }
    setNameStatus("checking");
    setNameMsg("Checking availability...");
    const t = window.setTimeout(async () => {
      if (v === profile.username) {
        setNameStatus("good");
        setNameMsg("This is your current username");
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("id").eq("username", v).maybeSingle();
      const taken = Boolean(data && data.id !== profile.id);
      setNameStatus(taken ? "bad" : "good");
      setNameMsg(taken ? "Username is already taken" : "Username is available");
      if (taken) {
        setShake(true);
        window.setTimeout(() => setShake(false), 460);
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [username, profile.id, profile.username]);

  async function uploadImage(file: File, kind: "avatar" | "banner") {
    if (!file.type.startsWith("image/")) {
      notify(kind === "avatar" ? "Please upload an image file" : "Banner must be an image");
      return null;
    }
    if (file.size > (kind === "banner" ? 4 : 2) * 1024 * 1024) {
      notify(kind === "banner" ? "Banner must be under 4MB" : "Avatar must be under 2MB");
      return null;
    }
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      notify(error.message);
      return null;
    }
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  async function onAvatar(file?: File) {
    if (!file) return;
    setUploadingAvatar(true);
    const url = await uploadImage(file, "avatar");
    if (!url) { setUploadingAvatar(false); return; }
    setAvatarUrl(url);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    setUploadingAvatar(false);
    notify(error ? error.message : "Profile photo saved");
    if (!error) router.refresh();
  }
  async function onBanner(file?: File) {
    if (!file) return;
    setUploadingBanner(true);
    const url = await uploadImage(file, "banner");
    if (!url) { setUploadingBanner(false); return; }
    setBannerUrl(url);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ banner_url: url }).eq("id", profile.id);
    setUploadingBanner(false);
    notify(error ? error.message : "Banner saved");
    if (!error) router.refresh();
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      notify("This browser cannot share GPS");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const qs = new URLSearchParams({ lat: String(pos.coords.latitude), lon: String(pos.coords.longitude) });
          const res = await fetch(`/api/geo/reverse?${qs.toString()}`);
          const json = await res.json();
          if (!res.ok || !json.country) throw new Error();
          setCountry(json.country || "");
          setRegion(json.region || "");
          notify(json.city && json.region ? `Detected ${json.city}, ${json.region}` : "Location detected");
        } catch {
          notify("GPS detected. Reverse lookup unavailable");
        }
        setDetecting(false);
      },
      (err) => {
        notify(err.code === 1 ? "Location permission was blocked. Enable it for this site, then tap Detect." : "GPS timed out. Tap Detect again.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  async function saveIdentity() {
    if (bioHasLink) {
      notify("Remove the link from Short bio. Use Website instead.");
      return;
    }
    const handle = username.trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_]{3,30}$/.test(handle) || isReservedUsername(handle) || nameStatus === "bad") {
      notify(nameMsg || "Choose an available username");
      return;
    }
    setSaving("identity");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      username: handle,
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      long_bio: about.trim() || null,
      open_to_work: openWork,
      location_country: country.trim() || null,
      location_region: region.trim() || null,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      is_public: true,
    }).eq("id", profile.id);
    setSaving(null);
    if (error) {
      notify(error.code === "23505" ? "That username is already taken" : error.message);
      return;
    }
    setSaved("identity");
    notify("Identity saved");
    router.refresh();
  }

  function addSkill() {
    const name = skillInput.trim().slice(0, 40);
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      notify("Skill already added");
      return;
    }
    if (skills.length >= 12) {
      notify("Maximum of 12 skills");
      return;
    }
    setSkills((prev) => [...prev, { name, description: "" }]);
    setSkillInput("");
  }

  function openEditor(key: string, current: string) {
    setEditor(key);
    setDraft(current);
  }
  function applyEditor() {
    const value = draft.trim();
    if (editor === "x") setXUrl(value ? absoluteUrl(value) || value : "");
    if (editor === "github") setGithubUrl(value ? absoluteUrl(value) || value : "");
    if (editor === "telegram") setTelegramUrl(value ? absoluteUrl(value) || value : "");
    if (editor === "website") setWebsiteUrl(value ? absoluteUrl(value) || value : "");
    if (editor === "ens") setEnsName(value);
    if (editor === "email") setSecondaryEmail(value);
    setEditor(null);
  }

  async function connectX() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard/profile")}`;
    const { error } = await startXAuth(supabase, "link", redirectTo);
    if (error) notify(error);
  }
  async function connectGithub() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.linkIdentity({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard/profile")}`, skipBrowserRedirect: true },
    });
    if (error) {
      notify(error.message);
      return;
    }
    if (data?.url) window.location.assign(data.url);
  }
  async function connectWallet() {
    try {
      const address = await connectEthereumWallet();
      setWallet(address);
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update({ wallet_address: address }).eq("id", profile.id);
      if (error) notify(error.message);
      else notify("Wallet connected");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Wallet connection failed");
    }
  }
  async function disconnectWallet() {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ wallet_address: null }).eq("id", profile.id);
    if (error) { notify(error.message); return; }
    setWallet("");
    notify("Wallet disconnected");
  }
  async function connectGoogle() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard/profile")}`, skipBrowserRedirect: true },
    });
    if (error) { notify(error.message); return; }
    if (data?.url) window.location.assign(data.url);
    else notify("Google sign-in did not return a link");
  }
  async function disconnectProvider(provider: "twitter" | "github" | "google") {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const identity = user?.identities?.find((i) => provider === "twitter" ? i.provider === "twitter" || i.provider === "x" : i.provider === provider);
    if (identity) {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) { notify(error.message); return; }
    }
    if (provider === "twitter") {
      await supabase.from("profiles").update({ x_url: null }).eq("id", profile.id);
      setXUrl("");
    } else if (provider === "github") {
      await supabase.from("profiles").update({ github_url: null }).eq("id", profile.id);
      setGithubUrl("");
    } else {
      await supabase.from("profiles").update({ secondary_email: null, show_secondary_email: false }).eq("id", profile.id);
      setSecondaryEmail("");
      setShowSecondary(false);
    }
    notify("Disconnected");
    router.refresh();
  }
  async function uploadLogo(file: File) {
    if (!file.type.startsWith("image/")) { notify("Logo must be an image"); return null; }
    if (file.size > 2 * 1024 * 1024) { notify("Logo must be under 2MB"); return null; }
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `${profile.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { notify(error.message); return null; }
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  async function saveSkills() {
    const secondary = secondaryEmail.trim().toLowerCase();
    if (secondary && !EMAIL_RE.test(secondary)) {
      notify("Second email looks invalid");
      return;
    }
    if (secondary && email && secondary === email.toLowerCase()) {
      notify("Second email must be different from your login email");
      return;
    }
    if (email && !showPrimary && !secondary) {
      notify("At least one email must be available on your public profile");
      return;
    }
    if (email && !showPrimary && secondary && !showSecondary) {
      notify("At least one email must be visible on your public profile");
      return;
    }
    setSaving("skills");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      skills,
      x_url: xUrl.trim() || null,
      github_url: githubUrl.trim() || null,
      telegram_url: telegramUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      secondary_email: secondary || null,
      primary_email: email ? email.toLowerCase() : null,
      show_primary_email: showPrimary && !!email,
      show_secondary_email: showSecondary && !!secondary,
      ens_name: ensName.trim() || null,
      wallet_address: wallet.trim() || null,
    }).eq("id", profile.id);
    setSaving(null);
    if (error) {
      notify(error.message);
      return;
    }
    setSaved("skills");
    notify("Skills and connections saved");
    router.refresh();
  }

  async function persistExperience(nextWork: WorkExperience[], nextEdu: Education[]) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ work_experience: nextWork, education: nextEdu }).eq("id", profile.id);
    if (error) {
      notify(error.message.includes("column") ? "Run the work and education SQL first." : error.message);
      return false;
    }
    setWork(nextWork);
    setEducation(nextEdu);
    return true;
  }

  function resetWork() {
    setWForm(BLANK_WORK);
    setEditingWork(null);
    setExpError("");
    setAchieveEditor(null);
    setDiscardScope(null);
    setWorkOpen(false);
  }
  function workDirty(editor = achieveEditor) {
    const pending = editor ? editor.draft.trim() !== editor.original.trim() : false;
    return JSON.stringify(wForm) !== workBaseline.current || pending;
  }
  function beginWork(form: WorkForm, id: string | null, focusIndex?: number) {
    setWForm(form);
    setEditingWork(id);
    setExpError("");
    setDiscardScope(null);
    workBaseline.current = JSON.stringify(form);
    setWorkOpen(true);
    if (typeof focusIndex === "number") {
      const lines = achievementLines(form.achievements);
      const text = lines[focusIndex] || "";
      setAchieveEditor({ index: focusIndex, draft: text, original: text });
    } else {
      setAchieveEditor(null);
    }
  }
  function requestCloseWork() {
    if (discardScope) return;
    if (achieveEditor && achieveEditor.draft.trim() !== achieveEditor.original.trim()) {
      setDiscardScope("achievement");
      return;
    }
    if (workDirty(null)) {
      setDiscardScope("work");
      return;
    }
    resetWork();
  }
  function requestCloseAchievement() {
    if (!achieveEditor) return;
    if (achieveEditor.draft.trim() !== achieveEditor.original.trim()) setDiscardScope("achievement");
    else setAchieveEditor(null);
  }
  function confirmDiscard() {
    if (discardScope === "achievement") {
      setAchieveEditor(null);
      setDiscardScope(null);
      return;
    }
    resetWork();
  }
  function openAchievement(index: number) {
    const lines = achievementLines(wForm.achievements);
    const text = index >= 0 ? lines[index] || "" : "";
    setAchieveEditor({ index, draft: text, original: text });
  }
  async function commitAchievementLines(lines: string[], message?: string) {
    const achievements = lines.join("\n");
    const nextForm = { ...wForm, achievements };
    setWForm(nextForm);
    setAchieveEditor(null);
    if (!editingWork) return;
    const next = work.map((item) => item.id === editingWork ? { ...item, achievements: achievements.trim() || null } : item);
    const ok = await persistExperience(next, education);
    if (!ok) return;
    try {
      const baseline = JSON.parse(workBaseline.current) as WorkForm;
      baseline.achievements = achievements;
      workBaseline.current = JSON.stringify(baseline);
    } catch {
      workBaseline.current = JSON.stringify(nextForm);
    }
    if (message) notify(message);
  }
  function saveAchievement() {
    if (!achieveEditor) return;
    const text = achieveEditor.draft.trim();
    if (!text) return;
    const lines = achievementLines(wForm.achievements);
    const editingLine = achieveEditor.index >= 0;
    if (editingLine) lines[achieveEditor.index] = text;
    else lines.push(text);
    void commitAchievementLines(lines, editingWork ? (editingLine ? "Achievement updated" : "Achievement added") : undefined);
  }
  function removeAchievement(index: number) {
    const lines = achievementLines(wForm.achievements).filter((_, i) => i !== index);
    void commitAchievementLines(lines, editingWork ? "Achievement removed" : undefined);
  }
  function openSoloAchievement(item: WorkExperience, index: number) {
    const text = achievementLines(item.achievements)[index] || "";
    setSolo({ itemId: item.id, index, draft: text, original: text });
    setSoloDiscard(false);
  }
  function requestCloseSolo() {
    if (!solo || soloBusy) return;
    if (solo.draft.trim() !== solo.original.trim()) setSoloDiscard(true);
    else setSolo(null);
  }
  async function saveSoloAchievement() {
    if (!solo) return;
    const text = solo.draft.trim();
    if (!text) return;
    const current = work.find((item) => item.id === solo.itemId);
    if (!current) {
      setSolo(null);
      return;
    }
    const lines = achievementLines(current.achievements);
    lines[solo.index] = text;
    setSoloBusy(true);
    const next = work.map((item) => item.id === current.id ? { ...item, achievements: lines.join("\n") } : item);
    const ok = await persistExperience(next, education);
    setSoloBusy(false);
    if (!ok) return;
    setSolo(null);
    setSoloDiscard(false);
    notify("Achievement updated");
  }
  async function saveWorkItem() {
    const achievements = withPendingAchievement(wForm, achieveEditor);
    const form = { ...wForm, achievements };
    if (!form.company.trim() || !form.role.trim() || !form.url.trim() || !form.start) {
      setExpError("Company, role, company link and start date are required.");
      return;
    }
    setWorkBusy(true);
    const url = absoluteUrl(form.url);
    const item: WorkExperience = {
      id: editingWork || uid(),
      company: form.company.trim(),
      role: form.role.trim(),
      url,
      description: form.desc.trim() || null,
      employment_type: form.type === "Part-time" ? "part-time" : "full-time",
      start_date: form.start,
      end_date: form.end || null,
      logo_url: form.logo || siteLogo(url),
      achievements: achievements.trim() || null,
      work_mode: form.mode === "onsite" ? "onsite" : "remote",
      hours_per_day: form.hours ? Number(form.hours) : null,
    };
    const next = editingWork ? work.map((w) => (w.id === editingWork ? item : w)) : [...work, item];
    const ok = await persistExperience(next, education);
    setWorkBusy(false);
    if (ok) {
      const wasEditing = Boolean(editingWork);
      resetWork();
      notify(wasEditing ? "Experience updated" : "Experience added");
    }
  }
  function editWork(item: WorkExperience, focusIndex?: number) {
    beginWork(workFromItem(item), item.id, focusIndex);
  }

  function resetEdu() {
    setEForm({ institution: "", degree: "", field: "", country: "", start: "", end: "", url: "", desc: "", logo: "" });
    setEditingEdu(null);
    setEduError("");
    setEduOpen(false);
  }
  function openNewEdu() {
    const blank = { institution: "", degree: "", field: "", country: "", start: "", end: "", url: "", desc: "", logo: "" };
    setEForm(blank);
    setEditingEdu(null);
    setEduError("");
    eduBaseline.current = JSON.stringify(blank);
    setEduOpen(true);
  }
  async function saveEduItem() {
    if (!eForm.institution.trim()) {
      setEduError("Institution is required.");
      return;
    }
    const schoolUrl = absoluteUrl(eForm.url);
    if (!schoolUrl && !eForm.logo) {
      setEduError("Add the school website so the logo can be pulled, or upload the school logo.");
      return;
    }
    const item: Education = {
      id: editingEdu || uid(),
      institution: eForm.institution.trim(),
      degree: eForm.degree.trim() || null,
      field_of_study: eForm.field.trim() || null,
      country: eForm.country.trim() || null,
      start_year: eForm.start.trim() || null,
      end_year: eForm.end.trim() || null,
      url: schoolUrl,
      description: eForm.desc.trim() || null,
      logo_url: eForm.logo || siteLogo(schoolUrl),
    };
    const next = editingEdu ? education.map((e) => (e.id === editingEdu ? item : e)) : [...education, item];
    const wasEditing = Boolean(editingEdu);
    const ok = await persistExperience(work, next);
    if (ok) {
      resetEdu();
      notify(wasEditing ? "Education updated" : "Education added");
    }
  }
  function editEdu(item: Education) {
    const next = {
      institution: item.institution,
      degree: item.degree || "",
      field: item.field_of_study || "",
      country: item.country || "",
      start: item.start_year || "",
      end: item.end_year || "",
      url: item.url || "",
      desc: item.description || "",
      logo: item.logo_url || "",
    };
    setEditingEdu(item.id);
    setEForm(next);
    setEduError("");
    eduBaseline.current = JSON.stringify(next);
    setEduOpen(true);
  }

  async function saveExperienceOrder() {
    setSaving("experience");
    const ok = await persistExperience(work, education);
    setSaving(null);
    if (ok) {
      setSaved("experience");
      notify("Experience saved");
    }
  }

  function resetDoc() {
    setEditingDoc(null);
    setDocTitle("");
    setDocIssuer("");
    setDocNote("");
    setDocFile(null);
    setDocError("");
    setDocOpen(false);
  }
  function openNewDoc() {
    setEditingDoc(null);
    setDocTitle("");
    setDocIssuer("");
    setDocNote("");
    setDocFile(null);
    setDocError("");
    docBaseline.current = { title: "", issuer: "", note: "" };
    setDocOpen(true);
  }
  function openEditDoc(item: Credential) {
    setEditingDoc(item.id);
    setDocTitle(item.title);
    setDocIssuer(item.issuer || "");
    setDocNote(item.description || "");
    setDocFile(null);
    setDocError("");
    docBaseline.current = { title: item.title, issuer: item.issuer || "", note: item.description || "" };
    setDocOpen(true);
  }
  async function saveDoc() {
    if (!docTitle.trim()) {
      setDocError("Document title is required.");
      return;
    }
    if (!editingDoc && !docFile) {
      setDocError("Upload a document first.");
      return;
    }
    setDocBusy(true);
    setDocError("");
    const supabase = createClient();
    let fileUrl = docs.find((d) => d.id === editingDoc)?.file_url || "";
    let fileName = docs.find((d) => d.id === editingDoc)?.file_name || null;
    let type = docs.find((d) => d.id === editingDoc)?.file_type || null;
    if (docFile) {
      if (docFile.size > 8 * 1024 * 1024) {
        setDocError("File must be under 8MB");
        setDocBusy(false);
        return;
      }
      const safe = docFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${profile.id}/docs/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("avatars").upload(path, docFile, { upsert: true, contentType: docFile.type || undefined });
      if (error) {
        setDocError(error.message);
        setDocBusy(false);
        return;
      }
      fileUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      fileName = docFile.name;
      type = docFile.type || fileType(docFile.name);
    }
    const payload = {
      title: docTitle.trim(),
      issuer: docIssuer.trim() || null,
      description: docNote.trim() || null,
      file_url: fileUrl,
      file_name: fileName,
      file_type: type,
      is_visible: true,
      user_id: profile.id,
    };
    if (editingDoc) {
      const { data, error } = await supabase.from("credentials").update(payload).eq("id", editingDoc).eq("user_id", profile.id).select().single();
      setDocBusy(false);
      if (error) {
        setDocError(error.message);
        return;
      }
      setDocs((prev) => prev.map((d) => (d.id === editingDoc ? (data as Credential) : d)));
      notify("Document updated");
    } else {
      const { data, error } = await supabase.from("credentials").insert({ ...payload, sort_order: docs.length }).select().single();
      setDocBusy(false);
      if (error) {
        setDocError(error.message);
        return;
      }
      setDocs((prev) => [...prev, data as Credential]);
      notify("Document added");
    }
    resetDoc();
  }
  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("credentials").delete().eq("id", id).eq("user_id", profile.id);
    if (error) {
      notify(error.message);
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== id));
    notify("Document deleted");
  }
  async function saveDocs() {
    setSaving("docs");
    const supabase = createClient();
    await supabase.from("profiles").update({ show_credentials: cvDownload }).eq("id", profile.id);
    await Promise.all(docs.map((d, i) => supabase.from("credentials").update({ sort_order: i }).eq("id", d.id).eq("user_id", profile.id)));
    setSaving(null);
    setSaved("docs");
    notify("Documents saved");
  }

  function moveWorkBy(index: number, direction: -1 | 1) {
    setWork((prev) => moveItem(prev, index, index + direction));
  }
  function moveEducationBy(index: number, direction: -1 | 1) {
    setEducation((prev) => moveItem(prev, index, index + direction));
  }
  function moveDocumentBy(index: number, direction: -1 | 1) {
    setDocs((prev) => moveItem(prev, index, index + direction));
  }

  return (
    <div className="profile-identity" data-theme={theme} data-collapsed={sideCollapsed ? "1" : "0"}>
      <OnboardingTour key={tourKey} force={tourKey > 0} />
      <header className="topbar">
        <Link className="back" href="/dashboard" aria-label="Back to dashboard"><Icon d="M15 5 8 12l7 7" size={18} /></Link>
        <Link className="brand" href="/" aria-label="Powfolio home"><SiteLogo /></Link>
      </header>
      <aside className={`side${sideCollapsed ? " collapsed" : ""}`}>
        <nav className="side-nav" aria-label="Profile sections">
          {TABS.map((item) => (
            <button key={item.id} className={`side-tab${tab === item.id ? " active" : ""}`} type="button" onClick={() => { setTab(item.id); history.replaceState(null, "", `#${item.id}`); }}>
              <Icon d={item.icon} size={16} />
              <span>{item.short}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-meta"><div className="side-handle" title={username}>@{username || "profile"}</div><div className="side-note">Profile workspace</div></div>
          <button className="side-collapse" type="button" aria-label={sideCollapsed ? "Expand sidebar" : "Minimize sidebar"} onClick={() => setSideCollapsed((v) => !v)}>
            <Icon d={sideCollapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} size={16} />
          </button>
        </div>
      </aside>

      <main className="shell">
        <section className="hero">
          <div className="eyebrow">Profile workspace</div>
          <div className="hero-row"><div><h1>Profile &amp; Identity</h1><p>Manage the identity that powers your public Powfolio. Keep your name, username, location, skills and professional background clear and consistent.</p></div></div>
        </section>
        <section className={`panel${tab === "identity" ? " active" : ""}`} role="tabpanel">
          <div className="section-intro"><h2>Identity</h2><p>The information visitors use to recognize you and understand what you do. Username and display name come from the account profile, while location is detected from device GPS.</p></div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Profile media</div><div className="block-desc">Your banner and avatar appear at the top of your public profile.</div></div></div>
            <div className="media-studio">
              <div className="banner" style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                {!bannerUrl && <div className="banner-label"><div className="banner-name">{displayName || "Your profile"}</div><div className="banner-role">WEB3 / CRYPTO PROFESSIONAL</div></div>}
              </div>
              <button className="banner-edit-badge" type="button" title="Change banner" onClick={() => setMediaSheet("banner")}><Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></button>
              <div className="avatar-center">
                <div className="avatar-preview-wrap">
                  <div className="avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</div>
                  <button className="avatar-edit-badge" type="button" title="Change avatar" onClick={() => setMediaSheet("avatar")}><Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></button>
                </div>
              </div>
            </div>
          </div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Basic information</div><div className="block-desc">Username and name identify the public page. The remaining fields are optional profile information.</div></div></div>
            <div className="grid2">
              <div className="field">
                <label className="label" htmlFor="username">Username</label>
                <div className={`username-row${nameStatus === "good" ? " status-good" : ""}${nameStatus === "bad" ? " status-bad" : ""}${shake ? " shake" : ""}`}>
                  <span className="username-prefix">{host}/</span>
                  <input className="input" id="username" autoComplete="off" spellCheck={false} maxLength={30} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/^@/, ""))} />
                </div>
                <div className={`username-status ${nameStatus === "good" ? "status-good" : nameStatus === "bad" ? "status-bad" : "status-checking"}`}><span className={`status-dot${nameStatus === "checking" ? " pulse" : ""}`} /><span>{nameMsg}</span></div>
              </div>
              <div className="field"><label className="label" htmlFor="displayName">Display name</label><input className="input" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name or professional name" autoComplete="name" /></div>
              <div className="field">
                <label className="label">Location</label>
                <div className="location"><div className="location-main"><span className="location-pin"><Icon d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M12 10.5a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5Z" /></span><div><div className="location-value">{locationLabel}</div><div className="location-note">Detected automatically using device GPS.</div></div></div><button className="action" type="button" disabled={detecting} onClick={() => void detectLocation()}>{detecting ? "Detecting..." : country ? "Update" : "Detect"}</button></div>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label className="label" htmlFor="shortBio">Short bio</label><textarea className="textarea" id="shortBio" maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A concise description of what you do and what you work on." /><div className="helper"><span>{bio.length}</span>/160{bioHasLink ? " · Links are not accepted here. Use Website." : ""}</div></div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label className="label" htmlFor="about">About</label><textarea className="textarea" id="about" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell the fuller story of your experience, focus and notable work." /></div>
            </div>
          </div>
          <div className="block">
            <div className="cv-row"><div className="cv-copy"><div className="block-title">Profile visibility</div><div className="block-desc">Your profile stays public. This switch only marks you open to opportunities.</div></div><button className={`switch${openWork ? " on" : ""}`} type="button" aria-label="Open to opportunities" onClick={() => setOpenWork((v) => !v)}><span /></button></div>
          </div>
          <div className="save-area"><button className="save" type="button" onClick={() => void saveIdentity()}>{saving === "identity" ? "Saving..." : "Save changes"}</button>{saved === "identity" && <span className="save-state">Saved</span>}</div>
        </section>

        <section className={`panel${tab === "skills" ? " active" : ""}`} role="tabpanel">
          <div className="section-intro"><h2>Skills &amp; Connections</h2><p>Add the skills already supported by your profile, then manage the social, contact and Web3 identities visitors can use to verify or reach you.</p></div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Skills</div><div className="block-desc">Keep the list focused. Add a skill with the button or press Enter on desktop and mobile.</div></div></div>
            <div className="add-row"><input className="input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Type a skill" autoComplete="off" /><button className="action accent" type="button" onClick={addSkill}>Add skill</button></div>
            <div className="skills">{skills.map((s) => <span className="chip" key={s.name}><span>{s.name}</span><button type="button" aria-label={`Remove ${s.name}`} onClick={() => setSkills((prev) => prev.filter((x) => x.name !== s.name))}>×</button></span>)}{skills.length === 0 && <span className="empty">No skills added yet.</span>}</div>
          </div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Social accounts</div><div className="block-desc">Connect the platforms already supported by Powfolio. Each connection keeps its own action and status.</div></div></div>
            <div className="connection-list">
              <Connection title="X" value={xUrl || (linkedProviders.includes("twitter") || linkedProviders.includes("x") ? "Connected" : "Not connected")} action={xUrl || linkedProviders.includes("twitter") || linkedProviders.includes("x") ? "Disconnect" : "Connect X"} onAction={() => xUrl || linkedProviders.includes("twitter") || linkedProviders.includes("x") ? void disconnectProvider("twitter") : void connectX()} icon="M18.2 2.2h3.3l-7.2 8.3 8.5 11.2h-5.4l-5.2-6.8-6 6.8H3.1l7.7-8.8L2.3 2.2h5.5l4.7 6.2Z" />
              <Connection title="GitHub" value={githubUrl || (linkedProviders.includes("github") ? "Connected" : "Not connected")} action={githubUrl || linkedProviders.includes("github") ? "Disconnect" : "Connect GitHub"} onAction={() => githubUrl || linkedProviders.includes("github") ? void disconnectProvider("github") : void connectGithub()} icon="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
              <Connection title="Telegram" value={telegramUrl || "Add your public Telegram handle"} action={telegramUrl ? "Edit" : "Add Telegram"} onAction={() => openEditor("telegram", telegramUrl)} icon="M21 4 3 11.2l6.2 2.1L17.5 7 11 14.2V20l3.2-3.6L18 19.5Z" />
              {editor === "telegram" && <Editor value={draft} onChange={setDraft} onSave={applyEditor} onCancel={() => setEditor(null)} placeholder="https://t.me/handle" />}
              <Connection title="Website" value={websiteUrl || "Add your personal or professional website"} action={websiteUrl ? "Edit" : "Add website"} onAction={() => openEditor("website", websiteUrl)} icon="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9ZM3 12h18M12 3c2.2 2.4 3.2 5.4 3.2 9s-1 6.6-3.2 9c-2.2-2.4-3.2-5.4-3.2-9s1-6.6 3.2-9Z" />
              {editor === "website" && <Editor value={draft} onChange={setDraft} onSave={applyEditor} onCancel={() => setEditor(null)} placeholder="https://example.com" />}
            </div>
          </div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Contact &amp; Web3 identity</div><div className="block-desc">Manage public email visibility, ENS and wallet connection without mixing account controls into the social list.</div></div></div>
            <div className="connection-list">
              <div className="email-settings">
                <div className="email-row">
                  <div className="connection-left"><div className="brand-icon"><Icon d="M3 5h18v14H3z M3 7l9 6 9-6" /></div><div><div className="conn-title">Primary email</div><div className="conn-value">{email || "No login email available"}</div></div></div>
                  <div className="email-visibility"><span>Public</span><button className={`switch${showPrimary ? " on" : ""}`} type="button" aria-label="Show primary email publicly" onClick={() => setShowPrimary((v) => !v)}><span /></button></div>
                </div>
                <div className="email-row">
                  <div className="brand-icon"><Icon d="M3 5h18v14H3z M3 7l9 6 9-6" /></div>
                  <div className="email-copy"><div className="conn-title">Second email</div><div className="conn-value">{googleEmail || secondaryEmail || "Connect Google for a second email"}</div></div>
                  <div className="email-visibility">{googleEmail || linkedProviders.includes("google") ? <button className="text-action" type="button" onClick={() => void disconnectProvider("google")}>Disconnect</button> : <button className="text-action" type="button" onClick={() => void connectGoogle()}>Connect Google</button>}<span>Public</span><button className={`switch${showSecondary ? " on" : ""}`} type="button" aria-label="Show second email publicly" onClick={() => setShowSecondary((v) => !v)}><span /></button></div>
                </div>
                <Connection title="ENS name" value={ensName || "Add an ENS name if one is connected to your identity."} action={ensName ? "Edit" : "Add ENS"} onAction={() => openEditor("ens", ensName)} icon="M4 8h16v10H4z M7 8V6a5 5 0 0 1 10 0v2" />
              {editor === "ens" && <Editor value={draft} onChange={setDraft} onSave={applyEditor} onCancel={() => setEditor(null)} placeholder="name.eth" />}
              <Connection title="Wallet" value={wallet || "No wallet connected"} mono action={wallet ? "Disconnect" : "Connect wallet"} onAction={() => wallet ? void disconnectWallet() : void connectWallet()} icon="M4 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13 M16 12h5" />
            </div>
          </div>
          <div className="save-area"><button className="save" type="button" onClick={() => void saveSkills()}>{saving === "skills" ? "Saving..." : "Save changes"}</button>{saved === "skills" && <span className="save-state">Saved</span>}</div>
          </div>
        </section>

        <section className={`panel${tab === "experience" ? " active" : ""}`} role="tabpanel">
          <div className="section-intro"><h2>Experience &amp; Education</h2><p>Use the same clean entry flow as the existing live manager. Add real roles and education, edit them later, or remove entries you no longer want to publish.</p></div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Work experience</div><div className="block-desc">Add as many roles as needed. Company or project link is required. Achievements show on your public page under each role.</div></div><button className="action accent" type="button" onClick={() => beginWork({ ...BLANK_WORK }, null)}>Add experience</button></div>
            <div className="entry-list">
              {work.length === 0 && <div className="empty">No work experience added yet.</div>}
              {work.map((item, i) => {
                const lines = achievementLines(item.achievements);
                return (
                <div key={item.id} className="entry" draggable onDragStart={() => setDragWork(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragWork === null || dragWork === i) return; setWork(moveItem(work, dragWork, i)); setDragWork(null); notify("Experience order updated"); }}>
                  <div className="entry-left"><button className="drag-handle" type="button" aria-label="Reorder experience"><Icon d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" /></button><span className="logo-preview sm">{item.logo_url ? <img src={item.logo_url} alt="" /> : item.company.slice(0,1)}</span><div><div className="entry-title">{item.company}</div><div className="entry-meta">{item.role} · {item.employment_type === "part-time" ? "Part-time" : "Full-time"} · {item.work_mode === "onsite" ? "Onsite" : "Remote"}{item.hours_per_day ? ` · ${item.hours_per_day}h/day` : ""} · {item.start_date}{item.end_date ? ` to ${item.end_date}` : " to Present"}</div>{item.url && <div className="entry-meta">{item.url}</div>}{item.description && <div className="entry-meta">{item.description}</div>}</div></div>
                  <div className="entry-actions">
                    <button className="small-action" type="button" onClick={() => editWork(item)}>Edit</button>
                    <button className="small-action danger-action" type="button" onClick={() => void persistExperience(work.filter((w) => w.id !== item.id), education)}>Remove</button>
                  </div>
                  {lines.length > 0 && (
                    <div className="entry-ach">
                      <div className="entry-ach-rule" />
                      <div className="entry-ach-label">Achievements</div>
                      <ul className="entry-ach-list">
                        {lines.map((line, ai) => (
                          <li key={`${item.id}-ach-${ai}`}>
                            <button type="button" className="entry-ach-btn" draggable={false} onClick={() => openSoloAchievement(item, ai)}>
                              <span aria-hidden>•</span>
                              <span>{line}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Education</div><div className="block-desc">Add institutions, degrees and study details already supported by the profile schema.</div></div><button className="action accent" type="button" onClick={openNewEdu}>Add education</button></div>
            <div className="entry-list">
              {education.length === 0 && <div className="empty">No education added yet.</div>}
              {education.map((item, i) => (
                <div key={item.id} className="entry" draggable onDragStart={() => setDragEdu(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragEdu === null || dragEdu === i) return; setEducation(moveItem(education, dragEdu, i)); setDragEdu(null); notify("Education order updated"); }}>
                  <div className="entry-left"><button className="drag-handle" type="button" aria-label="Reorder education"><Icon d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" /></button><span className="logo-preview sm">{item.logo_url ? <img src={item.logo_url} alt="" /> : item.institution.slice(0,1)}</span><div><div className="entry-title">{item.institution}</div><div className="entry-meta">{item.degree || "Program"}{item.field_of_study ? ` · ${item.field_of_study}` : ""}{item.start_year ? ` · ${item.start_year}` : ""}{item.end_year ? ` to ${item.end_year}` : ""}</div>{item.url && <div className="entry-meta">{item.url}</div>}{item.description && <div className="entry-meta">{item.description}</div>}</div></div>
                  <div className="entry-actions">
                    <button className="small-action" type="button" onClick={() => editEdu(item)}>Edit</button>
                    <button className="small-action danger-action" type="button" onClick={() => void persistExperience(work, education.filter((e) => e.id !== item.id))}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="save-area"><button className="save" type="button" onClick={() => void saveExperienceOrder()}>{saving === "experience" ? "Saving..." : "Save changes"}</button>{saved === "experience" && <span className="save-state">Saved</span>}</div>
        </section>

        <section className={`panel${tab === "docs" ? " active" : ""}`} role="tabpanel">
          <div className="section-intro"><h2>Docs &amp; Credentials</h2><p>Upload the supporting documents that already belong to Powfolio. Credentials stay viewable online, while public CV download is controlled separately.</p></div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Documents</div><div className="block-desc">Drag documents to change their public order. Edit changes the document metadata or lets the file be replaced. Delete removes the document.</div></div><button className="action accent" type="button" onClick={openNewDoc}>Upload document</button></div>
            <div className="doc-list">
              {docs.length === 0 && <div className="empty">No documents uploaded yet.</div>}
              {docs.map((d, i) => (
                <div key={d.id} className="doc" draggable onDragStart={() => setDragDoc(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragDoc === null || dragDoc === i) return; setDocs(moveItem(docs, dragDoc, i)); setDragDoc(null); notify("Document order updated"); }}>
                  <div className="doc-main"><button className="drag-handle" type="button" aria-label="Rearrange document"><Icon d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" /></button>{isImageFile(d.file_name, d.file_type) ? <img className="doc-thumb" src={d.file_url} alt="" /> : <span className="doc-file" aria-hidden>PDF</span>}<div className="doc-copy"><div className="doc-title">{d.title}</div><div className="doc-meta">{d.file_name || "Uploaded file"}{d.issuer ? ` · ${d.issuer}` : ""}</div></div></div>
                  <div className="doc-actions">
                    <a className="small-action" href={d.file_url} target="_blank" rel="noreferrer">View</a>
                    <button className="small-action" type="button" onClick={() => openEditDoc(d)}>Edit</button>
                    <button className="small-action danger-action" type="button" onClick={() => void deleteDoc(d.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="block">
            <div className="cv-row"><div className="cv-copy"><div className="cv-title">Allow public CV download</div><div className="cv-desc">Visitors can view published credentials online. This control decides whether the CV itself can also be downloaded.</div></div><button className={`switch${cvDownload ? " on" : ""}`} type="button" aria-label="Allow public CV download" onClick={() => setCvDownload((v) => !v)}><span /></button></div>
          </div>
          <div className="save-area"><button className="save" type="button" onClick={() => void saveDocs()}>{saving === "docs" ? "Saving..." : "Save changes"}</button>{saved === "docs" && <span className="save-state">Saved</span>}</div>
        </section>
        {tab === "cv" && <CvDetails userId={profile.id} initial={profile.cv_notes || null} />}
      </main>
      <button className={`tab-fab${dock === "open" ? " open" : ""}`} type="button" aria-label={dock === "open" ? "Close sections" : "Open sections"} onClick={() => { if (dock === "open") { setDock("closing"); window.setTimeout(() => setDock("closed"), 380); } else setDock("open"); }}>
        <svg className="burger" viewBox="0 0 24 18" width="22" height="16" aria-hidden>
          <rect x="1" y="1" width="22" height="3.2" rx="1.6" />
          <rect x="1" y="7.4" width="22" height="3.2" rx="1.6" />
          <rect x="1" y="13.8" width="22" height="3.2" rx="1.6" />
        </svg>
      </button>
      <div className={`tab-dock${dock === "open" ? " open" : ""}${dock === "closing" ? " closing" : ""}`}>
        {TABS.map((item, index) => (
          <button key={item.id} className={`dock-tab${tab === item.id ? " active" : ""}`} style={{ transitionDelay: `${index * 45}ms` }} type="button" onClick={() => { setTab(item.id); history.replaceState(null, "", `#${item.id}`); setDock("closing"); window.setTimeout(() => setDock("closed"), 380); }}>
            <Icon d={item.icon} size={16} />
            <span>{item.short}</span>
          </button>
        ))}
      </div>
      {dock !== "closed" && <button className="dock-backdrop" type="button" aria-label="Close sections" onClick={() => { setDock("closing"); window.setTimeout(() => setDock("closed"), 380); }} />}
      <div className={`toast${toastOn ? " show" : ""}`}>{toast}</div>
      <EntrySheet
        open={eduOpen && tab === "experience"}
        title={editingEdu ? "Edit education" : "Add education"}
        saveLabel={editingEdu ? "Update education" : "Add education"}
        dirty={eduOpen && JSON.stringify(eForm) !== eduBaseline.current}
        onClose={resetEdu}
        onSave={() => void saveEduItem()}
      >
        <div className="form-grid">
          <div className="field"><label className="label">Institution *</label><input className="input" value={eForm.institution} onChange={(e) => setEForm({ ...eForm, institution: e.target.value })} placeholder="Institution name" /></div>
          <div className="field"><label className="label">Degree</label><input className="input" value={eForm.degree} onChange={(e) => setEForm({ ...eForm, degree: e.target.value })} placeholder="Degree or program" /></div>
          <div className="field"><label className="label">Field of study</label><input className="input" value={eForm.field} onChange={(e) => setEForm({ ...eForm, field: e.target.value })} placeholder="Field of study" /></div>
          <div className="field"><label className="label">Country</label><input className="input" value={eForm.country} onChange={(e) => setEForm({ ...eForm, country: e.target.value })} placeholder="Country" /></div>
          <div className="field"><label className="label">Start year</label><input className="input" value={eForm.start} onChange={(e) => setEForm({ ...eForm, start: e.target.value })} placeholder="2024" inputMode="numeric" /></div>
          <div className="field"><label className="label">End year</label><input className="input" value={eForm.end} onChange={(e) => setEForm({ ...eForm, end: e.target.value })} placeholder="2028" inputMode="numeric" /></div>
          <div className="field full"><label className="label">School website</label><input className="input" value={eForm.url} onChange={(e) => setEForm({ ...eForm, url: e.target.value, logo: "" })} placeholder="https://school.edu" /></div>
          <div className="field full logo-field"><span className="logo-preview">{eForm.logo || siteLogo(absoluteUrl(eForm.url)) ? <img src={eForm.logo || siteLogo(absoluteUrl(eForm.url)) || ""} alt="" /> : "ED"}</span><label className="text-action">Upload school logo<input type="file" accept="image/*" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const url = await uploadLogo(file); if (url) setEForm((f) => ({ ...f, logo: url })); }} /></label><span className="logo-note">Use the school website to pull the logo. Upload one if you have no link.</span></div>
          <div className="field full"><label className="label">Description</label><textarea className="textarea" value={eForm.desc} onChange={(e) => setEForm({ ...eForm, desc: e.target.value })} placeholder="Optional context about the program." /></div>
        </div>
        {eduError && <div className="error">{eduError}</div>}
      </EntrySheet>
      <EntrySheet
        open={docOpen && tab === "docs"}
        title={editingDoc ? "Edit document" : "Add document"}
        saveLabel={editingDoc ? "Update document" : "Add document"}
        saving={docBusy}
        dirty={docOpen && (docFile !== null || docTitle !== docBaseline.current.title || docIssuer !== docBaseline.current.issuer || docNote !== docBaseline.current.note)}
        onClose={resetDoc}
        onSave={() => void saveDoc()}
      >
        <div className="form-grid">
          <div className="field full"><label className="label">File</label><input className="input" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={(e) => setDocFile(e.target.files?.[0] || null)} /></div>
          <div className="field"><label className="label">Title *</label><input className="input" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Resume or certificate title" /></div>
          <div className="field"><label className="label">Issuer</label><input className="input" value={docIssuer} onChange={(e) => setDocIssuer(e.target.value)} placeholder="University / organisation" /></div>
          <div className="field full"><label className="label">Note</label><input className="input" value={docNote} onChange={(e) => setDocNote(e.target.value)} placeholder="Optional short note" /></div>
        </div>
        {docError && <div className="error">{docError}</div>}
      </EntrySheet>
      {workOpen && (
        <div className="exp-modal" role="dialog" aria-modal="true" aria-labelledby="exp-modal-title">
          <button className="exp-modal-backdrop" type="button" aria-label="Close experience form" onClick={requestCloseWork} />
          <div className="exp-sheet">
            <header className="exp-sheet-head">
              <h3 id="exp-modal-title">{editingWork ? "Edit experience" : "Add experience"}</h3>
              <button className="exp-close" type="button" aria-label="Close" onClick={requestCloseWork}>×</button>
            </header>
            <div className="exp-sheet-body">
              <div className="form-grid">
                <div className="field"><label className="label">Company / project *</label><input className="input" value={wForm.company} onChange={(e) => setWForm({ ...wForm, company: e.target.value })} placeholder="Company or project name" /></div>
                <div className="field"><label className="label">Role *</label><input className="input" value={wForm.role} onChange={(e) => setWForm({ ...wForm, role: e.target.value })} placeholder="Your role" /></div>
                <div className="field full"><label className="label">Company / project link *</label><input className="input" value={wForm.url} onChange={(e) => setWForm({ ...wForm, url: e.target.value, logo: "" })} placeholder="https://project.com" /></div>
                <div className="field full logo-field"><span className="logo-preview">{wForm.logo || siteLogo(absoluteUrl(wForm.url)) ? <img src={wForm.logo || siteLogo(absoluteUrl(wForm.url)) || ""} alt="" /> : "Logo"}</span><label className="text-action">Replace logo<input type="file" accept="image/*" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const url = await uploadLogo(file); if (url) setWForm((f) => ({ ...f, logo: url })); }} /></label><span className="logo-note">The site logo is pulled from the link. Replace it if the image is wrong.</span></div>
                <div className="field full"><label className="label">Description</label><textarea className="textarea" value={wForm.desc} onChange={(e) => setWForm({ ...wForm, desc: e.target.value })} placeholder="What did you work on and what was your responsibility?" /></div>
                <div className="field"><label className="label">Employment type</label><select className="input" value={wForm.type} onChange={(e) => setWForm({ ...wForm, type: e.target.value })}><option>Full-time</option><option>Part-time</option></select></div>
                <div className="field"><label className="label">Workplace</label><div className="flex gap-2"><button type="button" className={`action ${wForm.mode === "remote" ? "accent" : ""}`} onClick={() => setWForm({ ...wForm, mode: "remote" })}>Remote</button><button type="button" className={`action ${wForm.mode === "onsite" ? "accent" : ""}`} onClick={() => setWForm({ ...wForm, mode: "onsite" })}>Onsite</button></div></div>
                <div className="field"><label className="label">Hours per day</label><input className="input" inputMode="decimal" value={wForm.hours} onChange={(e) => setWForm({ ...wForm, hours: e.target.value.replace(/[^0-9.]/g, "").slice(0, 4) })} placeholder="8" /></div>
                <div className="field"><label className="label">Start date *</label><input className="input" type="month" value={wForm.start} onChange={(e) => setWForm({ ...wForm, start: e.target.value })} /></div>
                <div className="field"><label className="label">End date</label><input className="input" type="month" value={wForm.end} onChange={(e) => setWForm({ ...wForm, end: e.target.value })} /></div>
                <div className="field full ach-field">
                  <div className="ach-head">
                    <label className="label">Achievements</label>
                    <button className="action accent" type="button" onClick={() => openAchievement(-1)}>+ Add achievement</button>
                  </div>
                  {achievementLines(wForm.achievements).length === 0 ? (
                    <p className="ach-empty">No achievements yet. Add one result at a time.</p>
                  ) : (
                    <ul className="ach-list">
                      {achievementLines(wForm.achievements).map((line, index) => (
                        <li key={`draft-ach-${index}`} className="ach-row">
                          <button type="button" className="ach-item" onClick={() => openAchievement(index)}>
                            <span className="ach-dot" aria-hidden>•</span>
                            <span>{line}</span>
                          </button>
                          <button type="button" className="ach-x" aria-label="Remove achievement" onClick={() => removeAchievement(index)}>×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {expError && <div className="error">{expError}</div>}
            </div>
            <footer className="exp-sheet-foot">
              <button className="exp-submit" type="button" disabled={workBusy} onClick={() => void saveWorkItem()}>{workBusy ? "Saving..." : editingWork ? "Save changes" : "Add experience"}</button>
            </footer>
          </div>
          {achieveEditor && (
            <div className="ach-editor" role="dialog" aria-modal="true" aria-labelledby="ach-editor-title">
              <button className="exp-modal-backdrop" type="button" aria-label="Close achievement editor" onClick={requestCloseAchievement} />
              <div className="ach-card">
                <header className="exp-sheet-head">
                  <h3 id="ach-editor-title">{achieveEditor.index >= 0 ? "Edit achievement" : "Add achievement"}</h3>
                  <button className="exp-close" type="button" aria-label="Close" onClick={requestCloseAchievement}>×</button>
                </header>
                <div className="ach-card-body">
                  <label className="label" htmlFor="achievement-draft">Achievement</label>
                  <textarea id="achievement-draft" className="textarea" value={achieveEditor.draft} onChange={(e) => setAchieveEditor({ ...achieveEditor, draft: e.target.value })} placeholder="Increased Discord engagement by 45% through structured campaigns." autoFocus />
                </div>
                <footer className="exp-sheet-foot">
                  <button className="exp-submit" type="button" onClick={saveAchievement} disabled={!achieveEditor.draft.trim()}>Save achievement</button>
                </footer>
              </div>
            </div>
          )}
          {discardScope && (
            <div className="discard-layer" role="dialog" aria-modal="true" aria-labelledby="discard-title">
              <div className="discard-card">
                <h3 id="discard-title">Discard changes?</h3>
                <p>You have unsaved changes. Are you sure you want to close?</p>
                <div className="discard-actions">
                  <button className="action" type="button" onClick={() => setDiscardScope(null)}>Keep editing</button>
                  <button className="action danger-action" type="button" onClick={confirmDiscard}>Discard</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {solo && (
        <div className="ach-editor" role="dialog" aria-modal="true" aria-labelledby="solo-ach-title">
          <button className="exp-modal-backdrop" type="button" aria-label="Close achievement editor" onClick={requestCloseSolo} />
          <div className="ach-card">
            <header className="exp-sheet-head">
              <h3 id="solo-ach-title">Edit achievement</h3>
              <button className="exp-close" type="button" aria-label="Close" onClick={requestCloseSolo}>×</button>
            </header>
            <div className="ach-card-body">
              <label className="label" htmlFor="solo-achievement-draft">Achievement</label>
              <textarea id="solo-achievement-draft" className="textarea" value={solo.draft} onChange={(e) => setSolo({ ...solo, draft: e.target.value })} placeholder="What did this role accomplish?" autoFocus />
            </div>
            <footer className="exp-sheet-foot">
              <button className="exp-submit" type="button" onClick={() => void saveSoloAchievement()} disabled={soloBusy || !solo.draft.trim()}>{soloBusy ? "Saving..." : "Save achievement"}</button>
            </footer>
          </div>
          {soloDiscard && (
            <div className="discard-layer" role="dialog" aria-modal="true" aria-labelledby="solo-discard-title">
              <div className="discard-card">
                <h3 id="solo-discard-title">Discard changes?</h3>
                <p>You have unsaved changes. Are you sure you want to close?</p>
                <div className="discard-actions">
                  <button className="action" type="button" onClick={() => setSoloDiscard(false)}>Keep editing</button>
                  <button className="action danger-action" type="button" onClick={() => { setSolo(null); setSoloDiscard(false); }}>Discard</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {mediaSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setMediaSheet(null)}>
          <div className="w-full max-w-md rounded-t-2xl bg-background p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <label className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-sm">
              <span>Choose photo</span>
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (mediaSheet === "avatar") void onAvatar(f); else void onBanner(f); } setMediaSheet(null); }} />
            </label>
            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-sm text-red-400" onClick={() => { if (mediaSheet === "avatar") { setAvatarUrl(null); void createClient().from("profiles").update({ avatar_url: null }).eq("id", profile.id); } else { setBannerUrl(null); void createClient().from("profiles").update({ banner_url: null }).eq("id", profile.id); } setMediaSheet(null); notify(mediaSheet === "avatar" ? "Profile photo removed" : "Banner removed"); }}>
              {mediaSheet === "avatar" ? "Remove profile picture" : "Remove banner"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Connection({ title, value, action, onAction, icon, mono }: { title: string; value: string; action: string; onAction: () => void; icon: string; mono?: boolean }) {
  return (
    <div className="connection">
      <div className="connection-left"><div className="brand-icon"><Icon d={icon} /></div><div><div className="conn-title">{title}</div><div className={`conn-value${mono ? " wallet" : ""}`}>{value}</div></div></div>
      <div className="connection-actions"><button className="small-action" type="button" onClick={onAction}>{action}</button></div>
    </div>
  );
}
function Editor({ value, onChange, onSave, onCancel, placeholder }: { value: string; onChange: (v: string) => void; onSave: () => void; onCancel: () => void; placeholder: string }) {
  return (
    <div className="conn-editor">
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button className="action accent" type="button" onClick={onSave}>Apply</button>
      <button className="action" type="button" onClick={onCancel}>Cancel</button>
    </div>
  );
}
