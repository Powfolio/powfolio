"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ops", label: "Accounts", hint: "Every builder" },
  { href: "/ops/reports", label: "Reports", hint: "3-day groups" },
  { href: "/ops/audit", label: "Audit log", hint: "Append-only" },
];

function isActive(href: string, pathname: string) {
  if (href === "/ops") return pathname === "/ops" || pathname.startsWith("/ops/accounts");
  return pathname.startsWith(href);
}

export default function OpsShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/ops";
  const onMfa = pathname.startsWith("/ops/mfa");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.06),transparent_24%)]" />

      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/ops" className="flex shrink-0 items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-zinc-950 shadow-[0_0_24px_rgba(16,185,129,0.28)]">
                P3
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold">Pow3Folio Ops</span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-foreground-subtle">
                  Super admin
                </span>
              </span>
            </Link>
            {!onMfa && (
              <nav className="hidden items-center gap-1 md:flex">
                {LINKS.map((link) => {
                  const active = isActive(link.href, pathname);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-3 py-2 transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
                      }`}
                    >
                      <span className="block text-sm font-medium leading-none">{link.label}</span>
                      <span className="mt-1 block text-[10px] leading-none text-foreground-subtle">{link.hint}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden max-w-[16rem] truncate rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-foreground-muted sm:block">
              {email}
            </div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-ghost text-xs">
                Sign out
              </button>
            </form>
          </div>
        </div>
        {!onMfa && (
          <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
            {LINKS.map((link) => {
              const active = isActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                    active ? "bg-primary text-zinc-950" : "bg-surface text-foreground-muted"
                  }`}
                >
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
