import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthExperience from "@/components/auth/AuthExperience";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Powfolio profile and publish your Web3 proof of work.",
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

  return <AuthExperience initialMode="signup" nextPath={nextPath} />;
}
