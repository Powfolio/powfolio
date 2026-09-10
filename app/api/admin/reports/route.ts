import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdminMfa();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const status = req.nextUrl.searchParams.get("status") || "all";

  try {
    const admin = createServiceClient();
    const { data: groups, error } = await admin
      .from("report_groups")
      .select("id, reported_id, report_count, latest_at, window_started_at")
      .order("report_count", { ascending: false })
      .order("latest_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const groupIds = (groups || []).map((g) => g.id);
    const { data: reports } = groupIds.length
      ? await admin
          .from("profile_reports")
          .select("id, group_id, reasons, note, status, created_at, reporter_id, reported_id, attachments")
          .in("group_id", groupIds)
          .order("created_at", { ascending: false })
      : { data: [] as never[] };

    const userIds = new Set<string>();
    for (const g of groups || []) userIds.add(g.reported_id);
    for (const r of reports || []) {
      userIds.add(r.reporter_id);
      userIds.add(r.reported_id);
    }

    const profiles: Record<string, { username: string; displayName: string | null }> = {};
    const emails: Record<string, string | null> = {};
    if (userIds.size) {
      const { data: profs } = await admin.from("profiles").select("id, username, display_name").in("id", [...userIds]);
      for (const p of profs || []) {
        profiles[p.id] = { username: p.username, displayName: p.display_name };
      }
      for (const id of userIds) {
        const { data } = await admin.auth.admin.getUserById(id);
        emails[id] = data.user?.email || null;
      }
    }

    let items = (groups || []).map((g) => {
      const kids = (reports || []).filter((r) => r.group_id === g.id);
      const statuses = new Set(kids.map((r) => r.status));
      let groupStatus = "pending";
      if (kids.length && kids.every((r) => r.status === "dismissed")) groupStatus = "dismissed";
      else if (kids.length && kids.every((r) => r.status === "actioned")) groupStatus = "actioned";
      else if (statuses.has("reviewed") && !statuses.has("pending")) groupStatus = "reviewed";
      else if (statuses.has("pending")) groupStatus = "pending";
      const reported = profiles[g.reported_id] || { username: "unknown", displayName: null };
      return {
        id: g.id,
        reportedId: g.reported_id,
        reportedUsername: reported.username,
        reportedEmail: emails[g.reported_id] || null,
        count: g.report_count || kids.length,
        latestAt: g.latest_at,
        status: groupStatus,
        reports: kids.map((r) => ({
          id: r.id,
          reasons: r.reasons,
          note: r.note,
          status: r.status,
          createdAt: r.created_at,
          attachments: r.attachments || [],
          reporterUsername: profiles[r.reporter_id]?.username || "unknown",
          reporterEmail: emails[r.reporter_id] || null,
        })),
      };
    });

    if (status !== "all") items = items.filter((i) => i.status === status);
    return NextResponse.json({ items });
  } catch (e) {
    console.error("admin reports", e);
    return NextResponse.json({ error: "Could not load reports" }, { status: 500 });
  }
}
