"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { moveItem } from "@/lib/move-item";
import { getPlatformDomain, searchPlatforms } from "@/lib/cex-dex-list";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import TradeUpdatesEditor from "@/components/trading/TradeUpdatesEditor";
import PlatformLogo from "@/components/ui/PlatformLogo";
import type { Trade, TradeDirection, TradeStatus, TradingPlatform } from "@/types/database";

const TABS = [
  { id: "platforms", short: "Platforms", icon: "M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm4-3h8v3H8V4Z" },
  { id: "trades", short: "Trades", icon: "M4 18V6M4 18h16M8 14l3-4 3 2 4-6" },
];
const emptyForm = { ticker: "", pair: "", direction: "long" as TradeDirection, status: "win" as TradeStatus, roi: "", entry_price: "", exit_price: "", analysis: "", traded_at: "", post_url: "", is_visible: true, chart_url: "" as string | null, chart_url_2: "" as string | null };
function uid() { return Math.random().toString(36).slice(2, 10); }
function sortItems(list: Trade[]) { return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); }

export default function TradingWorkspace({ userId, username, initialItems, initialPlatforms }: { userId: string; username: string; initialItems: Trade[]; initialPlatforms: TradingPlatform[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("platforms");
  const [platforms, setPlatforms] = useState<TradingPlatform[]>(initialPlatforms ?? []);
  const [query, setQuery] = useState("");
  const [link, setLink] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [items, setItems] = useState<Trade[]>(() => sortItems(initialItems));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [updatesTradeId, setUpdatesTradeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const suggestions = searchPlatforms(query, 8);

  function notify(msg: string) { setToast(msg); setToastOn(true); window.setTimeout(() => setToastOn(false), 2200); }
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === hash)) setTab(hash);
  }, []);

  async function savePlatforms(next: TradingPlatform[]) {
    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").update({ trading_platforms: next }).eq("id", userId);
    if (err) return setError(err.message.includes("column") ? "Run the SQL migration for trading_platforms column first." : err.message);
    setPlatforms(next);
    notify("Platforms saved");
    router.refresh();
  }
  function addPlatform() {
    if (!selectedName) return setError("Pick a platform first");
    if (platforms.length >= 4) return setError("Max 4 platforms allowed");
    if (platforms.some((p) => p.name.toLowerCase() === selectedName.toLowerCase())) return setError("Already added");
    const next = [...platforms, { id: uid(), name: selectedName, link: link.trim() || getPlatformDomain(selectedName) }];
    setPlatformOpen(false); setQuery(""); setSelectedName(null); setLink("");
    void savePlatforms(next);
  }

  function startEdit(item: Trade) {
    setEditingId(item.id); setOpen(true); setError(null); setUpdatesTradeId(item.id);
    setForm({ ticker: item.ticker, pair: item.pair ?? "", direction: item.direction || "long", status: item.status, roi: item.roi != null ? String(item.roi) : "", entry_price: item.entry_price != null ? String(item.entry_price) : "", exit_price: item.exit_price != null ? String(item.exit_price) : "", analysis: item.analysis ?? "", traded_at: item.traded_at ?? "", post_url: item.post_url ?? "", is_visible: item.is_visible, chart_url: item.chart_url, chart_url_2: item.chart_url_2 });
  }
  function resetForm() { setEditingId(null); setForm(emptyForm); setOpen(false); setError(null); setUpdatesTradeId(null); }
  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) { setError("Must be an image"); return null; }
    if (file.size > 4 * 1024 * 1024) { setError("Image must be under 4MB"); return null; }
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/trade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { setError(uploadError.message); return null; }
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }
  async function handleChart(file: File | null, slot: 1 | 2) {
    if (!file) return;
    setUploading(true); setError(null);
    const url = await uploadImage(file);
    setUploading(false);
    if (!url) return;
    if (slot === 1) setForm((p) => ({ ...p, chart_url: url }));
    else setForm((p) => ({ ...p, chart_url_2: url }));
  }
  async function handleSubmit() {
    if (!form.ticker.trim()) return setError("Ticker is required");
    setLoading(true); setError(null);
    const supabase = createClient();
    const payload = { ticker: form.ticker.trim().toUpperCase(), pair: form.pair.trim() || null, direction: form.direction, status: form.status, roi: form.roi !== "" ? Number(form.roi) : null, entry_price: form.entry_price !== "" ? Number(form.entry_price) : null, exit_price: form.exit_price !== "" ? Number(form.exit_price) : null, analysis: form.analysis.trim() || null, traded_at: form.traded_at || null, post_url: form.post_url.trim() || null, is_visible: form.is_visible, chart_url: form.chart_url || null, chart_url_2: form.chart_url_2 || null, user_id: userId };
    if (editingId) {
      const { data, error: err } = await supabase.from("trades").update(payload).eq("id", editingId).eq("user_id", userId).select().single();
      setLoading(false);
      if (err) return setError(err.message);
      setItems((prev) => sortItems(prev.map((i) => (i.id === editingId ? (data as Trade) : i))));
      notify("Trade updated");
    } else {
      const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);
      const { data, error: err } = await supabase.from("trades").insert({ ...payload, sort_order: maxOrder + 1 }).select().single();
      setLoading(false);
      if (err) return setError(err.message);
      setItems((prev) => sortItems([...prev, data as Trade]));
      notify("Trade added");
    }
    resetForm();
    router.refresh();
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this trade?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("trades").delete().eq("id", id).eq("user_id", userId);
    if (err) return setError(err.message);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editingId === id) resetForm();
    notify("Trade deleted");
    router.refresh();
  }
  async function persistOrder(next: Trade[]) {
    const ordered = next.map((item, index) => ({ ...item, sort_order: index }));
    setItems(ordered);
    const supabase = createClient();
    await Promise.all(ordered.map((item) => supabase.from("trades").update({ sort_order: item.sort_order }).eq("id", item.id).eq("user_id", userId)));
  }
  const visible = tab === "wins" ? items.filter((i) => i.status === "win") : tab === "losses" ? items.filter((i) => i.status === "loss") : items;

  return (
    <WorkspaceShell title="Trading Record" eyebrow="Trading workspace" intro="Platforms, charts and outcomes. Wins and losses stay in the same record, with the chart images already supported by each trade." username={username} note="Trading workspace" tabs={TABS} tab={tab} onTab={setTab}>
      {tab === "platforms" ? (
        <div className="block">
          <div className="section-intro"><h2>Platforms</h2><p>Up to four CEX or DEX platforms. They publish as the chips under your trading record.</p></div>
          <div className="block-head"><div><div className="block-title">CEX / DEX</div><div className="block-desc">{platforms.length} of 4 added.</div></div>{platforms.length < 4 && <button className="action accent" type="button" onClick={() => { setPlatformOpen(true); setError(null); }}>Add platform</button>}</div>
          <div className="skills">{platforms.map((p) => <span className="chip" key={p.id}><PlatformLogo name={p.name} size={16} className="h-4 w-4" /><span>{p.name}</span><button type="button" aria-label={`Remove ${p.name}`} onClick={() => void savePlatforms(platforms.filter((row) => row.id !== p.id))}>×</button></span>)}{platforms.length === 0 && <span className="empty">No platforms added yet.</span>}</div>
          <div className={`entry-form${platformOpen ? " open" : ""}`}>
            <div className="form-grid">
              <div className="field full"><label className="label">Search</label><input className="input" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedName(null); }} placeholder="Type Bin, Byb, Hyp..." autoComplete="off" /></div>
              {query && !selectedName && suggestions.length > 0 && <div className="field full suggestion-list">{suggestions.map((s) => <button key={s.name} className="suggestion" type="button" onClick={() => { setSelectedName(s.name); setQuery(s.name); }}><PlatformLogo name={s.name} size={16} className="h-4 w-4" />{s.name}</button>)}</div>}
              {selectedName && <div className="field full"><label className="label">Profile or referral link</label><input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder={getPlatformDomain(selectedName)} /></div>}
            </div>
            {error && <div className="error">{error}</div>}
            <div className="form-actions"><button className="action accent" type="button" onClick={addPlatform}>Add platform</button><button className="action" type="button" onClick={() => setPlatformOpen(false)}>Cancel</button></div>
          </div>
        </div>
      ) : (
        <div className="block">
          <div className="section-intro"><h2>{tab === "wins" ? "Wins" : tab === "losses" ? "Losses" : "Trades"}</h2><p>Charts stay attached to the trade. Updates remain available while editing a saved trade.</p></div>
          <div className="block-head"><div><div className="block-title">Record</div><div className="block-desc">{visible.length} in this section.</div></div><button className="action accent" type="button" onClick={() => { resetForm(); setOpen(true); }}>Add trade</button></div>
          <div className="entry-list">
            {visible.length === 0 && <div className="empty">No trades in this section yet.</div>}
            {visible.map((item, i) => (
              <div key={item.id} className="entry" draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag === null || drag === i) return; const from = items.findIndex((row) => row.id === visible[drag].id); const to = items.findIndex((row) => row.id === visible[i].id); if (from < 0 || to < 0) return; void persistOrder(moveItem(items, from, to)); setDrag(null); notify("Order updated"); }}>
                <div className="entry-left"><button className="drag-handle" type="button" aria-label="Reorder trade"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></svg></button><span className="logo-preview sm">{item.chart_url ? <img src={item.chart_url} alt="" /> : item.ticker.slice(0, 1)}</span><div><div className="entry-title">{item.ticker}{item.pair ? ` / ${item.pair}` : ""}</div><div className="entry-meta">{item.status}{item.direction ? ` · ${item.direction}` : ""}{item.roi != null ? ` · ${item.roi}%` : ""}{item.is_visible ? "" : " · Hidden"}</div></div></div>
                <div className="entry-actions"><button className="small-action" type="button" onClick={() => startEdit(item)}>Edit</button><button className="small-action danger-action" type="button" onClick={() => void handleDelete(item.id)}>Delete</button></div>
              </div>
            ))}
          </div>
          <div className={`entry-form${open ? " open" : ""}`}>
            <div className="form-grid">
              <div className="field"><label className="label">Ticker *</label><input className="input" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="BTC" /></div>
              <div className="field"><label className="label">Pair</label><input className="input" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })} placeholder="USDT" /></div>
              <div className="field"><label className="label">Direction</label><select className="input" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as TradeDirection })}><option value="long">Long</option><option value="short">Short</option><option value="spot">Spot</option></select></div>
              <div className="field"><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TradeStatus })}><option value="win">Win</option><option value="loss">Loss</option><option value="breakeven">Breakeven</option><option value="open">Open</option></select></div>
              <div className="field"><label className="label">ROI %</label><input className="input" value={form.roi} onChange={(e) => setForm({ ...form, roi: e.target.value })} placeholder="12.4" /></div>
              <div className="field"><label className="label">Entry</label><input className="input" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} /></div>
              <div className="field"><label className="label">Exit</label><input className="input" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })} /></div>
              <div className="field"><label className="label">Date</label><input className="input" type="date" value={form.traded_at.slice(0, 10)} onChange={(e) => setForm({ ...form, traded_at: e.target.value })} /></div>
              <div className="field full"><label className="label">Post link</label><input className="input" value={form.post_url} onChange={(e) => setForm({ ...form, post_url: e.target.value })} placeholder="https://x.com/..." /></div>
              <div className="field full logo-field"><span className="logo-preview">{form.chart_url ? <img src={form.chart_url} alt="" /> : "1"}</span><label className="text-action">{uploading ? "Uploading..." : "Chart image"}<input type="file" accept="image/*" hidden onChange={(e) => void handleChart(e.target.files?.[0] || null, 1)} /></label><span className="logo-preview">{form.chart_url_2 ? <img src={form.chart_url_2} alt="" /> : "2"}</span><label className="text-action">Second chart<input type="file" accept="image/*" hidden onChange={(e) => void handleChart(e.target.files?.[0] || null, 2)} /></label></div>
              <div className="field full"><label className="label">Analysis</label><textarea className="textarea" value={form.analysis} onChange={(e) => setForm({ ...form, analysis: e.target.value })} placeholder="What the trade proved." /></div>
            </div>
            <div className="cv-row"><div className="cv-copy"><div className="cv-title">Visible on public profile</div><div className="cv-desc">Hidden trades stay in the record and do not publish.</div></div><button className={`switch${form.is_visible ? " on" : ""}`} type="button" aria-label="Visible on public profile" onClick={() => setForm((f) => ({ ...f, is_visible: !f.is_visible }))}><span /></button></div>
            {updatesTradeId && <div className="block"><div className="block-title">Trade updates</div><TradeUpdatesEditor userId={userId} tradeId={updatesTradeId} onError={setError} /></div>}
            {error && <div className="error">{error}</div>}
            <div className="form-actions"><button className="action accent" type="button" disabled={loading} onClick={() => void handleSubmit()}>{loading ? "Saving..." : editingId ? "Update trade" : "Add trade"}</button><button className="action" type="button" onClick={resetForm}>Cancel</button></div>
          </div>
        </div>
      )}
      <div className={`toast${toastOn ? " show" : ""}`}>{toast}</div>
    </WorkspaceShell>
  );
}
