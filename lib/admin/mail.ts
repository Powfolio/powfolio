const FROM = process.env.MAIL_FROM || "Powfolio <beth.t@example.com>";

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
    return { skipped: false as const, ok: false as const };
  }
  return { skipped: false as const, ok: true as const };
}

export function suspensionEmail(opts: { username: string; origin: string }) {
  const appeal = `${opts.origin.replace(/\/$/, "")}/${opts.username}?appeal=1`;
  const subject = `Your Powfolio account "${opts.username}" has been suspended`;
  const text = [
    `Your Powfolio account "${opts.username}" has been suspended.`,
    "",
    "We found some suspicious or malicious activities or information in your account which has resulted in this suspension.",
    "",
    "If you think this is a mistake, you have 60 days from when the account was suspended to submit an appeal before your account is permanently deleted.",
    "",
    `Appeal: ${appeal}`,
  ].join("\n");
  const html = `<p>Your Powfolio account <strong>${opts.username}</strong> has been suspended.</p><p>We found some suspicious or malicious activities or information in your account which has resulted in this suspension.</p><p>If you think this is a mistake, you have <strong>60 days</strong> from when the account was suspended to submit an appeal before your account is permanently deleted.</p><p><a href="${appeal}">Appeal</a></p>`;
  return { subject, text, html };
}

export function otpEmail(opts: { code: string }) {
  const subject = "Your Powfolio verification code";
  const text = [
    `Your Powfolio email verification code is ${opts.code}.`,
    "",
    "It expires in 10 minutes.",
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = `<p>Your Powfolio email verification code is:</p><p style="font-size:28px;letter-spacing:8px;font-weight:700">${opts.code}</p><p>This code expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p>`;
  return { subject, text, html };
}

export function passwordResetEmail(opts: { resetUrl: string }) {
  const subject = "Reset your Powfolio password";
  const text = [
    "You asked to reset the password on your Powfolio account.",
    "",
    `Open this link to choose a new password: ${opts.resetUrl}`,
    "",
    "The link expires soon. If you did not request a reset, you can ignore this email. Your password will stay the same.",
  ].join("\n");
  const html = `<p>You asked to reset the password on your Powfolio account.</p><p><a href="${opts.resetUrl}">Choose a new password</a></p><p>The link expires soon. If you did not request a reset, ignore this email. Your password will stay the same.</p>`;
  return { subject, text, html };
}

export function welcomeEmail(opts: { name?: string | null; username?: string | null; origin: string }) {
  const origin = opts.origin.replace(/\/$/, "");
  const greet = opts.name?.trim() || (opts.username ? `@${opts.username}` : "there");
  const subject = "Welcome to Powfolio";
  const text = [
    `Welcome to Powfolio, ${greet}.`,
    "",
    "Your proof-of-work profile is ready. Add your work, connect a wallet, and link GitHub or X when you want them on the public page.",
    "",
    `Open your dashboard: ${origin}/dashboard`,
    opts.username ? `Public profile: ${origin}/${opts.username}` : "",
    "",
    "If you did not create this account, contact support@powfolio.xyz.",
  ]
    .filter(Boolean)
    .join("\n");
  const html = `<p>Welcome to Powfolio, <strong>${greet}</strong>.</p><p>Your proof-of-work profile is ready. Add your work, connect a wallet, and link GitHub or X when you want them on the public page.</p><p><a href="${origin}/dashboard">Open your dashboard</a></p>${
    opts.username ? `<p>Public profile: <a href="${origin}/${opts.username}">${origin}/${opts.username}</a></p>` : ""
  }<p>If you did not create this account, contact support@powfolio.xyz.</p>`;
  return { subject, text, html };
}
