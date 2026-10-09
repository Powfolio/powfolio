"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { moveItem } from "@/lib/move-item";
import type { CommunityItem } from "@/types/database";
import { loadPendingAutofill, markSectionSaved } from "@/lib/autofill-store";

type TabId = "all" | "built" | "collaboration" | "community";
type Category = "built" | "collaboration" | "community";

const TABS: { id: TabId; short: string; icon: string }[] = [
  { id: "all", short: "All", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { id: "built", short: "Built", icon: "M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm4-3h8v3H8V4Z" },
  { id: "collaboration", short: "Collabs", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { id: "community", short: "Roles", icon: "M12 3l2.4 4.8L20 8.6l-4 3.9.9 5.5L12 15.8 7.1 18l.9-5.5-4-3.9 5.6-.8Z" },
];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "built", label: "Built by me" },
  { value: "collaboration", label: "Collaboration" },
  { value: "community", label: "Community role" },
];

type Draft = {
  title: string;
  role: string;
  platform: string;
  description: string;
  url: string;
  category: Category;
};

const emptyForm = {
  title: "",
  role: "",
  platform: "",
  description: "",
  url: "",
  tags: "",
  metrics: "",
  started_at: "",
  ended_at: "",
  is_visible: true,
  thumbnail_url: "" as string | null,
  category: "built" as Category,
};

