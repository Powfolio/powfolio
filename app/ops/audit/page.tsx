import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import AuditLog from "@/components/admin/AuditLog";

export const dynamic = "force-dynamic";

export default async function OpsAuditPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops/audit");
  if (!session.mfaEnrolled || session.aal !== "aal2") redirect("/ops/mfa");
  return <AuditLog />;
}
