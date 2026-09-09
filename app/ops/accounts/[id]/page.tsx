import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import AccountDetail from "@/components/admin/AccountDetail";

export const dynamic = "force-dynamic";

export default async function OpsAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops");
  if (!session.mfaEnrolled || session.aal !== "aal2") redirect("/ops/mfa");
  const { id } = await params;
  return <AccountDetail id={id} />;
}
