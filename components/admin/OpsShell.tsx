import Link from "next/link";

export default function OpsShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-sm font-semibold tracking-tight">Ops</span>
            <nav className="flex items-center gap-3 text-xs text-foreground-muted">
              <Link href="/ops" className="hover:text-foreground">
                Accounts
              </Link>
              <Link href="/ops/reports" className="hover:text-foreground">
                Reports
              </Link>
              <Link href="/ops/audit" className="hover:text-foreground">
                Audit log
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs text-foreground-subtle">
            <span className="hidden sm:inline truncate max-w-[14rem]">{email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-ghost text-xs">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
