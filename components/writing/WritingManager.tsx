"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { moveItem } from "@/lib/move-item";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import EntrySheet from "@/components/ui/EntrySheet";
import type { Writing } from "@/types/database";
import { loadPendingAutofill, markSectionSaved } from "@/lib/autofill-store";

const TABS = [
  { id: "all", short: "All", icon: "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 1.5V9h4.5" },
  { id: "public", short: "Public", icon: "M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" },
  { id: "hidden", short: "Hidden", icon: "M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M9.9 5.1A10.8 10.8 0 0 1 12 6c6 0 10 6 10 6a18 18 0 0 1-3.2 3.8M6.1 6.1C3.5 7.8 2 12 2 12a18.4 18.4 0 0 0 5.2 5" },
];

const emptyForm = {
  title: "",
  url: "",
  description: "",
  tags: "",
  published_at: "",
  is_visible: true,
  thumbnail_url: "" as string | null,
  image_url_2: "" as string | null,
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
function sortItems(list: Writing[]) {
  return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function WritingManager({ userId, username, initialItems }: { userId: string; username: string; initialItems: Writing[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Writing[]>(() => sortItems(initialItems));
  const [form, setForm] = useState(emptyForm);
  const formBaseline = useRef("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<"1" | "2" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<{ title: string; url: string; description: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [tab, setTab] = useState("all");
  const [drag, setDrag] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);

  function notify(msg: string) {
    setToast(msg);
    setToastOn(true);
    window.setTimeout(() => setToastOn(false), 2200);
  }
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (["all", "public", "hidden"].includes(hash)) setTab(hash);
    function load() {
      const p = loadPendingAutofill();
      if (!p || !p.pending.includes("writing")) return;
      const list = Array.isArray(p.data.writings) ? p.data.writings : [];
      const mapped = list.filter((w) => w?.title && w?.url).slice(0, 6).map((w) => ({
        title: String(w.title).slice(0, 160),
        url: String(w.url).slice(0, 400),
        description: String(w.description || "").slice(0, 400),
      }));
      if (mapped.length) setDrafts(mapped);
    }
    load();
    window.addEventListener("pow3-pending-autofill", load);
    return () => window.removeEventListener("pow3-pending-autofill", load);
  }, []);

  async function saveDrafts() {
    if (!drafts.length) return;
    setImporting(true);
    setError(null);
    const supabase = createClient();
    let maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);
    const inserted: Writing[] = [];
    for (const d of drafts) {
      maxOrder += 1;
      const { data, error: err } = await supabase.from("writings").insert({
        title: d.title.trim(),
        url: d.url.trim(),
        description: d.description.trim() || null,
        thumbnail_url: siteLogo(absoluteUrl(d.url)),
        is_visible: true,
        user_id: userId,
        sort_order: maxOrder,
      }).select().single();
      if (err) {
        setError(err.message);
        setImporting(false);
        return;
      }
      inserted.push(data as Writing);
    }
    setItems((prev) => sortItems([...prev, ...inserted]));
    setDrafts([]);
    markSectionSaved("writing");
    setImporting(false);
    notify("Imported writing saved");
    router.refresh();
  }

  function openNew() {
    setEditingId(null);
    setError(null);
    setForm(emptyForm);
    formBaseline.current = JSON.stringify(emptyForm);
    setOpen(true);
  }
  function startEdit(item: Writing) {
    const next = {
      title: item.title,
      url: item.url,
      description: item.description ?? "",
      tags: (item.tags ?? []).join(", "),
      published_at: item.published_at ?? "",
      is_visible: item.is_visible,
      thumbnail_url: item.thumbnail_url,
      image_url_2: item.image_url_2,
    };
    setEditingId(item.id);
    setError(null);
    setForm(next);
    formBaseline.current = JSON.stringify(next);
    setOpen(true);
  }
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(false);
    setError(null);
  }
  async function uploadImage(file: File | null, slot: "1" | "2") {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Image only");
    if (file.size > 2 * 1024 * 1024) return setError("Image under 2MB");
    setUploading(slot);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/writing-${slot}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    setUploading(null);
    if (upErr) return setError(upErr.message);
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    if (slot === "1") setForm((f) => ({ ...f, thumbnail_url: publicUrl }));
    else setForm((f) => ({ ...f, image_url_2: publicUrl }));
  }
  async function handleSubmit() {
    if (!form.title.trim() || !form.url.trim()) return setError("Title and link are required");
    if (!form.published_at.trim()) return setError("Add a published date before saving this writing.");
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      url: absoluteUrl(form.url),
      description: form.description.trim() || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published_at: form.published_at.trim(),
      is_visible: form.is_visible,
      thumbnail_url: form.thumbnail_url || siteLogo(absoluteUrl(form.url)),
      image_url_2: form.image_url_2 || null,
      user_id: userId,
    };
    if (editingId) {
      const { data, error: err } = await supabase.from("writings").update(payload).eq("id", editingId).eq("user_id", userId).select().single();
      setLoading(false);
      if (err) return setError(err.message.includes("image_url_2") || err.code === "42703" ? "Run the writings image_url_2 SQL migration in Supabase, then try again." : err.message);
      setItems((prev) => sortItems(prev.map((i) => (i.id === editingId ? (data as Writing) : i))));
      notify("Writing updated");
    } else {
      const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);
      const { data, error: err } = await supabase.from("writings").insert({ ...payload, sort_order: maxOrder + 1 }).select().single();
      setLoading(false);
      if (err) return setError(err.message.includes("image_url_2") || err.code === "42703" ? "Run the writings image_url_2 SQL migration in Supabase, then try again." : err.message);
      setItems((prev) => sortItems([...prev, data as Writing]));
      notify("Writing added");
    }
    resetForm();
    router.refresh();
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this writing?")) return;
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const supabase = createClient();
    const { error: err } = await supabase.from("writings").delete().eq("id", id).eq("user_id", userId);
    if (err) { setItems(previous); return setError(err.message); }
    if (editingId === id) resetForm();
    notify("Writing deleted");
    router.refresh();
  }
  async function persistOrder(next: Writing[]) {
    const ordered = next.map((item, index) => ({ ...item, sort_order: index }));
    setItems(ordered);
    const supabase = createClient();
    await Promise.all(ordered.map((item) => supabase.from("writings").update({ sort_order: item.sort_order }).eq("id", item.id).eq("user_id", userId)));
  }

  const visible = tab === "public" ? items.filter((i) => i.is_visible) : tab === "hidden" ? items.filter((i) => !i.is_visible) : items;
  const cover = form.thumbnail_url || siteLogo(absoluteUrl(form.url));

  return (
    <WorkspaceShell title="Writing" eyebrow="Writing workspace" intro="Articles, threads, Mirror posts and research. A link pulls the publication mark, and you can replace it with your own cover." username={username} note="Writing workspace" tabs={TABS} tab={tab} onTab={setTab} overlay={
      <EntrySheet
        open={open}
        title={editingId ? "Edit writing" : "Add writing"}
        saveLabel={editingId ? "Update writing" : "Add writing"}
        saving={loading || uploading !== null}
        dirty={open && JSON.stringify(form) !== formBaseline.current}
        onClose={resetForm}
        onSave={() => void handleSubmit()}
      >
        <div className="form-grid">
          <div className="field"><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article or thread title" /></div>
          <div className="field"><label className="label">Published date *</label><input className="input" type="date" value={form.published_at.slice(0, 10)} onChange={(e) => setForm({ ...form, published_at: e.target.value })} /></div>
          <div className="field full"><label className="label">Link *</label><input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value, thumbnail_url: form.thumbnail_url && !form.thumbnail_url.includes("google.com/s2/favicons") ? form.thumbnail_url : siteLogo(absoluteUrl(e.target.value)) })} placeholder="https://mirror.xyz/..." /></div>
          <div className="field full logo-field"><span className="logo-preview">{cover ? <img src={cover} alt="" /> : "Cover"}</span><label className="text-action">{uploading === "1" ? "Uploading..." : "Replace cover"}<input type="file" accept="image/*" hidden onChange={(e) => void uploadImage(e.target.files?.[0] || null, "1")} /></label><span className="logo-note">The publication mark is pulled from the link. Upload a cover if you want a different image.</span></div>
          <div className="field full logo-field"><span className="logo-preview">{form.image_url_2 ? <img src={form.image_url_2} alt="" /> : "2"}</span><label className="text-action">{uploading === "2" ? "Uploading..." : "Second image"}<input type="file" accept="image/*" hidden onChange={(e) => void uploadImage(e.target.files?.[0] || null, "2")} /></label><span className="logo-note">Optional second image already supported by writing.</span></div>
          <div className="field full"><label className="label">Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What the piece covers." /></div>
          <div className="field full"><label className="label">Tags</label><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma separated" /></div>
        </div>
        <div className="cv-row"><div className="cv-copy"><div className="cv-title">Visible on public profile</div><div className="cv-desc">Hidden pieces stay in the workspace and do not publish.</div></div><button className={`switch${form.is_visible ? " on" : ""}`} type="button" aria-label="Visible on public profile" onClick={() => setForm((f) => ({ ...f, is_visible: !f.is_visible }))}><span /></button></div>
        {error && <div className="error">{error}</div>}
      </EntrySheet>
    }>
      <div className="section-intro"><h2>{tab === "hidden" ? "Hidden writing" : tab === "public" ? "Public writing" : "All writing"}</h2><p>Published date is required before a piece can be saved. Drag a row to change the public order.</p></div>
      {drafts.length > 0 && (
        <div className="block">
          <div className="block-head"><div><div className="block-title">Imported writing</div><div className="block-desc">{drafts.length} piece{drafts.length === 1 ? "" : "s"} from CV or link import. Add a date when you edit each one.</div></div><button className="action accent" type="button" disabled={importing} onClick={() => void saveDrafts()}>{importing ? "Saving..." : "Save imported"}</button></div>
          <div className="entry-list">{drafts.map((d, i) => <div className="entry" key={`${d.title}-${i}`}><div className="entry-left"><span className="logo-preview sm">{siteLogo(absoluteUrl(d.url)) ? <img src={siteLogo(absoluteUrl(d.url)) || ""} alt="" /> : d.title.slice(0, 1)}</span><div><div className="entry-title">{d.title}</div><div className="entry-meta">{d.url}</div></div></div></div>)}</div>
          <div className="form-actions"><button className="action" type="button" onClick={() => { setDrafts([]); markSectionSaved("writing"); }}>Dismiss</button></div>
        </div>
      )}
      <div className="block">
        <div className="block-head"><div><div className="block-title">Pieces</div><div className="block-desc">{visible.length} in this section.</div></div><button className="action accent" type="button" onClick={openNew}>Add writing</button></div>
        <div className="entry-list">
          {visible.length === 0 && <div className="empty">No writing in this section yet.</div>}
          {visible.map((item, i) => (
            <div key={item.id} className="entry" draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag === null || drag === i) return; const from = items.findIndex((row) => row.id === visible[drag].id); const to = items.findIndex((row) => row.id === visible[i].id); if (from < 0 || to < 0) return; void persistOrder(moveItem(items, from, to)); setDrag(null); notify("Order updated"); }}>
              <div className="entry-left"><button className="drag-handle" type="button" aria-label="Reorder writing"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></svg></button><span className="logo-preview sm">{item.thumbnail_url || siteLogo(item.url) ? <img src={item.thumbnail_url || siteLogo(item.url) || ""} alt="" /> : item.title.slice(0, 1)}</span><div><div className="entry-title">{item.title}</div><div className="entry-meta">{item.published_at || "No date"}{item.is_visible ? "" : " · Hidden"}</div>{item.url && <div className="entry-meta">{item.url}</div>}</div></div>
              <div className="entry-actions"><button className="small-action" type="button" onClick={() => startEdit(item)}>Edit</button><button className="small-action danger-action" type="button" onClick={() => void handleDelete(item.id)}>Delete</button></div>
            </div>
          ))}
        </div>
      </div>
      <div className={`toast${toastOn ? " show" : ""}`}>{toast}</div>
    </WorkspaceShell>
  );
}
