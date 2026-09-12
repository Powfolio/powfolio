import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import AppealsQueue from "@/components/admin/AppealsQueue";

export const dynamic = "force-dynamic";

export default async function OpsAppealsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops/appeals");
  if (!session.mfaEnrolled) redirect("/ops/mfa");
  return <AppealsQueue />;
}
