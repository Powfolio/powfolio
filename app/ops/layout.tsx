import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import OpsShell from "@/components/admin/OpsShell";

export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops");
  return <OpsShell email={session.email}>{children}</OpsShell>;
}
