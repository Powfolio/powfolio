import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import ReportsQueue from "@/components/admin/ReportsQueue";

export const dynamic = "force-dynamic";

export default async function OpsReportsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops/reports");
  if (!session.mfaEnrolled || session.aal !== "aal2") redirect("/ops/mfa");
  return <ReportsQueue />;
}
