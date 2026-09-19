import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/LoginForm";
import SiteFooter from "@/components/legal/SiteFooter";
import BrandMark from "@/components/ui/BrandMark";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to manage your Powfolio proof of work profile.",
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
            <div className="inline-flex justify-center">
              <BrandMark />
            </div>
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
