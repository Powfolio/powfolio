"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ops", label: "Accounts" },
  { href: "/ops/reports", label: "Reports" },
  { href: "/ops/audit", label: "Audit log" },
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
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/ops" className="flex shrink-0 items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                P3
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold leading-none">Ops</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
                  Super admin
                </span>
              </span>
            </Link>
            {!onMfa && (
              <nav className="flex items-center gap-1 text-sm">
                {LINKS.map((link) => {
                  const active = isActive(link.href, pathname);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-lg px-3 py-1.5 transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground-subtle">
            <span className="hidden max-w-[16rem] truncate sm:inline">{email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-ghost text-xs">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
