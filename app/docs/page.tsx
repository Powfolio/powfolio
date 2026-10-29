import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation | POWFOLIO",
  description: "How Powfolio works: profiles, proof sections, scores, and public links.",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen">
      <section className="container-app px-5 py-16 sm:px-8 sm:py-20">
        <Link href="/" className="text-sm text-foreground-subtle hover:text-foreground">← Back to Powfolio</Link>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground-subtle">Documentation</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">How Powfolio works</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">
          Powfolio is a public proof-of-work profile. One link for your identity, scores, writing, trading, projects, and onchain record.
        </p>

        <div className="mt-10 max-w-2xl space-y-6 text-sm leading-7 text-foreground-muted">
          <div>
            <h2 className="text-base font-semibold text-foreground">Profile</h2>
            <p>Set your name, username, bio, skills, work, education, and contacts. The public page is powfolio.xyz/yourusername.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Proof sections</h2>
            <p>Projects, Research, Trading, Onchain, and Ecosystem. Turn sections on or off from the dashboard. Hidden sections stay saved.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Scores</h2>
            <p>Profile Score is setup quality. Builder Score is evidence. Neither is verified income.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Onchain</h2>
            <p>Connect a wallet. Saved data is visible to anyone on the public profile. No viewer wallet connection is required.</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">CV</h2>
            <p>Download from the dashboard only. The public page does not offer a CV download.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
