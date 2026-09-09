import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import AccountsTable from "@/components/admin/AccountsTable";

export const dynamic = "force-dynamic";

export default async function OpsAccountsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops");
  if (!session.mfaEnrolled || session.aal !== "aal2") redirect("/ops/mfa");
  return <AccountsTable />;
}
