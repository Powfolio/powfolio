import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules and conditions for using Powfolio.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Terms of Use"
      intro="Last updated 25 October 2026. These terms set the ground rules for using Powfolio. By creating an account or using the service, you agree to them."
    >
      <section>
        <h2 className="text-base font-semibold text-foreground">1. What Powfolio is</h2>
        <p className="mt-2">
          Powfolio is a platform for creating and sharing proof-of-work profiles. It helps people present their work, experience, onchain activity, and other evidence in one place. Powfolio is not a recruiting agency, employer, broker, exchange, investment service, financial adviser, or guarantee of employment or income.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">2. Eligibility and accounts</h2>
        <p className="mt-2">
          You may use Powfolio only if you are legally able to enter into these terms and are permitted to use the service under the laws that apply to you. You are responsible for providing accurate account information, keeping your sign-in credentials secure, and all activity carried out through your account.
        </p>
        <p className="mt-2">
          Do not create an account for another person without permission, impersonate another person, or maintain duplicate accounts in order to bypass restrictions or manipulate the service.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">3. Your content</h2>
        <p className="mt-2">
          You keep ownership of content you submit to Powfolio. You give Powfolio the permission needed to host, store, reproduce, format, display, and distribute that content as part of operating the service and the features you choose to use. This permission is limited to those purposes and does not transfer ownership of your work to Powfolio.
        </p>
        <p className="mt-2">
          You are responsible for what you publish. You must have the rights and permissions needed to upload, link to, or display your content, including images, writing, credentials, and third-party work.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">4. Public profiles</h2>
        <p className="mt-2">
          Powfolio is designed for public proof of work. Content you mark or leave available as public may be viewed, copied, linked to, indexed, or shared by other people. Do not publish information that you need to keep private.
        </p>
        <p className="mt-2">
          You can manage the visibility of supported profile sections from your dashboard. Some core profile information may remain visible while your profile is active. A suspended or restricted account may no longer appear as a normal public profile.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">5. Scores and onchain information</h2>
        <p className="mt-2">
          Profile Score, Builder Score, and similar metrics are product features designed to organize or summarize information. They are not guarantees, certifications, endorsements, employment recommendations, financial ratings, or statements of income.
        </p>
        <p className="mt-2">
          Onchain information is obtained from public blockchain data and may be incomplete, delayed, misidentified, or affected by changes outside Powfolio&apos;s control. A wallet connection verifies control of an address for the relevant feature. It does not verify that every activity associated with that address belongs to you.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">6. Acceptable use</h2>
        <p className="mt-2">You must not use Powfolio to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Impersonate another person, organization, or project.</li>
          <li>Publish fake work, fabricated achievements, manipulated metrics, or misleading credentials.</li>
          <li>Upload malware, harmful code, illegal material, or content that violates another person&apos;s rights.</li>
          <li>Harass, threaten, defraud, exploit, or deliberately target other users.</li>
          <li>Spam users or abuse forms, messaging, authentication, APIs, or other service resources.</li>
          <li>Scrape or collect data in a way that places unreasonable load on the service or bypasses access controls.</li>
          <li>Attempt to gain unauthorized access to accounts, systems, data, or administrative features.</li>
          <li>Use Powbot to obtain or expose passwords, private keys, seed phrases, or other secrets.</li>
          <li>Use the service to violate applicable law or to facilitate unlawful activity.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">7. Wallets and blockchain activity</h2>
        <p className="mt-2">
          Powfolio may let you connect a public blockchain wallet and display information associated with it. Never provide a seed phrase or private key. Blockchain transactions are controlled by the relevant network, not by Powfolio. We are not responsible for losses caused by transactions you sign, incorrect addresses, compromised wallets, network failures, smart contract risks, or third-party applications.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">8. AI and assistant features</h2>
        <p className="mt-2">
          Assistant features can generate responses from the information you provide and other available context. Responses may be wrong, incomplete, outdated, or unsuitable for your situation. Do not rely on them as professional financial, legal, medical, employment, or investment advice. You remain responsible for decisions you make based on assistant output.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">9. Third-party services and links</h2>
        <p className="mt-2">
          Powfolio may connect to external services, wallets, blockchain networks, identity providers, data sources, AI services, or websites. Those services are outside Powfolio&apos;s control and may have separate terms, privacy policies, fees, availability, and security practices. A link or integration does not mean Powfolio endorses or guarantees the third party.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">10. Moderation and enforcement</h2>
        <p className="mt-2">
          We may review accounts, content, reports, and activity when reasonably necessary to enforce these terms, protect users, investigate abuse, or maintain the service. We may remove content, limit features, suspend an account, or take other reasonable action when we believe these terms or applicable law have been violated.
        </p>
        <p className="mt-2">
          Where an appeal process is available, you may use it to challenge an account action. We do not promise that every account action will be reversible or that an appeal will result in restoration.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">11. Account deletion</h2>
        <p className="mt-2">
          You may request deletion of your account through the available account controls. Deletion removes the account from public view, but some information may remain temporarily in security, moderation, backup, or retention systems. Our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> explains the applicable retention period.
        </p>
        <p className="mt-2">
          Information already recorded on a public blockchain cannot be deleted by Powfolio.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">12. Availability and changes</h2>
        <p className="mt-2">
          We work to keep Powfolio available and reliable, but we do not promise uninterrupted or error-free operation. Features may change, be limited, or be removed as the product develops. We may also update these terms when necessary. The date at the top of this page shows when they were last updated.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">13. Disclaimers</h2>
        <p className="mt-2">
          Powfolio is provided on an as-available and as-is basis to the extent permitted by applicable law. We do not guarantee the accuracy, completeness, reliability, availability, or suitability of profiles, scores, onchain information, assistant responses, or other content on the service.
        </p>
        <p className="mt-2">
          You are responsible for evaluating information before relying on it. Powfolio does not guarantee a job, client, investment result, trading result, income, reputation outcome, or any other personal or financial result from using the service.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">14. Liability</h2>
        <p className="mt-2">
          To the maximum extent permitted by applicable law, Powfolio and those involved in operating the service will not be liable for indirect, incidental, special, consequential, exemplary, or punitive losses arising from or related to your use of the service. Nothing in these terms excludes or limits liability that cannot legally be excluded or limited.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">15. Contact</h2>
        <p className="mt-2">
          Questions about these terms can be sent to privacy@powfolio.xyz. For account or safety issues, use the support options available in the product where applicable.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Related policies</h2>
        <p className="mt-2">
          Read the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
          <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
