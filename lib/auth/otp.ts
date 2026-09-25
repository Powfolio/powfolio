import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const COOKIE = "pow3folio_email_otp";
const MAX_AGE_SEC = 10 * 60;
const RESEND_SEC = 30;

function secret() {
  return (
    process.env.OTP_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "pow3folio-otp-dev"
  );
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function generateOtpCode() {
  const n = randomBytes(2).readUInt16BE(0) % 10000;
  return n.toString().padStart(4, "0");
}

export function otpCookieName() {
  return COOKIE;
}

export function buildOtpCookie(email: string, code: string) {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const nonce = randomBytes(8).toString("hex");
  const emailNorm = email.trim().toLowerCase();
  const payload = `${emailNorm}|${exp}|${nonce}`;
  const mac = sign(`${payload}|${code}`);
  return {
    value: `${payload}|${mac}`,
    maxAge: MAX_AGE_SEC,
    resendSec: RESEND_SEC,
  };
}

export function verifyOtpCookie(cookieValue: string | undefined, email: string, code: string) {
  if (!cookieValue) return { ok: false as const, error: "No verification code has been sent." };
  const parts = cookieValue.split("|");
  if (parts.length !== 4) return { ok: false as const, error: "Invalid verification session." };
  const [cookieEmail, expRaw, nonce, mac] = parts;
  const emailNorm = email.trim().toLowerCase();
  if (cookieEmail !== emailNorm) {
    return { ok: false as const, error: "Code was sent to a different email." };
  }
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false as const, error: "That code has expired. Request a new one." };
  }
  const expected = sign(`${cookieEmail}|${exp}|${nonce}|${code.trim()}`);
  const a = Buffer.from(mac, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false as const, error: "Incorrect code. Please try again." };
  }
  return { ok: true as const };
}

export function buildVerifiedCookie(email: string) {
  const emailNorm = email.trim().toLowerCase();
  const exp = Date.now() + 30 * 60 * 1000;
  const payload = `verified|${emailNorm}|${exp}`;
  return {
    name: "pow3folio_email_verified",
    value: `${payload}|${sign(payload)}`,
    maxAge: 30 * 60,
  };
}

export function isEmailVerifiedCookie(cookieValue: string | undefined, email: string) {
  if (!cookieValue) return false;
  const parts = cookieValue.split("|");
  if (parts.length !== 4) return false;
  const [tag, cookieEmail, expRaw, mac] = parts;
  if (tag !== "verified") return false;
  if (cookieEmail !== email.trim().toLowerCase()) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = sign(`${tag}|${cookieEmail}|${exp}`);
  const a = Buffer.from(mac, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
