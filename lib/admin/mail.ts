const FROM = process.env.MAIL_FROM || "Pow3Folio <beth.t@example.com>";

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
  const subject = `Your Pow3Folio account "${opts.username}" has been suspended`;
  const text = [
    `Your Pow3Folio account "${opts.username}" has been suspended.`,
    "",
    "We found some suspicious or malicious activities or information in your account which has resulted in this suspension.",
    "",
    "If you think this is a mistake, you have 60 days from when the account was suspended to submit an appeal before your account is permanently deleted.",
    "",
    `Appeal: ${appeal}`,
  ].join("\n");
  const html = `<p>Your Pow3Folio account <strong>${opts.username}</strong> has been suspended.</p><p>We found some suspicious or malicious activities or information in your account which has resulted in this suspension.</p><p>If you think this is a mistake, you have <strong>60 days</strong> from when the account was suspended to submit an appeal before your account is permanently deleted.</p><p><a href="${appeal}">Appeal</a></p>`;
  return { subject, text, html };
}
