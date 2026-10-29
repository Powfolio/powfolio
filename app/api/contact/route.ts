import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { allowRate } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!(await allowRate(`contact-ip:${ip}`, 5, 60_000))) {
    return NextResponse.json({ error: "Too many messages. Try again in a minute." }, { status: 429 });
  }

  let body: { name?: string; email?: string; message?: string };
  try {
    body = (await req.json()) as { name?: string; email?: string; message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 120);
  const email = (body.email || "").trim().toLowerCase().slice(0, 200);
  const message = (body.message || "").trim().slice(0, 4000);
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    const admin = createServiceClient();
    const { error } = await admin.from("contact_enquiries").insert({
      name,
      email,
      message,
      source: "contact",
    });
    if (error) {
      console.error("[contact] insert failed", error.message);
      return NextResponse.json({ error: "Could not save the message." }, { status: 500 });
    }
  } catch (err) {
    console.error("[contact] insert error", err);
    return NextResponse.json({ error: "Could not save the message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
