import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | POWFOLIO",
  description: "Contact POWFOLIO for support, privacy requests, or development questions.",
};

const CONTACTS = [
  {
    label: "Support",
    email: "support@powfolio.xyz",
    description: "Product help, account questions, and general support.",
  },
  {
    label: "Privacy",
    email: "privacy@powfolio.xyz",
    description: "Privacy requests, data questions, and account deletion matters.",
  },
  {
    label: "Development",
    email: "dev@powfolio.xyz",
    description: "Technical questions, integrations, and development matters.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <section className="container-app px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground-subtle">Get in touch</p>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
            Let&apos;s talk.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-foreground-muted sm:text-lg">
            Have a question, need help, or want to build with POWFOLIO? Pick the right inbox and send us a message.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl border-y border-border/70">
          {CONTACTS.map((contact) => (
            <a
              key={contact.email}
              href={`mailto:${contact.email}`}
              className="group flex items-center gap-5 border-b border-border/70 py-7 last:border-b-0 sm:py-8"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-foreground-muted transition-colors group-hover:border-border-strong group-hover:text-foreground">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">{contact.label}</span>
                <span className="mt-1 block break-words text-base font-medium text-foreground sm:text-lg">{contact.email}</span>
                <span className="mt-1.5 block text-sm leading-6 text-foreground-muted">{contact.description}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-foreground-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center justify-between gap-5 border-b border-border/70 pb-12 sm:flex-row sm:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">Social</p>
            <p className="mt-2 text-sm text-foreground-muted">Follow POWFOLIO for product updates and announcements.</p>
          </div>
          <a
            href="https://x.com/powfolio_xyz"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground-muted"
          >
            X / @powfolio_xyz
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-foreground-subtle transition-colors hover:text-foreground">
            Back to POWFOLIO
          </Link>
        </div>
      </section>
    </main>
  );
}
