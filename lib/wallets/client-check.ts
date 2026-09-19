export async function checkWalletAvailable(address: string) {
  const res = await fetch("/api/wallets/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const json = await res.json().catch(() => ({}));
  return {
    ok: Boolean(json.ok),
    error: (json.error as string) || "This wallet is already linked to another Powfolio account.",
  };
}
