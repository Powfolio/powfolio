import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { loadWalletNfts } from "@/lib/nfts";

export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, wallet_address, extra_wallets, last_wallet_scan_at")
    .not("wallet_address", "is", null)
    .or(`last_wallet_scan_at.is.null,last_wallet_scan_at.lt.${cutoff}`)
    .limit(8);

  let imported = 0;
  let scanned = 0;
  let cached = 0;

  for (const profile of profiles || []) {
    const addresses = [
      profile.wallet_address,
      ...(((profile.extra_wallets as Array<{ address?: string }> | null) || []).map((w) => w.address)),
    ]
      .filter((a): a is string => !!a)
      .map((a) => a.toLowerCase());

    if (!addresses.length) continue;
    scanned++;

    for (const address of [...new Set(addresses)].slice(0, 3)) {
      try {
        const nfts = await loadWalletNfts(address);
        try {
          await supabase.from("nft_cache").upsert({
            address,
            payload: nfts.slice(0, 40),
            updated_at: new Date().toISOString(),
          });
          cached++;
        } catch {
          /* cache table may not exist yet */
        }

        const { data: existing } = await supabase
          .from("collectibles")
          .select("token_id, tags, chain")
          .eq("user_id", profile.id);
        const have = new Set(
          (existing || []).map((row) => {
            const ca = ((row.tags as string[]) || []).find((t) => t.startsWith("ca:"))?.slice(3) || "";
            return `${(row.chain || "").toLowerCase()}|${ca}|${row.token_id || ""}`;
          })
        );
        const fresh = nfts.filter((n) => !have.has(`${n.chain.toLowerCase()}|${n.contract}|${n.token_id}`));
        if (!fresh.length) continue;
        const rows = fresh.slice(0, 20).map((n, i) => ({
          user_id: profile.id,
          kind: "nft",
          title: n.title,
          description: n.description,
          url: n.url,
          image_url: n.image_url,
          chain: n.chain,
          collection_name: n.collection_name,
          token_id: n.token_id,
          tags: ["imported", "autoscan", n.contract ? `ca:${n.contract}` : ""].filter(Boolean),
          is_visible: true,
          sort_order: 900 + i,
        }));
        await supabase.from("collectibles").insert(rows);
        imported += rows.length;
      } catch {
        /* skip one wallet on provider failure */
      }
    }

    await supabase.from("profiles").update({ last_wallet_scan_at: new Date().toISOString() }).eq("id", profile.id);
  }

  return NextResponse.json({ ok: true, scanned, imported, cached });
}
