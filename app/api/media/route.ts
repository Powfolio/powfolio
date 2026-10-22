import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { gatewayUrls, rewriteUrl, sniffMediaType } from "@/lib/nft-media";
import { allowRate } from "@/lib/security/rate-limit";

export const revalidate = 86400;
export const maxDuration = 20;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const MAX_BYTES = 8 * 1024 * 1024;

function blockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "metadata.google.internal" || host === "metadata") return true;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true;
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

async function safeTarget(url: string) {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if (!/^https?:$/.test(parsed.protocol) || blockedHost(parsed.hostname)) return null;
  try {
    const records = await lookup(parsed.hostname, { all: true, verbatim: true });
    if (records.some((r) => blockedHost(r.address))) return null;
  } catch {
    return null;
  }
  return parsed.toString();
}

async function fetchMedia(url: string) {
  let current = url;
  for (let hop = 0; hop < 3; hop += 1) {
    const safe = await safeTarget(current);
    if (!safe) return null;
    const parsed = new URL(safe);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(parsed.toString(), {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/gif,image/*,video/mp4,video/webm,*/*;q=0.8",
          "User-Agent": UA,
        },
        redirect: "manual",
        signal: ctrl.signal,
      });
      if (res.status >= 300 && res.status < 400) {
        const next = res.headers.get("location");
        if (!next) return null;
        current = new URL(next, parsed).toString();
        continue;
      }
      if (!res.ok) return null;
      const type = (res.headers.get("content-type") || "").toLowerCase();
      if (type.includes("text/html") || type.includes("application/json") || type.includes("svg")) return null;
      const declared = Number(res.headers.get("content-length") || 0);
      if (declared > MAX_BYTES) return null;
      const buf = await res.arrayBuffer();
      if (!buf.byteLength || buf.byteLength > MAX_BYTES) return null;
      const sniffed = sniffMediaType(buf, type);
      if (!sniffed || sniffed.kind === "svg") return null;
      return { buf, type: sniffed.contentType };
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }
  return null;
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!(await allowRate(`media:${ip}`, 60, 60_000))) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }

  const target = new URL(req.url).searchParams.get("u") || "";
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  if (!/^https?:$/.test(parsed.protocol) || blockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "host" }, { status: 400 });
  }

  const candidates = [parsed.toString(), ...gatewayUrls(parsed.toString()), rewriteUrl(parsed.toString())].filter(
    (u, i, arr) => arr.indexOf(u) === i
  );

  try {
    for (const url of candidates.slice(0, 6)) {
      const hit = await fetchMedia(url);
      if (!hit) continue;
      return new NextResponse(hit.buf, {
        headers: {
          "Content-Type": hit.type,
          "Cache-Control": "public, max-age=86400, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    return NextResponse.json({ error: "fetch", code: "GATEWAY_BLOCKED" }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "failed", code: "MEDIA_TEMPORARILY_UNAVAILABLE" }, { status: 502 });
  }
}
