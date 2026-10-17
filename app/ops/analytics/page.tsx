import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import AnalyticsView from "@/components/admin/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function OpsAnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops/analytics");
  if (!session.mfaEnrolled || session.aal !== "aal2") redirect("/ops/mfa");
  return <AnalyticsView />;
}
