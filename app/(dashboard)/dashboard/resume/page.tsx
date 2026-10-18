import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Writing,
  CommunityItem,
  Credential,
  WorkExperience,
  Education,
} from "@/types/database";
import ResumeStudio from "@/components/profile/ResumeStudio";
import ResumeExtras from "@/components/profile/ResumeExtras";
import { normalizeSkills, cleanPlainText } from "@/lib/skills";
import { loadSiteBrand } from "@/lib/site-brand";
import { SITE_URL } from "@/lib/site";

function categoryOf(item: CommunityItem): string {
  const tags = item.tags ?? [];
  for (const t of tags) {
    const k = t.toLowerCase().trim();
    if (k === "built" || k === "built by me") return "Built by me";
    if (k === "collaboration" || k === "collab") return "Collaboration";
    if (k === "community" || k === "community role") return "Community role";
  }
  return "Project";
}

function uniqueEducation(list: Education[]): Education[] {
  const seen = new Set<string>();
  const out: Education[] = [];
  for (const e of list) {
    const key = `${(e.institution || "").toLowerCase()}|${(e.degree || "").toLowerCase()}|${e.start_year || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function looksLikeJunk(title: string, description?: string | null): boolean {
  const t = `${title} ${description || ""}`.trim();
  if (t.length < 4) return true;
  if (/^[a-z0-9]{8,}$/i.test(title.replace(/\s/g, ""))) return true;
  const letters = t.replace(/[^a-zA-Z]/g, "");
  return letters.length < 6;
}

function sep(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" / ");
}

function abs(url?: string | null) {
  if (!url) return "";
  const v = url.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export default async function DashboardResumePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/dashboard/profile");
  const p = profile as Profile;

  const [{ data: writings }, { data: community }, { data: credentials }] = await Promise.all([
    supabase.from("writings").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }),
    supabase.from("community_items").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }),
    supabase.from("credentials").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }),
  ]);

  const skillList = normalizeSkills(p.skills);
  const work = Array.isArray(p.work_experience) ? (p.work_experience as WorkExperience[]) : [];
  const edu = uniqueEducation(Array.isArray(p.education) ? (p.education as Education[]) : []);
  const writingItems = ((writings as Writing[]) ?? []).filter((w) => !looksLikeJunk(w.title, w.description));
  const projects = (community as CommunityItem[]) ?? [];
  const docs = (credentials as Credential[]) ?? [];

  const location =
    p.location_country && p.location_region
      ? `${p.location_region}, ${p.location_country}`
      : p.location_country || p.location_region || "";

  const contacts = [
    location,
    p.show_primary_email && p.primary_email ? p.primary_email : null,
    p.show_secondary_email && p.secondary_email ? p.secondary_email : null,
    p.website_url && !/pow3folio|powfolio\.xyz/i.test(p.website_url) ? p.website_url : null,
    p.github_url,
    p.x_url,
    p.telegram_url,
  ].filter(Boolean) as string[];

  const summary = cleanPlainText(p.long_bio || p.bio, 20000);
  const roleLine = skillList.slice(0, 3).map((s) => s.name).join(" / ");
  const brand = await loadSiteBrand();
  const markStyle = {
    left: `${brand.watermark_x}%`,
    top: `${brand.watermark_y}%`,
    transform: `translate(-50%, -50%) rotate(${brand.watermark_rotate}deg) scale(${brand.watermark_scale || 1})`,
    opacity: brand.watermark_opacity,
  };

  const publicUrl = `${SITE_URL}/${p.username}`;

  return (
    <ResumeStudio username={p.username}>
      <article className="resume-sheet mx-auto mb-10 max-w-[860px] overflow-hidden shadow-[0_18px_50px_rgba(16,24,20,0.08)] print:mb-0 print:max-w-none print:shadow-none">
        <div className="resume-mark" aria-hidden="true" style={{ ...markStyle, ["--wm-rotate" as string]: `${brand.watermark_rotate}deg`, ["--wm-scale" as string]: String(brand.watermark_scale || 1) }}>
          {brand.watermark_mode === "image" && brand.watermark_url ? (
            <img src={brand.watermark_url} alt="" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
          ) : brand.watermark_text}
        </div>
        <div className="resume-bar" />
        <div className="resume-inner px-8 py-7 print:px-6 print:py-5">
          <header>
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="resume-kicker text-[10px] font-semibold uppercase tracking-[0.22em]">Curriculum vitae</p>
                <h1 className="resume-name mt-1 text-[30px] font-bold leading-tight tracking-tight">{p.display_name || p.username}</h1>
              </div>
              <a href={publicUrl} className="mt-7 shrink-0 text-right no-underline">
                <span className="ml-auto block h-12 w-12 overflow-hidden rounded-full" style={{ boxShadow: "0 0 0 2px #B8863B" }}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : brand.mark_url ? (
                    <img src={brand.mark_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <p className="resume-muted mt-1 text-[10px] text-zinc-500">powfolio.xyz/{p.username}</p>
              </a>
            </div>
            <div className="resume-lead-block mt-3">
              {roleLine && <p className="resume-role text-[13px] font-medium">{roleLine}</p>}
              {p.bio && <p className="resume-muted mt-2 text-[12.5px] leading-relaxed text-zinc-600">{cleanPlainText(p.bio, 280)}</p>}
            </div>
          </header>
          <div className="resume-grid mt-6 grid grid-cols-1 gap-8 sm:grid-cols-[1.55fr_0.85fr]">
            <div className="min-w-0 space-y-6">
              {summary && (
                <section>
                  <h2 className="resume-h2 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">Profile</h2>
                  <div className="resume-rule mb-2.5" />
                  <p className="resume-summary text-[12.5px] leading-relaxed">{summary}</p>
                </section>
              )}
              {work.length > 0 && (
                <section>
                  <h2 className="resume-h2 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">Experience</h2>
                  <div className="resume-rule mb-3" />
                  <div className="space-y-4">
                    {work.map((w) => (
                      <div key={w.id}>
                        <p className="text-[13px] font-semibold">{w.role}</p>
                        <p className="text-[12px]">
                          {w.url ? <a className="resume-link" href={abs(w.url)}>{w.company}</a> : w.company}
                          <span className="resume-muted font-normal text-zinc-500"> {sep([w.employment_type === "full-time" ? "Full-time" : "Part-time", w.work_mode === "onsite" ? "Onsite" : "Remote", w.hours_per_day ? `${w.hours_per_day}h/day` : "", `${w.start_date}${w.end_date ? ` to ${w.end_date}` : " to Present"}`])}</span>
                        </p>
                        {w.description && <p className="resume-muted mt-1 text-[12.5px] leading-relaxed text-zinc-600">{cleanPlainText(w.description, 420)}</p>}
                        {w.achievements && <ul className="mt-1 list-disc pl-4 text-[12.5px] leading-relaxed text-zinc-700">{w.achievements.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => <li key={line}>{line}</li>)}</ul>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {projects.length > 0 && (
                <section>
                  <h2 className="resume-h2 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">Projects and collaborations</h2>
                  <div className="resume-rule mb-3" />
                  <div className="space-y-3">
                    {projects.map((c) => (
                      <div key={c.id}>
                        <p className="text-[13px] font-semibold">
                          {c.url ? <a className="resume-link" href={abs(c.url)}>{c.title}</a> : c.title}
                          {c.role ? <span className="font-normal text-zinc-600"> / {c.role}</span> : null}
                          {c.url ? <a className="resume-link ml-2 text-[9px] font-semibold uppercase tracking-wide" href={abs(c.url)}>{categoryOf(c)}</a> : <span className="ml-2 text-[9px] font-semibold uppercase tracking-wide">{categoryOf(c)}</span>}
                        </p>
                        {c.description && <p className="resume-muted mt-0.5 text-[12.5px] leading-relaxed text-zinc-600">{cleanPlainText(c.description, 260)}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {writingItems.length > 0 && (
                <section>
                  <h2 className="resume-h2 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">Writing and research</h2>
                  <div className="resume-rule mb-3" />
                  <div className="space-y-2">
                    {writingItems.slice(0, 8).map((w) => (
                      <div key={w.id}>
                        <p className="text-[13px] font-semibold">{w.url ? <a className="resume-link" href={abs(w.url)}>{w.title}</a> : w.title}{w.published_at ? <span className="resume-muted ml-2 text-[11px] font-normal text-zinc-500">{w.published_at}</span> : null}</p>
                        {w.description && <p className="resume-muted text-[12.5px] leading-relaxed text-zinc-600">{cleanPlainText(w.description, 180)}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <aside className="min-w-0 space-y-6">
              {skillList.length > 0 && (
                <section>
                  <h2 className="resume-h2 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">Skills</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skillList.map((s) => <span key={s.name} className="resume-chip rounded-full px-2 py-0.5 text-[11px] font-medium">{s.name}</span>)}
                  </div>
                </section>
              )}
              {edu.length > 0 && (
                <section>
                  <h2 className="resume-h2 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">Education</h2>
                  <div className="space-y-3">
                    {edu.map((e) => (
                      <div key={e.id}>
                        <p className="text-[13px] font-semibold">{e.url ? <a className="resume-link" href={abs(e.url)}>{e.degree || e.institution}</a> : (e.degree || e.institution)}</p>
                        <p className="resume-muted text-[12px] text-zinc-600">{e.institution}</p>
                        <p className="resume-muted text-[11px] text-zinc-500">{sep([e.field_of_study, e.country, [e.start_year, e.end_year].filter(Boolean).join(" to ")])}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {docs.length > 0 && (
                <section>
                  <h2 className="resume-h2 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">Credentials</h2>
                  <ul className="space-y-1.5">
                    {docs.map((d) => (
                      <li key={d.id} className="text-[12px]">
                        {d.file_url ? <a className="resume-link" href={d.file_url}>{d.title}</a> : d.title}
                        {d.issuer ? <span className="resume-muted block text-[11px] text-zinc-500">{d.issuer}</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
          <ResumeExtras userId={p.id} username={p.username} initial={p.cv_notes || null} />
          {contacts.length > 0 && (
            <section className="mt-8 border-t border-current/10 pt-4">
              <h2 className="resume-h2 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">Contact</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                {contacts.map((c) => (
                  <li key={c}>{/^https?:\/\//.test(c) || c.includes("@") || c.includes(".") ? <a className="resume-link" href={c.includes("@") && !c.startsWith("http") ? `mailto:${c}` : c.startsWith("http") ? c : `https://${c}`}>{c.replace(/^https?:\/\//, "")}</a> : c}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
    </ResumeStudio>
  );
}
