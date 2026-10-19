import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_MESSAGES = 40;
const MAX_CONTENT = 4000;

type Msg = { role: "user" | "assistant"; content: string };

function sanitize(messages: unknown): Msg[] {
  if (!Array.isArray(messages)) return [];
  const out: Msg[] = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: string }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const cleaned = content.slice(0, MAX_CONTENT).trim();
    if (!cleaned) continue;
    out.push({ role, content: cleaned });
  }
  return out.slice(-MAX_MESSAGES);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ messages: [], signedIn: false });
    }

    const admin = createServiceClient();
    const { data, error } = await admin
      .from("profile_private")
      .select("ai_chat_history")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      if (error.message?.includes("profile_private") || error.code === "42P01") {
        return NextResponse.json({ messages: [], signedIn: true, needsMigration: true });
      }
      return NextResponse.json({ messages: [], signedIn: true });
    }

    const messages = sanitize((data as { ai_chat_history?: unknown } | null)?.ai_chat_history);
    return NextResponse.json({ messages, signedIn: true });
  } catch {
    return NextResponse.json({ messages: [], signedIn: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, reason: "guest" });
    }

    const body = await req.json().catch(() => null);
    const messages = sanitize(body?.messages);

    const admin = createServiceClient();
    const { error } = await admin.from("profile_private").upsert(
      { user_id: user.id, ai_chat_history: messages, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    if (error) {
      if (error.message?.includes("profile_private") || error.code === "42P01") {
        return NextResponse.json(
          { ok: false, needsMigration: true, error: "Run the profile_private SQL migration in Supabase." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, count: messages.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
