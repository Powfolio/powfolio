"use client";

import { useEffect, useState } from "react";

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

export function readCv(userId: string): CvExtras {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(cvKey(userId));
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

export default function CvDetails({ userId }: { userId: string }) {
  const [form, setForm] = useState<CvExtras>(empty);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(readCv(userId)); }, [userId]);

  function save() {
    localStorage.setItem(cvKey(userId), JSON.stringify(form));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <section className={`panel${true ? " active" : ""}`} role="tabpanel">
      <div className="section-intro">
        <h2>CV details</h2>
        <p>These details are for the downloaded CV only. They do not appear on the public profile unless you later choose to show them.</p>
      </div>
      <div className="block">
        <div className="form-grid">
          <div className="field"><label className="label">Languages</label><input className="input" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English, Igbo" /></div>
          <div className="field full"><label className="label">Personality</label><input className="input" value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} placeholder="Calm under pressure, direct, community-first" /></div>
          <div className="field full"><label className="label">Super skill</label><textarea className="textarea" value={form.superSkill} onChange={(e) => setForm({ ...form, superSkill: e.target.value })} placeholder="The unfair advantage an employer should hire you for." /></div>
          <div className="field full"><label className="label">Availability</label><input className="input" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Open to remote roles, internships, or contract work" /></div>
        </div>
        <div className="form-actions"><button className="action accent" type="button" onClick={save}>{saved ? "Saved" : "Save CV details"}</button></div>
      </div>
    </section>
  );
}
