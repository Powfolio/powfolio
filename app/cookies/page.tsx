import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookies and local storage Powfolio uses to keep sessions and preferences.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Cookie Policy"
      intro="Last updated 17 September 2026. Powfolio keeps cookies to a minimum."
    >
      <section>
        <h2 className="text-base font-semibold text-foreground">Necessary</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Auth session cookies from Supabase so you stay signed in.</li>
          <li>Theme preference in local storage (`powfolio-theme`).</li>
          <li>Cookie acknowledgement (`powfolio-cookie-ack`).</li>
          <li>A pending wallet address in local storage only until you finish sign-in.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">What we do not use today</h2>
        <p className="mt-2">
          No advertising cookies. No third-party marketing pixels. Analytics is not wired in yet. If that changes, this page will name the tool and the banner will offer a real choice.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Control</h2>
        <p className="mt-2">
          You can clear site data in your browser. Signing out ends the auth session. Necessary cookies are required for login and dashboard access.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Related</h2>
        <p className="mt-2">
          See the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
