import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Powfolio uses cookies and local browser storage.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Cookie Policy"
      intro="Last updated 25 October 2026. Powfolio uses a small number of cookies and browser storage items that help the service work and stay secure."
    >
      <section>
        <h2 className="text-base font-semibold text-foreground">1. What cookies are</h2>
        <p className="mt-2">
          Cookies are small pieces of information stored by your browser. Powfolio also uses local browser storage for a few preferences and temporary values. This policy explains the types of storage the service currently uses and why.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">2. Necessary cookies</h2>
        <p className="mt-2">
          These cookies support sign-in, account verification, wallet verification, security, and other core functions. They are not used for advertising or cross-site marketing.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong className="text-foreground">Sign-in session:</strong> keeps your authenticated session active so protected pages can work.</li>
          <li><strong className="text-foreground">Email verification:</strong> temporarily stores information needed to verify a sign-in code. Verification data is short-lived and expires automatically.</li>
          <li><strong className="text-foreground">Wallet verification:</strong> temporarily stores a security nonce while a wallet connection is being verified. These values expire after a short period.</li>
          <li><strong className="text-foreground">Security and rate limiting:</strong> may use short-lived browser values to help prevent abuse and repeated failed attempts.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">3. Browser storage</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong className="text-foreground">Theme preference:</strong> remembers whether you prefer the available light or dark appearance.</li>
          <li><strong className="text-foreground">Cookie notice:</strong> remembers that you have acknowledged the cookie notice so it does not appear on every visit.</li>
          <li><strong className="text-foreground">Temporary wallet state:</strong> may temporarily retain a wallet address while you complete a sign-in flow.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">4. What we do not use</h2>
        <p className="mt-2">
          Powfolio currently does not use advertising cookies, third-party marketing pixels, or analytics cookies. We do not use cookies to build advertising profiles or sell browsing activity to advertisers.
        </p>
        <p className="mt-2">
          If we introduce optional analytics, advertising, or other non-essential tracking in the future, we will update this policy and provide the controls required by applicable law before using those technologies where consent is required.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">5. Third-party services</h2>
        <p className="mt-2">
          Some features may involve external services for authentication, security, blockchain data, email delivery, or other functionality. Those services may set or access their own cookies or similar technologies when you interact with them. Their practices are governed by their own policies, not this Cookie Policy.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">6. Managing cookies</h2>
        <p className="mt-2">
          Most browsers let you view, delete, block, or restrict cookies through their privacy settings. Blocking necessary cookies can prevent sign-in, wallet verification, or other parts of Powfolio from working correctly.
        </p>
        <p className="mt-2">
          You can also clear Powfolio site data from your browser at any time. This may sign you out, reset your theme preference, and cause the cookie notice to appear again.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">7. Changes to this policy</h2>
        <p className="mt-2">
          We may update this policy when the technologies used by Powfolio change. The date at the top of this page shows when it was last updated.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Related policies</h2>
        <p className="mt-2">
          See the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
