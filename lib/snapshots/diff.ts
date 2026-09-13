function asList(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function titles(rows: Array<Record<string, unknown>>) {
  return rows
    .map((row) => String(row.title || row.name || row.ticker || row.pair || row.id || ""))
    .filter(Boolean);
}

export type SnapshotDiff = {
  section: string;
  added: string[];
  removed: string[];
  changed: Array<{ field: string; previous: string; next: string }>;
};

export function diffSnapshots(prev: Record<string, unknown> | null, next: Record<string, unknown> | null) {
  const a = prev || {};
  const b = next || {};
  const diffs: SnapshotDiff[] = [];

  const profileA = (a.profile || {}) as Record<string, unknown>;
  const profileB = (b.profile || {}) as Record<string, unknown>;
  const fields = ["display_name", "username", "bio", "long_bio", "skills", "wallet_address", "x_url", "github_url", "website_url", "avatar_url", "banner_url"];
  const changed: SnapshotDiff["changed"] = [];
  for (const field of fields) {
    const left = JSON.stringify(profileA[field] ?? null);
    const right = JSON.stringify(profileB[field] ?? null);
    if (left !== right) {
      changed.push({
        field,
        previous: String(profileA[field] ?? ""),
        next: String(profileB[field] ?? ""),
      });
    }
  }
  if (changed.length) diffs.push({ section: "profile", added: [], removed: [], changed });

  const sections: Array<[string, string]> = [
    ["writings", "writing"],
    ["trades", "trading"],
    ["community", "community"],
    ["airdrops", "airdrops"],
    ["collectibles", "nfts"],
    ["credentials", "credentials"],
  ];
  for (const [key, label] of sections) {
    const left = titles(asList(a[key]));
    const right = titles(asList(b[key]));
    const added = right.filter((item) => !left.includes(item));
    const removed = left.filter((item) => !right.includes(item));
    if (added.length || removed.length) {
      diffs.push({ section: label, added, removed, changed: [] });
    }
  }
  return diffs;
}
