import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import BrandStudio from "@/components/admin/BrandStudio";

export const dynamic = "force-dynamic";

export default async function OpsBrandingPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?next=/ops/branding");
  if (!session.mfaEnrolled || session.aal !== "aal2") redirect("/ops/mfa");
  return <BrandStudio />;
}
