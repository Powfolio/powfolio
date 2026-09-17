import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Rules for using Pow3Folio, public profiles, scores, and reporting.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Terms of Use"
      intro="Last updated 17 September 2026. By creating an account you agree to these terms."
    >
      <section>
        <h2 className="text-base font-semibold text-foreground">The product</h2>
        <p className="mt-2">
          Pow3Folio lets you publish a public proof-of-work profile. It is free during Genesis. It is not a talent marketplace, broker, or investment product. Scores are product metrics, not endorsements.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Your account</h2>
        <p className="mt-2">
          You must use a real email or a supported OAuth provider. One wallet cannot be attached to two live accounts. You are responsible for what you publish. Do not impersonate someone else or upload content you do not have the right to share.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Public profiles</h2>
        <p className="mt-2">
          You control section visibility from the dashboard. About stays visible on a public profile. Writing, Trading, Community, Airdrops, and Onchain can be turned off. If an account is suspended, the public page may show a suspension overlay instead of a working profile.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Acceptable use</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>No fake work, fake metrics, or fabricated accounts.</li>
          <li>No malware, spam, harassment, or illegal content.</li>
          <li>No scraping that burdens the product or copies private fields.</li>
          <li>No asking Pow3Bot for investment advice or seed phrases.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Moderation</h2>
        <p className="mt-2">
          Ops may review reports, suspend an account, or delete content that breaks these terms. You can appeal a suspension. Soft-deleted accounts stay in a 180-day retention window before purge.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Liability</h2>
        <p className="mt-2">
          The product is provided as is. We are not responsible for hiring decisions, onchain losses, or third-party sites you link to. Third-party explorers, OAuth providers, and model providers have their own terms.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Related</h2>
        <p className="mt-2">
          Read the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
          <Link href="/cookies" className="text-primary hover:underline">Cookie policy</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
