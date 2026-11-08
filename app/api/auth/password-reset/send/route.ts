import { NextRequest, NextResponse } from "next/server";
import { passwordResetEmail, sendTransactionalEmail } from "@/lib/admin/mail";
import { buildOtpCookie, generateOtpCode } from "@/lib/auth/otp";

export const runtime = "nodejs";

const COOLDOWN_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@") || email.length > 160) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }

    const lastSent = req.cookies.get("powfolio_pwreset_sent")?.value;
    if (lastSent && Date.now() - Number(lastSent) < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - Number(lastSent))) / 1000);
      return NextResponse.json(
        { ok: false, error: `Please wait ${Math.ceil(wait / 60)} minutes before requesting another reset.`, retryAfterSeconds: wait },
        { status: 429, headers: { "Retry-After": String(wait) } }
      );
    }

    const code = generateOtpCode();
    const cookie = buildOtpCookie(email, code);
    const origin = req.headers.get("origin") || "https://powfolio.xyz";
    const template = passwordResetEmail({ resetUrl: `${origin}/auth/update-password?code=${code}` });

    const mailed = await sendTransactionalEmail({
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (mailed.skipped) {
      return NextResponse.json({ ok: false, error: "Email service is not configured." }, { status: 503 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("powfolio_pwreset", cookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: cookie.maxAge,
      path: "/",
    });
    res.cookies.set("powfolio_pwreset_sent", String(Date.now()), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  } catch (err) {
    console.error("pwreset send error", err);
    return NextResponse.json({ ok: false, error: "Could not send reset code." }, { status: 500 });
  }
}
