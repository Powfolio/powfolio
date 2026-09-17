import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Pow3Folio collects, uses, and retains account, profile, wallet, and report data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Privacy Policy"
      intro="Last updated 17 September 2026. This describes what Pow3Folio collects and why. It is a product disclosure, not legal advice."
    >
      <section>
        <h2 className="text-base font-semibold text-foreground">Who we are</h2>
        <p className="mt-2">
          Pow3Folio is a public proof-of-work profile product. Contact: privacy@pow3folio.vercel.app (replace with your live contact once a custom domain is live).
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">What we collect</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Account email and authentication data from email signup or Google, X, or GitHub.</li>
          <li>Profile fields you add: username, display name, bio, skills, work, education, links, location if you choose to save it.</li>
          <li>Wallet addresses you connect, plus onchain data fetched from public explorers to render your Onchain tab.</li>
          <li>Proof you upload or import: writing, trades, community items, airdrops, credentials, collectibles, and images.</li>
          <li>Reports you submit about another profile, including a required note and optional images.</li>
          <li>Signup IP, used only to rate-limit abuse.</li>
          <li>Pow3Bot chat text, sent through our server to the model provider so the assistant can reply.</li>
          <li>Profile snapshots and a 180-day retention archive after you delete an account, so ops can handle appeals or legal holds.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">What we do not collect</h2>
        <p className="mt-2">
          We never ask for seed phrases, private keys, or exchange passwords. Emails stay private unless you turn on the public toggle. Download CV stays in your dashboard and is not offered on the public page.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Why we use it</h2>
        <p className="mt-2">
          To run your account, render your public profile, compute Profile Score and Builder Score, stop duplicate wallets and signup floods, review abuse reports, and keep a short retention window after deletion.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Who sees what</h2>
        <p className="mt-2">
          Anything you mark public is visible on your profile URL. Super Admin ops can review accounts, reports, appeals, and retained snapshots. We do not sell profile data.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Retention</h2>
        <p className="mt-2">
          Active accounts stay until you delete them. Soft-deleted accounts are retained for 180 days, then purged unless a documented legal hold is in place. Report evidence is kept while the report is open and as needed for safety review.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Your choices</h2>
        <p className="mt-2">
          You can edit or hide profile sections, hide emails, appeal a suspension, export a CV for yourself, and request deletion from the dashboard. For a copy of retained data after deletion, contact ops through the appeal flow.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">International users</h2>
        <p className="mt-2">
          Pow3Folio is built for an international audience, including Nigeria. We aim to collect only what the product needs and to honor access, correction, and deletion requests in line with NDPA and GDPR-style basics. Hosting currently runs on Vercel and Supabase.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Related</h2>
        <p className="mt-2">
          See also the <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
          <Link href="/cookies" className="text-primary hover:underline">Cookie policy</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
