import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "@/components/auth/SignupForm";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Pow3Folio profile and publish your Web3 proof of work.",
  alternates: { canonical: "/signup" },
};

export default async function SignupPage({
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
    <div className="relative flex min-h-screen flex-col">
      <header className="border-b border-border/60">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
              <span className="text-xs font-bold">P3</span>
            </div>
            <span className="font-semibold">
              Pow<span className="text-primary">3</span>Folio
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="container-app flex flex-1 flex-col items-center justify-center py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Create your Web3 proof of work portfolio.
          </p>
          <div className="mt-8">
            <SignupForm nextPath={nextPath} />
          </div>
          <p className="mt-6 text-center text-sm text-foreground-muted">
            Already have an account?{" "}
            <Link href={nextPath !== "/dashboard" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"} className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
