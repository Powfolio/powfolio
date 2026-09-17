import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/LoginForm";
import SiteFooter from "@/components/legal/SiteFooter";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to manage your Pow3Folio proof of work profile.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  if (user) {
    redirect(nextPath);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4">
        <main id="main" className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <span className="text-sm font-bold">P3</span>
              </div>
              <span className="text-xl font-semibold">
                Pow<span className="text-primary">3</span>Folio
              </span>
            </Link>
            <h1 className="sr-only">Log in</h1>
            <p className="mt-3 text-sm text-foreground-muted">
              Welcome back. Log in to manage your proof of work.
            </p>
          </div>

          <LoginForm nextPath={nextPath} />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
