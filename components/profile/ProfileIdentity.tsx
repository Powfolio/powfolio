"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { connectEthereumWallet } from "@/lib/wallet";
import { startXAuth } from "@/lib/x-oauth";
import { SITE_URL } from "@/lib/site";
import { isReservedUsername, reservedUsernameMessage } from "@/lib/usernames";
import DeleteAccount from "@/components/profile/DeleteAccount";
import OnboardingTour, { resetOnboarding } from "@/components/onboarding/OnboardingTour";
import type { Credential, Education, Profile, Skill, WorkExperience } from "@/types/database";

type TabId = "identity" | "skills" | "experience" | "docs";
type Props = {
  profile: Profile;
  email: string | null;
  credentials: Credential[];
};

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
function normalizeSkills(raw: Profile["skills"]): Skill[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (typeof s === "string") return { name: s.trim().slice(0, 60), description: "" };
      if (s && typeof s === "object" && "name" in s) return { name: String(s.name || "").slice(0, 60), description: String(s.description || "").slice(0, 250) };
      return { name: "", description: "" };
    })
    .filter((s) => s.name);
}
function fileType(name: string) {
  return (name.split(".").pop() || "FILE").toUpperCase().slice(0, 5);
}

function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function ProfileIdentity({ profile, email, credentials }: Props) {
  const router = useRouter();
  const host = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const publicUrl = `${SITE_URL.replace(/\/$/, "")}/${profile.username}`;
  const [tab, setTab] = useState<TabId>("identity");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  const [username, setUsername] = useState(profile.username || "");
  const [nameStatus, setNameStatus] = useState<"checking" | "good" | "bad">("checking");
  const [nameMsg, setNameMsg] = useState("Username availability will appear here");
  const [shake, setShake] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [headline, setHeadline] = useState("");
  const [region, setRegion] = useState(profile.location_region || "");
  const [country, setCountry] = useState(profile.location_country || "");
  const [detecting, setDetecting] = useState(false);
  const [bio, setBio] = useState(profile.bio || "");
  const [about, setAbout] = useState(profile.long_bio || "");
  const [openWork, setOpenWork] = useState(profile.open_to_work ?? false);
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
  const [showPrimary, setShowPrimary] = useState(profile.show_primary_email ?? false);
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
  const [wForm, setWForm] = useState({ company: "", role: "", url: "", desc: "", type: "Full-time", start: "", end: "" });
  const [eForm, setEForm] = useState({ institution: "", degree: "", field: "", country: "", start: "", end: "", url: "", desc: "" });
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
    const savedHeadline = localStorage.getItem(`pow3folio_headline_${profile.id}`) || "";
    if (savedHeadline) setHeadline(savedHeadline);
    const hash = window.location.hash.replace("#", "") as TabId;
    if (["identity", "skills", "experience", "docs"].includes(hash)) setTab(hash);
  }, [profile.id]);

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

  function setThemeValue(next: "dark" | "light") {
    setTheme(next);
    localStorage.setItem("pow3folio-theme", next);
    localStorage.setItem("color-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.dataset.theme = next;
  }

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
    if (url) {
      setAvatarUrl(url);
      notify("Avatar uploaded. Save identity to keep it.");
    }
    setUploadingAvatar(false);
  }
  async function onBanner(file?: File) {
    if (!file) return;
    setUploadingBanner(true);
    const url = await uploadImage(file, "banner");
    if (url) {
      setBannerUrl(url);
      notify("Banner uploaded. Save identity to keep it.");
    }
    setUploadingBanner(false);
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
    localStorage.setItem(`pow3folio_headline_${profile.id}`, headline.trim());
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
      notify("Wallet connected. Save skills & connections to keep it.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Wallet connection failed");
    }
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
    setWForm({ company: "", role: "", url: "", desc: "", type: "Full-time", start: "", end: "" });
    setEditingWork(null);
    setExpError("");
    setWorkOpen(false);
  }
  async function saveWorkItem() {
    if (!wForm.company.trim() || !wForm.role.trim() || !wForm.url.trim() || !wForm.start) {
      setExpError("Company, role, company link and start date are required.");
      return;
    }
    if (!editingWork && work.length >= 5) {
      setExpError("Maximum of 5 work experiences.");
      return;
    }
    const item: WorkExperience = {
      id: editingWork || uid(),
      company: wForm.company.trim(),
      role: wForm.role.trim(),
      url: absoluteUrl(wForm.url),
      description: wForm.desc.trim() || null,
      employment_type: wForm.type === "Part-time" ? "part-time" : "full-time",
      start_date: wForm.start,
      end_date: wForm.end || null,
    };
    const next = editingWork ? work.map((w) => (w.id === editingWork ? item : w)) : [...work, item];
    const ok = await persistExperience(next, education);
    if (ok) {
      resetWork();
      notify(editingWork ? "Experience updated" : "Experience added");
    }
  }
  function editWork(item: WorkExperience) {
    setEditingWork(item.id);
    setWForm({
      company: item.company,
      role: item.role,
      url: item.url || "",
      desc: item.description || "",
      type: item.employment_type === "part-time" ? "Part-time" : "Full-time",
      start: item.start_date || "",
      end: item.end_date || "",
    });
    setWorkOpen(true);
  }

  function resetEdu() {
    setEForm({ institution: "", degree: "", field: "", country: "", start: "", end: "", url: "", desc: "" });
    setEditingEdu(null);
    setEduError("");
    setEduOpen(false);
  }
  async function saveEduItem() {
    if (!eForm.institution.trim()) {
      setEduError("Institution is required.");
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
      url: absoluteUrl(eForm.url),
      description: eForm.desc.trim() || null,
    };
    const next = editingEdu ? education.map((e) => (e.id === editingEdu ? item : e)) : [...education, item];
    const ok = await persistExperience(work, next);
    if (ok) {
      resetEdu();
      notify(editingEdu ? "Education updated" : "Education added");
    }
  }
  function editEdu(item: Education) {
    setEditingEdu(item.id);
    setEForm({
      institution: item.institution,
      degree: item.degree || "",
      field: item.field_of_study || "",
      country: item.country || "",
      start: item.start_year || "",
      end: item.end_year || "",
      url: item.url || "",
      desc: item.description || "",
    });
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

  function signOut() {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/auth/signout";
    document.body.appendChild(form);
    form.submit();
  }

  function move<T>(list: T[], from: number, to: number) {
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  return (
    <div className="profile-identity" data-theme={theme}>
      <OnboardingTour key={tourKey} force={tourKey > 0} />
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Powfolio home"><span className="brand-mark">P</span><span className="brand-name">Powfolio</span></Link>
        <div className="top-actions">
          <button className="top-icon" aria-label="Switch theme" title="Switch theme" onClick={() => setThemeValue(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Icon d="M12 3v1m0 16v1M4.2 4.2l.7.7M19.1 19.1l.7.7M3 12h1m16 0h1M4.2 19.8l.7-.7M19.1 4.9l.7-.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" /> : <Icon d="M20.4 15.4A9 9 0 0 1 8.6 3.6 9 9 0 1 0 20.4 15.4Z" />}
          </button>
          <button className={`avatar-btn${menuOpen ? " active" : ""}`} aria-label="Account menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <Icon d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
          </button>
        </div>
      </header>
      <div className={`menu-backdrop${menuOpen ? " show" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`account-menu${menuOpen ? " open" : ""}`}>
        <Link className="menu-row" href="/dashboard/resume" onClick={() => setMenuOpen(false)}><Icon d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /><span>Download Powfolio</span></Link>
        <div className="menu-row-link">
          <a className="menu-link-text" href={publicUrl} target="_blank" rel="noreferrer"><Icon d="M14 5h5v5M19 5l-9 9M9 5H5v14h14v-4" /><span>Profile Link</span></a>
          <button className="menu-copy-btn" aria-label="Copy public link" onClick={async () => { try { await navigator.clipboard.writeText(publicUrl); notify("Public profile link copied"); } catch { notify("Copy failed"); } }}><Icon d="M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></button>
        </div>
        <button className="menu-row" onClick={() => { resetOnboarding(); setTourKey((k) => k + 1); setMenuOpen(false); notify("Starting the Powfolio tour"); }}><Icon d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" /><span>Replay Tour</span></button>
        <button className="menu-row" onClick={signOut}><Icon d="M9 6H5v12h4M10 12h10M16 8l4 4-4 4" /><span>Sign out</span></button>
        <div className="menu-divider" />
        <button className="menu-row danger" onClick={() => { setShowDelete(true); setMenuOpen(false); }}><Icon d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13" /><span>Delete account</span></button>
      </div>

      <main className="shell">
        <section className="hero">
          <div className="eyebrow">Profile workspace</div>
          <div className="hero-row"><div><h1>Profile &amp; Identity</h1><p>Manage the identity that powers your public Powfolio. Keep your name, username, location, skills and professional background clear and consistent.</p></div></div>
        </section>
        <nav className="tabs" role="tablist" aria-label="Profile sections">
          {([["identity", "Identity"], ["skills", "Skills & Connections"], ["experience", "Experience & Education"], ["docs", "Docs & Credentials"]] as [TabId, string][]).map(([id, label]) => (
            <button key={id} className={`tab${tab === id ? " active" : ""}`} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); history.replaceState(null, "", `#${id}`); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{label}</button>
          ))}
        </nav>

        <section className={`panel${tab === "identity" ? " active" : ""}`} role="tabpanel">
          <div className="section-intro"><h2>Identity</h2><p>The information visitors use to recognize you and understand what you do. Username and display name come from the account profile, while location is detected from device GPS.</p></div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Profile media</div><div className="block-desc">Your banner and avatar appear at the top of your public profile.</div></div></div>
            <div className="media-grid">
              <div className="banner" style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                {!bannerUrl && <div className="banner-label"><div className="banner-name">{displayName || "Your profile"}</div><div className="banner-role">{headline || "Public identity"}</div></div>}
                <label className="action media-action">{uploadingBanner ? "Uploading..." : "Change banner"}<input type="file" accept="image/*" hidden onChange={(e) => void onBanner(e.target.files?.[0])} /></label>
              </div>
              <div className="avatar-card">
                <div className="avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</div>
                <div className="avatar-note">Use a clear square image for your public profile.</div>
                <label className="action" style={{ width: "100%" }}>{uploadingAvatar ? "Uploading..." : "Change avatar"}<input type="file" accept="image/*" hidden onChange={(e) => void onAvatar(e.target.files?.[0])} /></label>
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
              <div className="field"><label className="label" htmlFor="headline">Headline</label><input className="input" id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Your role, focus or professional headline" /></div>
              <div className="field">
                <label className="label">Location</label>
                <div className="location"><div className="location-main"><span className="location-pin"><Icon d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M12 10.5a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5Z" /></span><div><div className="location-value">{locationLabel}</div><div className="location-note">Detected automatically using device GPS.</div></div></div><button className="action" type="button" disabled={detecting} onClick={() => void detectLocation()}>{detecting ? "Detecting..." : country ? "Update" : "Detect"}</button></div>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label className="label" htmlFor="shortBio">Short bio</label><textarea className="textarea" id="shortBio" maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A concise description of what you do and what you work on." /><div className="helper"><span>{bio.length}</span>/160{bioHasLink ? " · Links are not accepted here. Use Website." : ""}</div></div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label className="label" htmlFor="about">About</label><textarea className="textarea" id="about" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell the fuller story of your experience, focus and notable work." /></div>
            </div>
          </div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Profile visibility</div><div className="block-desc">Your profile remains public. Use this control for the existing open-to-work signal.</div></div><button className={`switch${openWork ? " on" : ""}`} type="button" aria-label="Open to opportunities" onClick={() => setOpenWork((v) => !v)}><span /></button></div>
          </div>
          <div className="save-area"><button className="save" type="button" onClick={() => void saveIdentity()}>{saving === "identity" ? "Saving..." : "Save changes"}</button>{saved === "identity" && <span className="save-state">Saved</span>}</div>
        </section>

        <section className={`panel${tab === "skills" ? " active" : ""}`} role="tabpanel">
          <div className="section-intro"><h2>Skills &amp; Connections</h2><p>Add the skills already supported by your profile, then manage the social, contact and Web3 identities visitors can use to verify or reach you.</p></div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Skills</div><div className="block-desc">Keep the list focused. Add a skill with the button or press Enter on desktop and mobile.</div></div></div>
            <div className="add-row"><input className="input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Type a skill" autoComplete="off" /><button className="action accent" type="button" onClick={addSkill}>Add skill</button></div>
            <div className="skills">{skills.map((s) => <span className="chip" key={s.name}><span>{s.name}</span><button type="button" aria-label={`Remove ${s.name}`} onClick={() => setSkills((prev) => prev.filter((x) => x.name !== s.name))}>×</button></span>)}</div>
          </div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Social accounts</div><div className="block-desc">Connect the platforms already supported by Powfolio. Each connection keeps its own action and status.</div></div><button className="action accent" type="button" onClick={() => notify("Connection options are already listed below")}>Add connection</button></div>
            <div className="connection-list">
              <Connection title="X" value={xUrl || "Not connected"} action={xUrl ? "Edit" : "Connect X"} onAction={() => xUrl ? openEditor("x", xUrl) : void connectX()} icon="M18.2 2.2h3.3l-7.2 8.3 8.5 11.2h-5.4l-5.2-6.8-6 6.8H3.1l7.7-8.8L2.3 2.2h5.5l4.7 6.2Z" />
              {editor === "x" && <Editor value={draft} onChange={setDraft} onSave={applyEditor} onCancel={() => setEditor(null)} placeholder="https://x.com/handle" />}
              <Connection title="GitHub" value={githubUrl || "Not connected"} action={githubUrl ? "Edit" : "Connect GitHub"} onAction={() => githubUrl ? openEditor("github", githubUrl) : void connectGithub()} icon="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
              {editor === "github" && <Editor value={draft} onChange={setDraft} onSave={applyEditor} onCancel={() => setEditor(null)} placeholder="https://github.com/handle" />}
              <Connection title="Telegram" value={telegramUrl || "Add your public Telegram handle"} action={telegramUrl ? "Edit" : "Add Telegram"} onAction={() => openEditor("telegram", telegramUrl)} icon="M21 4 3 11.2l6.2 2.1L17.5 7 11 14.2V20l3.2-3.6L18 19.5Z" />
              {editor === "telegram" && <Editor value={draft} onChange={setDraft} onSave={applyEditor} onCancel={() => setEditor(null)} placeholder="https://t.me/handle" />}
              <Connection title="Website" value={websiteUrl || "Add your personal or professional website"} action={websiteUrl ? "Edit" : "Add website"} onAction={() => openEditor("website", websiteUrl)} icon="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9ZM3 12h18M12 3c2.2 2.4 3.2 5.4 3.2 9s-1 6.6-3.2 9c-2.2-2.4-3.2-5.4-3.2-9s1-6.6 3.2-9Z" />
              {editor === "website" && <Editor value={draft} onChange={setDraft} onSave={applyEditor} onCancel={() => setEditor(null)} placeholder="https://example.com" />}
            </div>
          </div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Contact &amp; Web3 identity</div><div className="block-desc">Manage public email visibility, ENS and wallet connection without mixing account controls into the social list.</div></div></div>
            <div className="connection-list">
              <Connection title="Primary email" value={email || "Login email. At least one email can remain public."} action="Edit" onAction={() => openEditor("email", secondaryEmail)} icon="M3 5h18v14H3z M3 7l9 6 9-6" />
              {editor === "email" && (
                <div className="conn-editor">
                  <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Second email, optional" />
                  <button className={`switch${showPrimary ? " on" : ""}`} type="button" aria-label="Show primary email" onClick={() => setShowPrimary((v) => !v)}><span /></button>
                  <button className={`switch${showSecondary ? " on" : ""}`} type="button" aria-label="Show second email" onClick={() => setShowSecondary((v) => !v)}><span /></button>
                  <button className="action accent" type="button" onClick={applyEditor}>Apply</button>
                </div>
              )}
              <Connection title="ENS name" value={ensName || "Add an ENS name if one is connected to your identity."} action={ensName ? "Edit" : "Add ENS"} onAction={() => openEditor("ens", ensName)} icon="M4 8h16v10H4z M7 8V6a5 5 0 0 1 10 0v2" />
              {editor === "ens" && <Editor value={draft} onChange={setDraft} onSave={applyEditor} onCancel={() => setEditor(null)} placeholder="name.eth" />}
              <Connection title="Wallet" value={wallet || "No wallet connected"} mono action={wallet ? "Edit" : "Connect wallet"} onAction={() => wallet ? openEditor("wallet", wallet) : void connectWallet()} icon="M4 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13 M16 12h5" />
              {editor === "wallet" && <Editor value={draft} onChange={setDraft} onSave={() => { setWallet(draft.trim()); setEditor(null); }} onCancel={() => setEditor(null)} placeholder="0x…" />}
            </div>
          </div>
          <div className="save-area"><button className="save" type="button" onClick={() => void saveSkills()}>{saving === "skills" ? "Saving..." : "Save changes"}</button>{saved === "skills" && <span className="save-state">Saved</span>}</div>
        </section>

        <section className={`panel${tab === "experience" ? " active" : ""}`} role="tabpanel">
          <div className="section-intro"><h2>Experience &amp; Education</h2><p>Use the same clean entry flow as the existing live manager. Add real roles and education, edit them later, or remove entries you no longer want to publish.</p></div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Work experience</div><div className="block-desc">Up to 5 entries. Company or project link is required by the existing profile logic.</div></div><button className="action accent" type="button" onClick={() => { resetWork(); setWorkOpen(true); }}>Add experience</button></div>
            <div className="entry-list">
              {work.length === 0 && <div className="empty">No work experience added yet.</div>}
              {work.map((item, i) => (
                <div key={item.id} className="entry" draggable onDragStart={() => setDragWork(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragWork === null || dragWork === i) return; setWork(move(work, dragWork, i)); setDragWork(null); notify("Experience order updated"); }}>
                  <div className="entry-left"><button className="drag-handle" type="button" aria-label="Reorder experience"><Icon d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" /></button><div className="brand-icon">{String(i + 1).padStart(2, "0")}</div><div><div className="entry-title">{item.company}</div><div className="entry-meta">{item.role} · {item.employment_type === "part-time" ? "Part-time" : "Full-time"} · {item.start_date}{item.end_date ? ` to ${item.end_date}` : " to Present"}</div>{item.url && <div className="entry-meta">{item.url}</div>}{item.description && <div className="entry-meta">{item.description}</div>}</div></div>
                  <div className="entry-actions"><button className="small-action" type="button" onClick={() => editWork(item)}>Edit</button><button className="small-action" type="button" onClick={() => void persistExperience(work.filter((w) => w.id !== item.id), education)}>Remove</button></div>
                </div>
              ))}
            </div>
            <div className={`entry-form${workOpen ? " open" : ""}`}>
              <div className="form-grid">
                <div className="field"><label className="label">Company / project *</label><input className="input" value={wForm.company} onChange={(e) => setWForm({ ...wForm, company: e.target.value })} placeholder="Company or project name" /></div>
                <div className="field"><label className="label">Role *</label><input className="input" value={wForm.role} onChange={(e) => setWForm({ ...wForm, role: e.target.value })} placeholder="Your role" /></div>
                <div className="field full"><label className="label">Company / project link *</label><input className="input" value={wForm.url} onChange={(e) => setWForm({ ...wForm, url: e.target.value })} placeholder="https://example.com" /></div>
                <div className="field full"><label className="label">Description</label><textarea className="textarea" value={wForm.desc} onChange={(e) => setWForm({ ...wForm, desc: e.target.value })} placeholder="What did you work on and what was your responsibility?" /></div>
                <div className="field"><label className="label">Employment type</label><select className="input" value={wForm.type} onChange={(e) => setWForm({ ...wForm, type: e.target.value })}><option>Full-time</option><option>Part-time</option></select></div>
                <div className="field"><label className="label">Start date *</label><input className="input" type="month" value={wForm.start} onChange={(e) => setWForm({ ...wForm, start: e.target.value })} /></div>
                <div className="field"><label className="label">End date</label><input className="input" type="month" value={wForm.end} onChange={(e) => setWForm({ ...wForm, end: e.target.value })} /></div>
              </div>
              {expError && <div className="error">{expError}</div>}
              <div className="form-actions"><button className="action accent" type="button" onClick={() => void saveWorkItem()}>{editingWork ? "Update experience" : "Add experience"}</button><button className="action" type="button" onClick={resetWork}>Cancel</button></div>
            </div>
          </div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Education</div><div className="block-desc">Add institutions, degrees and study details already supported by the profile schema.</div></div><button className="action accent" type="button" onClick={() => { resetEdu(); setEduOpen(true); }}>Add education</button></div>
            <div className="entry-list">
              {education.length === 0 && <div className="empty">No education added yet.</div>}
              {education.map((item, i) => (
                <div key={item.id} className="entry" draggable onDragStart={() => setDragEdu(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragEdu === null || dragEdu === i) return; setEducation(move(education, dragEdu, i)); setDragEdu(null); notify("Education order updated"); }}>
                  <div className="entry-left"><button className="drag-handle" type="button" aria-label="Reorder education"><Icon d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" /></button><div className="brand-icon">ED</div><div><div className="entry-title">{item.institution}</div><div className="entry-meta">{item.degree || "Program"}{item.field_of_study ? ` · ${item.field_of_study}` : ""}{item.start_year ? ` · ${item.start_year}` : ""}{item.end_year ? ` to ${item.end_year}` : ""}</div>{item.url && <div className="entry-meta">{item.url}</div>}{item.description && <div className="entry-meta">{item.description}</div>}</div></div>
                  <div className="entry-actions"><button className="small-action" type="button" onClick={() => editEdu(item)}>Edit</button><button className="small-action" type="button" onClick={() => void persistExperience(work, education.filter((e) => e.id !== item.id))}>Remove</button></div>
                </div>
              ))}
            </div>
            <div className={`entry-form${eduOpen ? " open" : ""}`}>
              <div className="form-grid">
                <div className="field"><label className="label">Institution *</label><input className="input" value={eForm.institution} onChange={(e) => setEForm({ ...eForm, institution: e.target.value })} placeholder="Institution name" /></div>
                <div className="field"><label className="label">Degree</label><input className="input" value={eForm.degree} onChange={(e) => setEForm({ ...eForm, degree: e.target.value })} placeholder="Degree or program" /></div>
                <div className="field"><label className="label">Field of study</label><input className="input" value={eForm.field} onChange={(e) => setEForm({ ...eForm, field: e.target.value })} placeholder="Field of study" /></div>
                <div className="field"><label className="label">Country</label><input className="input" value={eForm.country} onChange={(e) => setEForm({ ...eForm, country: e.target.value })} placeholder="Country" /></div>
                <div className="field"><label className="label">Start year</label><input className="input" value={eForm.start} onChange={(e) => setEForm({ ...eForm, start: e.target.value })} placeholder="2024" inputMode="numeric" /></div>
                <div className="field"><label className="label">End year</label><input className="input" value={eForm.end} onChange={(e) => setEForm({ ...eForm, end: e.target.value })} placeholder="2028" inputMode="numeric" /></div>
                <div className="field full"><label className="label">Institution link</label><input className="input" value={eForm.url} onChange={(e) => setEForm({ ...eForm, url: e.target.value })} placeholder="https://example.com" /></div>
                <div className="field full"><label className="label">Description</label><textarea className="textarea" value={eForm.desc} onChange={(e) => setEForm({ ...eForm, desc: e.target.value })} placeholder="Optional context about the program." /></div>
              </div>
              {eduError && <div className="error">{eduError}</div>}
              <div className="form-actions"><button className="action accent" type="button" onClick={() => void saveEduItem()}>{editingEdu ? "Update education" : "Add education"}</button><button className="action" type="button" onClick={resetEdu}>Cancel</button></div>
            </div>
          </div>
          <div className="save-area"><button className="save" type="button" onClick={() => void saveExperienceOrder()}>{saving === "experience" ? "Saving..." : "Save changes"}</button>{saved === "experience" && <span className="save-state">Saved</span>}</div>
        </section>

        <section className={`panel${tab === "docs" ? " active" : ""}`} role="tabpanel">
          <div className="section-intro"><h2>Docs &amp; Credentials</h2><p>Upload the supporting documents that already belong to Powfolio. Credentials stay viewable online, while public CV download is controlled separately.</p></div>
          <div className="block">
            <div className="block-head"><div><div className="block-title">Documents</div><div className="block-desc">Drag documents to change their public order. Edit changes the document metadata or lets the file be replaced. Delete removes the document.</div></div><button className="action accent" type="button" onClick={() => { resetDoc(); setDocOpen(true); }}>Upload document</button></div>
            <div className="doc-list">
              {docs.length === 0 && <div className="empty">No documents uploaded yet.</div>}
              {docs.map((d, i) => (
                <div key={d.id} className="doc" draggable onDragStart={() => setDragDoc(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragDoc === null || dragDoc === i) return; setDocs(move(docs, dragDoc, i)); setDragDoc(null); notify("Document order updated"); }}>
                  <div className="doc-main"><button className="drag-handle" type="button" aria-label="Rearrange document"><Icon d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" /></button><div className="doc-type">{fileType(d.file_name || d.file_type || "FILE")}</div><div><div className="doc-title">{d.title}</div><div className="doc-meta">{d.file_name || "Uploaded file"}{d.issuer ? ` · ${d.issuer}` : ""} · View online</div></div></div>
                  <div className="doc-actions"><a className="small-action" href={d.file_url} target="_blank" rel="noreferrer">View</a><button className="small-action" type="button" onClick={() => { setEditingDoc(d.id); setDocTitle(d.title); setDocIssuer(d.issuer || ""); setDocNote(d.description || ""); setDocOpen(true); }}>Edit</button><button className="small-action" type="button" onClick={() => void deleteDoc(d.id)}>Delete</button></div>
                </div>
              ))}
            </div>
            <div className={`doc-form${docOpen ? " open" : ""}`}>
              <div className="form-grid">
                <div className="field full"><label className="label">File</label><input className="input" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={(e) => setDocFile(e.target.files?.[0] || null)} /></div>
                <div className="field"><label className="label">Title *</label><input className="input" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Resume or certificate title" /></div>
                <div className="field"><label className="label">Issuer</label><input className="input" value={docIssuer} onChange={(e) => setDocIssuer(e.target.value)} placeholder="University / organisation" /></div>
                <div className="field full"><label className="label">Note</label><input className="input" value={docNote} onChange={(e) => setDocNote(e.target.value)} placeholder="Optional short note" /></div>
              </div>
              {docError && <div className="error">{docError}</div>}
              <div className="form-actions"><button className="action accent" type="button" disabled={docBusy} onClick={() => void saveDoc()}>{docBusy ? "Saving..." : editingDoc ? "Update document" : "Add document"}</button><button className="action" type="button" onClick={resetDoc}>Cancel</button></div>
            </div>
          </div>
          <div className="block">
            <div className="cv-row"><div className="cv-copy"><div className="cv-title">Allow public CV download</div><div className="cv-desc">Visitors can view published credentials online. This control decides whether the CV itself can also be downloaded.</div></div><button className={`switch${cvDownload ? " on" : ""}`} type="button" aria-label="Allow public CV download" onClick={() => setCvDownload((v) => !v)}><span /></button></div>
          </div>
          <div className="save-area"><button className="save" type="button" onClick={() => void saveDocs()}>{saving === "docs" ? "Saving..." : "Save changes"}</button>{saved === "docs" && <span className="save-state">Saved</span>}</div>
        </section>
        {showDelete && <div className="delete-sheet"><DeleteAccount email={email} /></div>}
      </main>
      <div className={`toast${toastOn ? " show" : ""}`}>{toast}</div>
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
