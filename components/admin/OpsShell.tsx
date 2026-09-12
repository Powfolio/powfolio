"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ops", label: "Accounts" },
  { href: "/ops/reports", label: "Reports" },
  { href: "/ops/appeals", label: "Appeals" },
  { href: "/ops/deleted", label: "Deleted" },
  { href: "/ops/audit", label: "Audit log" },
];

function isActive(href: string, pathname: string) {
  if (href === "/ops") return pathname === "/ops" || pathname.startsWith("/ops/accounts");
  return pathname.startsWith(href);
}

export default function OpsShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname() || "/ops";
  const onMfa = pathname.startsWith("/ops/mfa");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/ops" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-zinc-950">P3</span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">Pow3Folio Ops</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-foreground-subtle">Super admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden max-w-[16rem] truncate text-[11px] text-foreground-muted sm:block">{email}</div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-ghost text-xs">Sign out</button>
            </form>
          </div>
        </div>
        {!onMfa && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
            {LINKS.map((link) => {
              const active = isActive(link.href, pathname);
              return (
                <Link key={link.href} href={link.href} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-primary text-zinc-950" : "text-foreground-muted hover:text-foreground"}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
