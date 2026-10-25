import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Powfolio collects, uses, shares, and protects personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Privacy Policy"
      intro="Last updated 25 October 2026. This policy explains what information Powfolio collects, why we use it, and the choices available to you."
    >
      <section>
        <h2 className="text-base font-semibold text-foreground">1. About this policy</h2>
        <p className="mt-2">
          Powfolio is a platform for creating public proof-of-work profiles. We aim to collect only the information needed to operate the service, keep it secure, and provide the features you choose to use. If you have a privacy question or request, contact privacy@powfolio.xyz.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">2. Information we collect</h2>
        <p className="mt-2">Depending on how you use Powfolio, we may collect:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong className="text-foreground">Account information:</strong> your email address, authentication details, and information associated with a connected sign-in account.</li>
          <li><strong className="text-foreground">Profile information:</strong> information you choose to publish or save, such as your username, name, bio, skills, work, education, links, location, and profile sections.</li>
          <li><strong className="text-foreground">Proof of work:</strong> content you upload or add to your profile, including writing, trading records, community work, airdrops, credentials, collectibles, images, and related links.</li>
          <li><strong className="text-foreground">Wallet information:</strong> wallet addresses you connect and publicly available blockchain information associated with those addresses when you use onchain features.</li>
          <li><strong className="text-foreground">Reports and safety information:</strong> information you submit when reporting a profile or content, including notes and optional supporting images.</li>
          <li><strong className="text-foreground">Technical and security information:</strong> limited information such as IP addresses may be processed for rate limiting, fraud prevention, abuse detection, and service security.</li>
          <li><strong className="text-foreground">Assistant conversations:</strong> messages you send to Powbot or similar in-product assistant features, when you choose to use them.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">3. Information you make public</h2>
        <p className="mt-2">
          Powfolio is built around public proof of work. Information you choose to display on your public profile can be viewed by anyone with access to that profile and may be copied, linked to, or indexed by search engines and other services. Do not publish information you expect to remain private.
        </p>
        <p className="mt-2">
          Your profile controls let you manage the visibility of supported sections. Some information is required for core profile functionality and may remain visible when the relevant feature is active.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">4. Information we do not request</h2>
        <p className="mt-2">
          Powfolio does not ask you to provide seed phrases, private keys, or exchange passwords. Never enter a seed phrase or private key into a profile, chat, form, or support request. We cannot recover or secure credentials that you disclose to us.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">5. How we use information</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>To create and maintain your account and profile.</li>
          <li>To display proof-of-work information and calculate product metrics such as Profile Score and Builder Score.</li>
          <li>To authenticate users and protect accounts and wallet connections.</li>
          <li>To prevent spam, fraud, duplicate accounts, abuse, and other misuse.</li>
          <li>To review reports, enforce our rules, investigate security issues, and handle appeals.</li>
          <li>To provide features you request, including onchain data displays and assistant responses.</li>
          <li>To maintain, improve, troubleshoot, and secure the service.</li>
          <li>To comply with applicable legal obligations and respond to lawful requests.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">6. How information is shared</h2>
        <p className="mt-2">
          We do not sell your personal information. We may disclose information when it is necessary to operate the service, protect users and the platform, provide a feature you requested, or comply with the law.
        </p>
        <p className="mt-2">
          Some features depend on external service providers, such as authentication providers, infrastructure providers, blockchain data sources, email services, and AI or model services. We share only the information reasonably needed for the relevant feature. Those providers may process information under their own terms and privacy policies.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">7. Wallets and blockchain data</h2>
        <p className="mt-2">
          Blockchain transactions are generally public and permanent. When you connect a wallet, we may use its public address to verify ownership and retrieve public onchain information for your profile. We cannot change, delete, or make private information that already exists on a public blockchain.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">8. AI and assistant features</h2>
        <p className="mt-2">
          When you use Powbot or another assistant feature, your message may be processed by an external model service so that the feature can generate a response. Do not submit passwords, private keys, seed phrases, financial credentials, or other highly sensitive information to the assistant. Assistant output may be incomplete or incorrect and should not be treated as professional financial, legal, employment, or investment advice.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">9. Retention and deletion</h2>
        <p className="mt-2">
          We retain information for as long as reasonably necessary to provide the service, meet security and operational needs, resolve disputes, enforce our rules, and comply with legal obligations. When you delete your account, it is removed from public view and placed in a limited retention period of up to 180 days before eligible retained records are permanently purged. A longer period may apply where necessary for a legal obligation, dispute, security investigation, or other legitimate reason.
        </p>
        <p className="mt-2">
          Reports and related safety evidence may be retained while a report is being handled and for as long as reasonably necessary to protect the community and enforce our rules.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">10. Your choices and rights</h2>
        <p className="mt-2">
          You can update supported profile information, change visibility settings, request account deletion, and manage other available account controls from your dashboard. You may also contact privacy@powfolio.xyz to ask about access, correction, deletion, or other privacy requests. We may need to verify your identity before completing a request.
        </p>
        <p className="mt-2">
          Depending on where you live, local privacy law may give you additional rights. We will handle valid requests in accordance with applicable law.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">11. Security</h2>
        <p className="mt-2">
          We use technical and organizational measures intended to protect information against unauthorized access, loss, misuse, or alteration. No online service can guarantee absolute security. If you believe your account or information has been compromised, contact us promptly.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">12. Children</h2>
        <p className="mt-2">
          Powfolio is not intended for children who are not legally permitted to use online services in their jurisdiction. If you believe a child has provided personal information to Powfolio without appropriate authorization, contact us so we can review the situation.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">13. Changes to this policy</h2>
        <p className="mt-2">
          We may update this policy when the service, our practices, or applicable requirements change. The date at the top of this page shows when it was last updated. If a change is material, we will take reasonable steps to make it noticeable.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Related policies</h2>
        <p className="mt-2">
          Read the <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link> and{" "}
          <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