function absoluteUrl(url: string) {
  const t = url.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
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
function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden>
      <path d={d} />
    </svg>
  );
}
function sortItems(list: CommunityItem[]) {
  return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
function categoryFromTags(tags: string[] | null | undefined): Category {
  const t = (tags || []).map((x) => x.toLowerCase());
  if (t.includes("built") || t.includes("built by me") || t.includes("personal project")) return "built";
  if (t.includes("community") || t.includes("community role") || t.includes("mod")) return "community";
  return "collaboration";
}
function categoryLabel(value: Category) {
  return CATEGORIES.find((c) => c.value === value)?.label || "Collaboration";
}

export default function CommunityManager({ userId, username, initialItems }: { userId: string; username: string; initialItems: CommunityItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<CommunityItem[]>(() => sortItems(initialItems));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [importing, setImporting] = useState(false);
  const [tab, setTab] = useState<TabId>("all");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dock, setDock] = useState<"closed" | "open" | "closing">("closed");
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);

  function notify(msg: string) {
    setToast(msg);
    setToastOn(true);
    window.setTimeout(() => setToastOn(false), 2200);
  }

  useEffect(() => {
    const stored = localStorage.getItem("pow3folio-theme");
    setTheme(stored === "light" ? "light" : "dark");
    const hash = window.location.hash.replace("#", "") as TabId;
    if (["all", "built", "collaboration", "community"].includes(hash)) setTab(hash);
  }, []);

  useEffect(() => {
    function load() {
      const p = loadPendingAutofill();
      if (!p || !p.pending.includes("community")) return;
      const list = Array.isArray(p.data.community) ? p.data.community : [];
      const mapped = list.filter((c) => c?.title).slice(0, 15).map((c) => {
        const plat = String(c.platform || "").toLowerCase();
        let category: Category = c.category === "built" || c.category === "collaboration" || c.category === "community" ? c.category : "collaboration";
        if (plat === "github" || plat.includes("github")) category = "built";
        if (String(c.role || "").toLowerCase().includes("founder")) category = "community";
        return {
          title: String(c.title).slice(0, 120),
          role: String(c.role || "").slice(0, 80),
          platform: String(c.platform || "Other").slice(0, 40) || "Other",
          description: String(c.description || "").slice(0, 500),
          url: String(c.url || "").slice(0, 300),
          category,
        };
      });
      if (mapped.length) setDrafts(mapped);
    }
    load();
    window.addEventListener("pow3-pending-autofill", load);
    return () => window.removeEventListener("pow3-pending-autofill", load);
  }, []);

  function selectTab(next: TabId) {
    setTab(next);
    history.replaceState(null, "", `#${next}`);
  }
  function closeDock() {
    setDock("closing");
    window.setTimeout(() => setDock("closed"), 380);
  }

  async function saveDrafts() {
    if (!drafts.length) return;
    setImporting(true);
    setError(null);
    const supabase = createClient();
    let maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);
    const inserted: CommunityItem[] = [];
    for (const d of drafts) {
      maxOrder += 1;
      const link = absoluteUrl(d.url);
      const { data, error: err } = await supabase.from("community_items").insert({
        title: d.title.trim(),
        role: d.role.trim() || null,
        platform: d.platform.trim() || null,
        description: d.description.trim() || null,
        url: link,
        thumbnail_url: siteLogo(link),
        tags: [d.category],
        is_visible: true,
        user_id: userId,
        sort_order: maxOrder,
      }).select().single();
      if (err) {
        setError(err.message.includes("community_items") || err.code === "42P01" ? "Run the community_items SQL in Supabase first." : err.message);
        setImporting(false);
        return;
      }
      inserted.push(data as CommunityItem);
    }
    setItems((prev) => sortItems([...prev, ...inserted]));
    setDrafts([]);
    markSectionSaved("community");
    setImporting(false);
    notify("Imported projects saved");
    router.refresh();
  }

  function startEdit(item: CommunityItem) {
    const rawTags = item.tags || [];
    const otherTags = rawTags.filter((t) => !["built", "built by me", "collaboration", "collab", "community", "community role", "personal project", "partner", "mod"].includes(t.toLowerCase()));
    setEditingId(item.id);
    setOpen(true);
    setError(null);
    setForm({
      title: item.title,
      role: item.role ?? "",
      platform: item.platform ?? "",
      description: item.description ?? "",
      url: item.url ?? "",
      tags: otherTags.join(", "),
      metrics: item.metrics ?? "",
      started_at: item.started_at ?? "",
      ended_at: item.ended_at ?? "",
      is_visible: item.is_visible,
      thumbnail_url: item.thumbnail_url,
      category: categoryFromTags(item.tags),
    });
  }
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(false);
    setError(null);
  }

  async function handleImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Image only");
    if (file.size > 2 * 1024 * 1024) return setError("Image under 2MB");
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/community-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    setUploading(false);
    if (upErr) return setError(upErr.message);
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, thumbnail_url: publicUrl }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) return setError("Title is required");
    if (!form.url.trim()) return setError("A project or collaboration link is required.");
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const link = absoluteUrl(form.url);
    const extraTags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: form.title.trim(),
      role: form.role.trim() || null,
      platform: form.platform.trim() || null,
      description: form.description.trim() || null,
      url: link,
      tags: [form.category, ...extraTags],
      metrics: form.metrics.trim() || null,
      started_at: form.started_at || null,
      ended_at: form.ended_at || null,
      is_visible: form.is_visible,
      thumbnail_url: form.thumbnail_url || siteLogo(link),
      user_id: userId,
    };
    if (editingId) {
      const { data, error: err } = await supabase.from("community_items").update(payload).eq("id", editingId).eq("user_id", userId).select().single();
      setLoading(false);
      if (err) return setError(err.message.includes("community_items") ? "Run the community_items SQL in Supabase first." : err.message);
      setItems((prev) => sortItems(prev.map((i) => (i.id === editingId ? (data as CommunityItem) : i))));
      notify("Project updated");
    } else {
      const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);
      const { data, error: err } = await supabase.from("community_items").insert({ ...payload, sort_order: maxOrder + 1 }).select().single();
      setLoading(false);
      if (err) return setError(err.message.includes("community_items") || err.code === "42P01" ? "Run the community_items SQL in Supabase first." : err.message);
      setItems((prev) => sortItems([...prev, data as CommunityItem]));
      notify("Project added");
    }
    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const supabase = createClient();
    const { error: err } = await supabase.from("community_items").delete().eq("id", id).eq("user_id", userId);
    if (err) { setItems(previous); return setError(err.message); }
    if (editingId === id) resetForm();
    notify("Project deleted");
    router.refresh();
  }

  async function persistOrder(next: CommunityItem[]) {
    const ordered = next.map((item, index) => ({ ...item, sort_order: index }));
    setItems(ordered);
    const supabase = createClient();
    await Promise.all(ordered.map((item) => supabase.from("community_items").update({ sort_order: item.sort_order }).eq("id", item.id).eq("user_id", userId)));
  }

  const visible = tab === "all" ? items : items.filter((item) => categoryFromTags(item.tags) === tab);
  const logo = form.thumbnail_url || siteLogo(absoluteUrl(form.url));

  return (
    <div className="profile-identity" data-theme={theme} data-collapsed={sideCollapsed ? "1" : "0"}>
      <header className="topbar">
        <Link className="back" href="/dashboard" aria-label="Back to dashboard"><Icon d="M15 5 8 12l7 7" size={18} /></Link>
        <Link className="brand" href="/" aria-label="Powfolio home"><span className="brand-mark">P</span><span className="brand-name">Powfolio</span></Link>
      </header>
      <aside className={`side${sideCollapsed ? " collapsed" : ""}`}>
        <nav className="side-nav" aria-label="Community sections">
          {TABS.map((item) => (
            <button key={item.id} className={`side-tab${tab === item.id ? " active" : ""}`} type="button" onClick={() => selectTab(item.id)}>
              <Icon d={item.icon} size={16} />
              <span>{item.short}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-meta"><div className="side-handle" title={username}>@{username || "profile"}</div><div className="side-note">Community workspace</div></div>
          <button className="side-collapse" type="button" aria-label={sideCollapsed ? "Expand sidebar" : "Minimize sidebar"} onClick={() => setSideCollapsed((v) => !v)}>
            <Icon d={sideCollapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} size={16} />
          </button>
        </div>
      </aside>
      <main className="shell">
        <section className="hero">
          <div className="eyebrow">Community workspace</div>
          <div className="hero-row"><div><h1>Projects & Collabs</h1><p>Personal builds, partnerships and community roles. The same entry flow as the rest of the workspace, with a logo pulled from each project link.</p></div></div>
        </section>
        <section className="panel active">
          <div className="section-intro"><h2>{tab === "all" ? "All work" : categoryLabel(tab)}</h2><p>A project or collaboration link is required. The logo is pulled from it. Replace the image if the mark is wrong. Replace the image if the site mark is wrong. Drag a row to change the public order.</p></div>
          {drafts.length > 0 && (
            <div className="block">
              <div className="block-head"><div><div className="block-title">Imported projects</div><div className="block-desc">{drafts.length} item{drafts.length === 1 ? "" : "s"} from CV, Notion or GitHub are waiting to be saved.</div></div><button className="action accent" type="button" disabled={importing} onClick={() => void saveDrafts()}>{importing ? "Saving..." : "Save imported"}</button></div>
              <div className="entry-list">
                {drafts.map((d, i) => (
                  <div className="entry" key={`${d.title}-${i}`}>
                    <div className="entry-left"><span className="logo-preview sm">{siteLogo(absoluteUrl(d.url)) ? <img src={siteLogo(absoluteUrl(d.url)) || ""} alt="" /> : d.title.slice(0, 1)}</span><div><div className="entry-title">{d.title}</div><div className="entry-meta">{categoryLabel(d.category)}{d.role ? ` · ${d.role}` : ""}</div></div></div>
                  </div>
                ))}
              </div>
              <div className="form-actions"><button className="action" type="button" onClick={() => { setDrafts([]); markSectionSaved("community"); }}>Dismiss</button></div>
            </div>
          )}
          <div className="block">
            <div className="block-head"><div><div className="block-title">Projects</div><div className="block-desc">{visible.length} visible in this section. Hidden items stay saved but do not publish.</div></div><button className="action accent" type="button" onClick={() => { resetForm(); setOpen(true); setForm({ ...emptyForm, category: tab === "all" ? "built" : tab }); }}>Add project</button></div>
            <div className="entry-list">
              {visible.length === 0 && <div className="empty">No projects in this section yet.</div>}
              {visible.map((item, i) => {
                const logoUrl = item.thumbnail_url || siteLogo(item.url);
                return (
                  <div key={item.id} className="entry" draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag === null || drag === i) return; const from = items.findIndex((row) => row.id === visible[drag].id); const to = items.findIndex((row) => row.id === visible[i].id); if (from < 0 || to < 0) return; void persistOrder(moveItem(items, from, to)); setDrag(null); notify("Order updated"); }}>
                    <div className="entry-left"><button className="drag-handle" type="button" aria-label="Reorder project"><Icon d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" /></button><span className="logo-preview sm">{logoUrl ? <img src={logoUrl} alt="" /> : item.title.slice(0, 1)}</span><div><div className="entry-title">{item.title}</div><div className="entry-meta">{categoryLabel(categoryFromTags(item.tags))}{item.role ? ` · ${item.role}` : ""}{item.platform ? ` · ${item.platform}` : ""}{item.is_visible ? "" : " · Hidden"}</div>{item.url && <div className="entry-meta">{item.url}</div>}</div></div>
                    <div className="entry-actions">
                      <button className="small-action" type="button" onClick={() => startEdit(item)}>Edit</button>
                      <button className="small-action danger-action" type="button" onClick={() => void handleDelete(item.id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={`entry-form${open ? " open" : ""}`}>
              <div className="form-grid">
                <div className="field"><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project, collab or community name" /></div>
                <div className="field"><label className="label">Role</label><input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Founder, contributor, mod" /></div>
                <div className="field"><label className="label">Platform</label><input className="input" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="GitHub, Telegram, Discord" /></div>
                <div className="field"><label className="label">Category</label><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div className="field full"><label className="label">Project link</label><input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value, thumbnail_url: form.thumbnail_url && !form.thumbnail_url.includes("google.com/s2/favicons") ? form.thumbnail_url : siteLogo(absoluteUrl(e.target.value)) })} placeholder="https://github.com/you/project" required /></div>
                <div className="field full logo-field"><span className="logo-preview">{logo ? <img src={logo} alt="" /> : "Logo"}</span><label className="text-action">{uploading ? "Uploading..." : "Replace logo"}<input type="file" accept="image/*" hidden onChange={(e) => void handleImage(e.target.files?.[0] || null)} /></label><span className="logo-note">The site logo is pulled from the link. Upload another image if it is wrong.</span></div>
                <div className="field full"><label className="label">Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What you built, who you worked with, or the role you held." /></div>
                <div className="field"><label className="label">Start</label><input className="input" type="month" value={form.started_at.slice(0, 7)} onChange={(e) => setForm({ ...form, started_at: e.target.value })} /></div>
                <div className="field"><label className="label">End</label><input className="input" type="month" value={form.ended_at.slice(0, 7)} onChange={(e) => setForm({ ...form, ended_at: e.target.value })} /></div>
                <div className="field full"><label className="label">Outcome</label><input className="input" value={form.metrics} onChange={(e) => setForm({ ...form, metrics: e.target.value })} placeholder="Optional result, members or shipped milestone" /></div>
                <div className="field full"><label className="label">Extra tags</label><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma separated, optional" /></div>
              </div>
              <div className="cv-row"><div className="cv-copy"><div className="cv-title">Visible on public profile</div><div className="cv-desc">Turn this off to keep the item in your workspace without publishing it.</div></div><button className={`switch${form.is_visible ? " on" : ""}`} type="button" aria-label="Visible on public profile" onClick={() => setForm((f) => ({ ...f, is_visible: !f.is_visible }))}><span /></button></div>
              {error && <div className="error">{error}</div>}
              <div className="form-actions"><button className="action accent" type="button" disabled={loading} onClick={() => void handleSubmit()}>{loading ? "Saving..." : editingId ? "Update project" : "Add project"}</button><button className="action" type="button" onClick={resetForm}>Cancel</button></div>
            </div>
          </div>
        </section>
      </main>
      <button className={`tab-fab${dock === "open" ? " open" : ""}`} type="button" aria-label={dock === "open" ? "Close sections" : "Open sections"} onClick={() => { if (dock === "open") closeDock(); else setDock("open"); }}>
        <svg className="burger" viewBox="0 0 24 18" width="22" height="16" aria-hidden>
          <rect x="1" y="1" width="22" height="3.2" rx="1.6" />
          <rect x="1" y="7.4" width="22" height="3.2" rx="1.6" />
          <rect x="1" y="13.8" width="22" height="3.2" rx="1.6" />
        </svg>
      </button>
      <div className={`tab-dock${dock === "open" ? " open" : ""}${dock === "closing" ? " closing" : ""}`}>
        {TABS.map((item, index) => (
          <button key={item.id} className={`dock-tab${tab === item.id ? " active" : ""}`} style={{ transitionDelay: `${index * 45}ms` }} type="button" onClick={() => { selectTab(item.id); closeDock(); }}>
            <Icon d={item.icon} size={16} />
            <span>{item.short}</span>
          </button>
        ))}
      </div>
      {dock !== "closed" && <button className="dock-backdrop" type="button" aria-label="Close sections" onClick={closeDock} />}
      <div className={`toast${toastOn ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
