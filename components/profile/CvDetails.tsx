"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CvExtras = {
  personality: string;
  superSkill: string;
  languages: string;
  availability: string;
};

const empty: CvExtras = { personality: "", superSkill: "", languages: "", availability: "" };

export function cvKey(userId: string) {
  return `pow3-cv-${userId}`;
}

export function normalizeCv(raw: unknown): CvExtras {
  if (!raw || typeof raw !== "object") return empty;
  const v = raw as Partial<CvExtras>;
  return {
    personality: v.personality || "",
    superSkill: v.superSkill || "",
    languages: v.languages || "",
    availability: v.availability || "",
  };
}

export function readCv(userId: string): CvExtras {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(cvKey(userId));
    return raw ? normalizeCv(JSON.parse(raw)) : empty;
  } catch {
    return empty;
  }
}

export default function CvDetails({ userId, initial }: { userId: string; initial?: Partial<CvExtras> | null }) {
  const [form, setForm] = useState<CvExtras>(initial && Object.values(initial).some(Boolean) ? normalizeCv(initial) : empty);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const local = readCv(userId);
    const cloud = normalizeCv(initial);
    const next = Object.values(cloud).some(Boolean) ? cloud : local;
    setForm(next);
    if (!Object.values(cloud).some(Boolean) && Object.values(local).some(Boolean)) {
      const supabase = createClient();
      void supabase.from("profiles").update({ cv_notes: local }).eq("id", userId);
    }
  }, [userId, initial]);

  async function save() {
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").update({ cv_notes: form }).eq("id", userId);
    if (err) {
      setError(err.message.includes("cv_notes") ? "Run supabase/cv_notes.sql in Supabase, then save again." : err.message);
      return;
    }
    localStorage.setItem(cvKey(userId), JSON.stringify(form));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <section className="panel active" role="tabpanel">
      <div className="section-intro">
        <h2>CV details</h2>
        <p>These details are for the downloaded CV only. They stay on your account and do not appear on the public profile.</p>
      </div>
      <div className="block">
        <div className="form-grid">
          <div className="field"><label className="label">Languages</label><input className="input" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English, Igbo" /></div>
          <div className="field full"><label className="label">Personality</label><input className="input" value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} placeholder="Calm under pressure, direct, community-first" /></div>
          <div className="field full"><label className="label">Super skill</label><textarea className="textarea" value={form.superSkill} onChange={(e) => setForm({ ...form, superSkill: e.target.value })} placeholder="The unfair advantage an employer should hire you for." /></div>
          <div className="field full"><label className="label">Availability</label><input className="input" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Open to remote roles, internships, or contract work" /></div>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="form-actions"><button className="action accent" type="button" onClick={() => void save()}>{saved ? "Saved" : "Save CV details"}</button></div>
      </div>
    </section>
  );
}
