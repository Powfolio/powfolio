import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import AccountsTable from "@/components/admin/AccountsTable";

export const dynamic = "force-dynamic";

export default async function OpsDeletedPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops/deleted");
  if (!session.mfaEnrolled) redirect("/ops/mfa");
  return <AccountsTable scope="deleted" />;
}
