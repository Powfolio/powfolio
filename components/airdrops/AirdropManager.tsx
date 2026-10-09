"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { moveItem } from "@/lib/move-item";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { Airdrop, AirdropStatus } from "@/types/database";

const TABS = [
  { id: "all", short: "All", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
];
const STATUSES: AirdropStatus[] = ["farming", "qualified", "claimed", "pending", "missed"];
const CHAINS = ["Ethereum", "Solana", "Base", "Arbitrum", "Optimism", "Polygon", "Cosmos", "Sui", "Aptos", "Bitcoin", "Multi-chain", "Other"];
const emptyForm = { title: "", chain: "Ethereum", status: "farming" as AirdropStatus, role: "", description: "", reward: "", url: "", tags: "", started_at: "", claimed_at: "", is_visible: true, thumbnail_url: "" as string | null };

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
  } catch { return null; }
}
function sortItems(list: Airdrop[]) {
  return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
function label(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function AirdropManager({ userId, username, initialItems }: { userId: string; username: string; initialItems: Airdrop[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Airdrop[]>(() => sortItems(initialItems));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [drag, setDrag] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);

  function notify(msg: string) { setToast(msg); setToastOn(true); window.setTimeout(() => setToastOn(false), 2200); }
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === hash)) setTab(hash);
  }, []);

  function startEdit(item: Airdrop) {
    setEditingId(item.id);
    setOpen(true);
    setError(null);
    setForm({ title: item.title, chain: item.chain ?? "Ethereum", status: item.status, role: item.role ?? "", description: item.description ?? "", reward: item.reward ?? "", url: item.url ?? "", tags: (item.tags ?? []).join(", "), started_at: item.started_at ?? "", claimed_at: item.claimed_at ?? "", is_visible: item.is_visible, thumbnail_url: item.thumbnail_url });
  }
  function resetForm() { setEditingId(null); setForm(emptyForm); setOpen(false); setError(null); }
  async function handleThumbnail(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Logo must be an image");
    if (file.size > 2 * 1024 * 1024) return setError("Image must be under 2MB");
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/airdrop-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    setUploading(false);
    if (uploadError) return setError(uploadError.message);
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((prev) => ({ ...prev, thumbnail_url: publicUrl }));
  }
  async function handleSubmit() {
    if (!form.title.trim()) return setError("Title is required");
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const link = absoluteUrl(form.url);
    const payload = {
      title: form.title.trim(), chain: form.chain.trim() || null, status: form.status, role: form.role.trim() || null,
      description: form.description.trim() || null, reward: form.reward.trim() || null, url: link,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), started_at: form.started_at || null, claimed_at: form.claimed_at || null,
      is_visible: form.is_visible, thumbnail_url: form.thumbnail_url || siteLogo(link), user_id: userId,
    };
    if (editingId) {
      const { data, error: err } = await supabase.from("airdrops").update(payload).eq("id", editingId).eq("user_id", userId).select().single();
      setLoading(false);
      if (err) return setError(err.message.includes("airdrops") || err.code === "42P01" ? "Run the airdrops SQL in Supabase first." : err.message);
      setItems((prev) => sortItems(prev.map((i) => (i.id === editingId ? (data as Airdrop) : i))));
      notify("Airdrop updated");
    } else {
      const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);
      const { data, error: err } = await supabase.from("airdrops").insert({ ...payload, sort_order: maxOrder + 1 }).select().single();
      setLoading(false);
      if (err) return setError(err.message.includes("airdrops") || err.code === "42P01" ? "Run the airdrops SQL in Supabase first." : err.message);
      setItems((prev) => sortItems([...prev, data as Airdrop]));
      notify("Airdrop added");
    }
    resetForm();
    router.refresh();
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign?")) return;
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const supabase = createClient();
    const { error: err } = await supabase.from("airdrops").delete().eq("id", id).eq("user_id", userId);
    if (err) { setItems(previous); return setError(err.message); }
    if (editingId === id) resetForm();
    notify("Airdrop deleted");
    router.refresh();
  }
  async function persistOrder(next: Airdrop[]) {
    const ordered = next.map((item, index) => ({ ...item, sort_order: index }));
    setItems(ordered);
    const supabase = createClient();
    await Promise.all(ordered.map((item) => supabase.from("airdrops").update({ sort_order: item.sort_order }).eq("id", item.id).eq("user_id", userId)));
  }
  const visible = tab === "all" ? items : items.filter((item) => item.status === tab);
  const logo = form.thumbnail_url || siteLogo(absoluteUrl(form.url));

  return (
    <WorkspaceShell title="Airdrops" eyebrow="Airdrop workspace" intro="Campaigns you farmed, qualified for, or claimed. The campaign link pulls a logo, and claim status stays on the same entry." username={username} note="Airdrop workspace" tabs={TABS} tab={tab} onTab={setTab} hideDock>
      <div className="section-intro"><h2>{tab === "all" ? "All campaigns" : label(tab)}</h2><p>Add the campaign link so the logo is pulled automatically. Replace it if the mark is wrong.</p></div>
      <div className="block">
        <div className="block-head"><div><div className="block-title">Campaigns</div><div className="block-desc">{visible.length} in this section.</div></div><button className="action accent" type="button" onClick={() => { resetForm(); setOpen(true); setForm({ ...emptyForm, status: tab === "all" ? "farming" : tab as AirdropStatus }); }}>Add campaign</button></div>
        <div className="entry-list">
          {visible.length === 0 && <div className="empty">No campaigns in this section yet.</div>}
          {visible.map((item, i) => (
            <div key={item.id} className="entry" draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag === null || drag === i) return; const from = items.findIndex((row) => row.id === visible[drag].id); const to = items.findIndex((row) => row.id === visible[i].id); if (from < 0 || to < 0) return; void persistOrder(moveItem(items, from, to)); setDrag(null); notify("Order updated"); }}>
              <div className="entry-left"><button className="drag-handle" type="button" aria-label="Reorder campaign"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></svg></button><span className="logo-preview sm">{item.thumbnail_url || siteLogo(item.url) ? <img src={item.thumbnail_url || siteLogo(item.url) || ""} alt="" /> : item.title.slice(0, 1)}</span><div><div className="entry-title">{item.title}</div><div className="entry-meta">{label(item.status)}{item.chain ? ` · ${item.chain}` : ""}{item.role ? ` · ${item.role}` : ""}{item.is_visible ? "" : " · Hidden"}</div>{item.reward && <div className="entry-meta">{item.reward}</div>}</div></div>
              <div className="entry-actions"><button className="small-action" type="button" onClick={() => startEdit(item)}>Edit</button><button className="small-action danger-action" type="button" onClick={() => void handleDelete(item.id)}>Delete</button></div>
            </div>
          ))}
        </div>
        <div className={`entry-form${open ? " open" : ""}`}>
          <div className="form-grid">
            <div className="field"><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Campaign name" /></div>
            <div className="field"><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AirdropStatus })}>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div>
            <div className="field"><label className="label">Chain</label><select className="input" value={form.chain} onChange={(e) => setForm({ ...form, chain: e.target.value })}>{CHAINS.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label className="label">Role</label><input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Tester, contributor, hunter" /></div>
            <div className="field full"><label className="label">Campaign link</label><input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value, thumbnail_url: form.thumbnail_url && !form.thumbnail_url.includes("google.com/s2/favicons") ? form.thumbnail_url : siteLogo(absoluteUrl(e.target.value)) })} placeholder="https://campaign.xyz" /></div>
            <div className="field full logo-field"><span className="logo-preview">{logo ? <img src={logo} alt="" /> : "Logo"}</span><label className="text-action">{uploading ? "Uploading..." : "Replace logo"}<input type="file" accept="image/*" hidden onChange={(e) => void handleThumbnail(e.target.files?.[0] || null)} /></label><span className="logo-note">The campaign logo is pulled from the link. Upload one if the image is wrong.</span></div>
            <div className="field"><label className="label">Reward</label><input className="input" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} placeholder="Allocation or points" /></div>
            <div className="field"><label className="label">Started</label><input className="input" type="date" value={form.started_at.slice(0, 10)} onChange={(e) => setForm({ ...form, started_at: e.target.value })} /></div>
            <div className="field"><label className="label">Claimed</label><input className="input" type="date" value={form.claimed_at.slice(0, 10)} onChange={(e) => setForm({ ...form, claimed_at: e.target.value })} /></div>
            <div className="field full"><label className="label">Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What you did in the campaign." /></div>
            <div className="field full"><label className="label">Tags</label><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma separated" /></div>
          </div>
          <div className="cv-row"><div className="cv-copy"><div className="cv-title">Visible on public profile</div><div className="cv-desc">Hidden campaigns stay saved and do not publish.</div></div><button className={`switch${form.is_visible ? " on" : ""}`} type="button" aria-label="Visible on public profile" onClick={() => setForm((f) => ({ ...f, is_visible: !f.is_visible }))}><span /></button></div>
          {error && <div className="error">{error}</div>}
          <div className="form-actions"><button className="action accent" type="button" disabled={loading} onClick={() => void handleSubmit()}>{loading ? "Saving..." : editingId ? "Update campaign" : "Add campaign"}</button><button className="action" type="button" onClick={resetForm}>Cancel</button></div>
        </div>
      </div>
      <div className={`toast${toastOn ? " show" : ""}`}>{toast}</div>
    </WorkspaceShell>
  );
}
