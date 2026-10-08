"use client";

import { useEffect, useState } from "react";
import { normalizeCv, readCv, type CvExtras } from "@/components/profile/CvDetails";

export default function ResumeExtras({ userId, username, initial }: { userId: string; username: string; initial?: Partial<CvExtras> | null }) {
  const [cv, setCv] = useState(normalizeCv(initial));
  useEffect(() => {
    const cloud = normalizeCv(initial);
    setCv(Object.values(cloud).some(Boolean) ? cloud : readCv(userId));
    const prev = document.title;
    document.title = `${username} PowFolio`;
    return () => { document.title = prev; };
  }, [userId, username, initial]);
  if (!cv.personality && !cv.superSkill && !cv.languages && !cv.availability) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800">Profile notes</h2>
      <div className="resume-rule mb-3" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cv.languages && <p className="text-[12.5px] text-zinc-700"><span className="font-semibold text-[#0b1f18]">Languages </span>{cv.languages}</p>}
        {cv.personality && <p className="text-[12.5px] text-zinc-700 sm:col-span-2"><span className="font-semibold text-[#0b1f18]">Personality </span>{cv.personality}</p>}
        {cv.superSkill && <p className="text-[12.5px] leading-relaxed text-zinc-700 sm:col-span-2"><span className="font-semibold text-[#0b1f18]">Super skill </span>{cv.superSkill}</p>}
        {cv.availability && <p className="text-[12.5px] text-zinc-700 sm:col-span-2"><span className="font-semibold text-[#0b1f18]">Availability </span>{cv.availability}</p>}
      </div>
    </section>
  );
}
