import { createServiceClient } from "@/lib/supabase/admin";

function norm(address: string) {
  return address.trim().toLowerCase();
}

export async function walletOwner(address: string): Promise<{ userId: string; username: string | null } | null> {
  const wanted = norm(address);
  if (!wanted || wanted.length < 20) return null;
  const admin = createServiceClient();

  const { data: rpcRows, error: rpcErr } = await admin.rpc("find_wallet_owner", { addr: wanted });
  if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length) {
    const row = rpcRows[0] as { owner_id?: string; owner_username?: string };
    if (row.owner_id) return { userId: row.owner_id, username: row.owner_username || null };
  }

  const { data } = await admin
    .from("profiles")
    .select("id, username, wallet_address")
    .ilike("wallet_address", wanted)
    .limit(5);
  for (const row of data || []) {
    if ((row.wallet_address || "").toLowerCase() === wanted) {
      return { userId: row.id, username: row.username };
    }
  }
  return null;
}

export async function assertWalletFree(address: string, excludeUserId?: string) {
  const owner = await walletOwner(address);
  if (owner && owner.userId !== excludeUserId) {
    return {
      ok: false as const,
      message: "This wallet is already linked to another Powfolio account.",
    };
  }
  return { ok: true as const, message: null };
}
