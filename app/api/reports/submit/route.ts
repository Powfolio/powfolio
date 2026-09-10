import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkReportEligibility } from "@/lib/reports/eligibility";
import {
  GROUP_WINDOW_MS,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  REPORT_REASONS,
} from "@/lib/reports/constants";

export const runtime = "nodejs";

const ALLOWED = new Set(REPORT_REASONS.map((r) => r.id));

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in to submit a report." }, { status: 401 });
  }

  const form = await req.formData();
  const targetId = String(form.get("targetId") || "");
  const note = String(form.get("note") || "").trim();
  const reasonsRaw = String(form.get("reasons") || "");
  const reasons = reasonsRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => ALLOWED.has(s as never));

  if (!targetId) return NextResponse.json({ error: "Missing profile" }, { status: 400 });
  if (!reasons.length) return NextResponse.json({ error: "Choose at least one reason" }, { status: 400 });
  if (note.length < 8) {
    return NextResponse.json({ error: "Add a short written note so we can review this." }, { status: 400 });
  }
  if (note.length > 2000) {
    return NextResponse.json({ error: "Keep the note under 2000 characters." }, { status: 400 });
  }

  try {
    const gate = await checkReportEligibility(user, targetId);
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 403 });

    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_ATTACHMENTS) {
      return NextResponse.json({ error: "You can attach up to 3 images." }, { status: 400 });
    }
    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json({ error: "Each image must be 5MB or smaller." }, { status: 400 });
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Attachments must be images." }, { status: 400 });
      }
    }

    const admin = createServiceClient();
    const since = new Date(Date.now() - GROUP_WINDOW_MS).toISOString();
    const { data: existing } = await admin
      .from("report_groups")
      .select("id, report_count")
      .eq("reported_id", targetId)
      .gte("latest_at", since)
      .order("latest_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let groupId = existing?.id as string | undefined;
    if (!groupId) {
      const { data: created, error: groupErr } = await admin
        .from("report_groups")
        .insert({ reported_id: targetId, report_count: 0 })
        .select("id")
        .single();
      if (groupErr || !created) {
        return NextResponse.json({ error: "Could not open a report group" }, { status: 500 });
      }
      groupId = created.id;
    }

    const attachments: string[] = [];
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
      const path = `${targetId}/${groupId}/${user.id}-${Date.now()}-${attachments.length}.${ext || "jpg"}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await admin.storage.from("report-evidence").upload(path, buf, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (!upErr) attachments.push(path);
    }

    const { data: report, error: insErr } = await admin
      .from("profile_reports")
      .insert({
        group_id: groupId,
        reporter_id: user.id,
        reported_id: targetId,
        reasons,
        note,
        attachments,
        status: "pending",
      })
      .select("id")
      .single();
    if (insErr || !report) {
      return NextResponse.json({ error: "Could not save the report" }, { status: 500 });
    }

    const nextCount = (existing?.report_count || 0) + 1;
    await admin
      .from("report_groups")
      .update({ report_count: nextCount, latest_at: new Date().toISOString() })
      .eq("id", groupId);

    return NextResponse.json({ ok: true, id: report.id });
  } catch (e) {
    console.error("report submit", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
