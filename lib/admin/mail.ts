const FROM = process.env.MAIL_FROM || "Powfolio <noreply@powfolio.xyz>";
const SITE = "https://powfolio.xyz";
const SUPPORT = "support@powfolio.xyz";
const PRIVACY = "privacy@powfolio.xyz";

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1a1a1a;
`;

const footer = `
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0"/>
  <p style="font-size:12px;color:#666">
    <a href="${SITE}" style="color:#B8863B">powfolio.xyz</a> · 
    <a href="mailto:${SUPPORT}" style="color:#B8863B">support</a> · 
    <a href="mailto:${PRIVACY}" style="color:#B8863B">privacy</a> · 
    <a href="${SITE}/terms" style="color:#B8863B">terms</a>
  </p>
  <p style="font-size:11px;color:#999">© 2026 Powfolio. All rights reserved.</p>
`;

function wrap(html: string) {
  return `<div style="${baseStyle}">${html}${footer}</div>`;
}

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key || !opts.to) {
    console.info("mail skipped", opts.subject, opts.to);
    return { skipped: true as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text.replace(/\n/g, "<br/>"),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("mail failed", res.status, body);
    return { skipped: false as const, ok: false as const, status: res.status, body };
  }
  return { skipped: false as const, ok: true as const };
}

export function otpEmail(opts: { code: string }) {
  const subject = "Your Powfolio verification code";
  const text = `Your Powfolio verification code is ${opts.code}. It expires in 10 minutes. If you did not request this, ignore this email. Support: ${SUPPORT}`;
  const html = wrap(`
    <h2 style="color:#B8863B">Verify your email</h2>
    <p>Use this code to verify your email address on Powfolio:</p>
    <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:28px;font-weight:bold;letter-spacing:4px;border-radius:8px;margin:16px 0">${opts.code}</div>
    <p>This code expires in <strong>10 minutes</strong>.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p><a href="${SITE}" style="color:#B8863B">Go to Powfolio</a></p>
  `);
  return { subject, text, html };
}

export function passwordResetEmail(opts: { resetUrl: string }) {
  const subject = "Reset your Powfolio password";
  const text = `You asked to reset your Powfolio password. Click here: ${opts.resetUrl}. The link expires soon. If you did not request this, ignore this email. Support: ${SUPPORT}`;
  const html = wrap(`
    <h2 style="color:#B8863B">Reset your password</h2>
    <p>You requested a password reset for your Powfolio account.</p>
    <p><a href="${opts.resetUrl}" style="display:inline-block;background:#B8863B;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600">Choose a new password</a></p>
    <p>This link expires soon. If you did not request a reset, you can ignore this email. Your password will stay the same.</p>
    <p>Questions? Contact <a href="mailto:${SUPPORT}" style="color:#B8863B">${SUPPORT}</a></p>
  `);
  return { subject, text, html };
}

export function welcomeEmail(opts: { name?: string | null; username?: string | null; origin: string }) {
  const origin = opts.origin.replace(/\/$/, "");
  const greet = opts.name?.trim() || (opts.username ? `@${opts.username}` : "there");
  const subject = "Welcome to Powfolio";
  const text = `Welcome to Powfolio, ${greet}. Your proof-of-work profile is ready. Dashboard: ${origin}/dashboard. Support: ${SUPPORT}`;
  const html = wrap(`
    <h2 style="color:#B8863B">Welcome to Powfolio</h2>
    <p>Hi <strong>${greet}</strong>,</p>
    <p>Your proof-of-work profile is ready. Add your trades, writing, community roles, and onchain activity so others can see the work you can prove.</p>
    <p><a href="${origin}/dashboard" style="display:inline-block;background:#B8863B;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600">Open your dashboard</a></p>
    ${opts.username ? `<p>Public profile: <a href="${origin}/${opts.username}" style="color:#B8863B">${origin}/${opts.username}</a></p>` : ""}
    <p>If you did not create this account, contact <a href="mailto:${SUPPORT}" style="color:#B8863B">${SUPPORT}</a>.</p>
  `);
  return { subject, text, html };
}

export function suspensionEmail(opts: { username: string; origin: string }) {
  const appeal = `${opts.origin.replace(/\/$/, "")}/${opts.username}?appeal=1`;
  const subject = `Your Powfolio account "${opts.username}" has been suspended`;
  const text = `Your Powfolio account "${opts.username}" has been suspended. You have 60 days to appeal: ${appeal}. Support: ${SUPPORT}`;
  const html = wrap(`
    <h2 style="color:#B8863B">Account suspended</h2>
    <p>Your Powfolio account <strong>${opts.username}</strong> has been suspended due to suspicious or policy-violating activity.</p>
    <p>You have <strong>60 days</strong> from the suspension date to submit an appeal before the account is permanently removed.</p>
    <p><a href="${appeal}" style="display:inline-block;background:#B8863B;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600">Submit an appeal</a></p>
    <p>Questions? Contact <a href="mailto:${SUPPORT}" style="color:#B8863B">${SUPPORT}</a>.</p>
  `);
  return { subject, text, html };
}
