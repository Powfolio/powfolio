import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthExperience from "@/components/auth/AuthExperience";
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

  return <AuthExperience initialMode="signin" nextPath={nextPath} />;
}
