import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin/auth";
import OpsShell from "@/components/admin/OpsShell";

export const dynamic = "force-dynamic";

const FOUNDER = (process.env.ADMIN_BOOTSTRAP_EMAILS || "divineemmanuel461@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = (user?.email || "").toLowerCase();
  if (!user || !FOUNDER.includes(email)) {
    notFound();
  }

  const session = await getAdminSession();
  if (!session) notFound();
  return <OpsShell email={session.email}>{children}</OpsShell>;
}
