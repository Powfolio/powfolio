import { redirect, notFound } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import OpsShell from "@/components/admin/OpsShell";

export const dynamic = "force-dynamic";

const FOUNDER = (process.env.ADMIN_BOOTSTRAP_EMAILS || "divineemmanuel461@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops");
  const email = (session.email || "").toLowerCase();
  if (!FOUNDER.includes(email)) notFound();
  return <OpsShell email={session.email}>{children}</OpsShell>;
}
