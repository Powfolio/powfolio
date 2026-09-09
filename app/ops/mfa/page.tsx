import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import MfaSetup from "@/components/admin/MfaSetup";

export const dynamic = "force-dynamic";

export default async function OpsMfaPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops/mfa");
  if (session.mfaEnrolled && session.aal === "aal2") redirect("/ops");
  return <MfaSetup enrolled={session.mfaEnrolled} />;
}
