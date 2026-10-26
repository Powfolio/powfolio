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

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M19.7 5.3a18.4 18.4 0 0 0-4.5-1.4l-.6 1.2a16.8 16.8 0 0 0-5.2 0l-.6-1.2a18.4 18.4 0 0 0-4.5 1.4C1.5 9.5.7 13.6 1.1 17.6a18.5 18.5 0 0 0 5.5 2.8l1.2-1.9-1.8-.9.4-.3c3.5 1.6 7.3 1.6 10.8 0l.4.3-1.8.9 1.2 1.9a18.5 18.5 0 0 0 5.5-2.8c.5-4.7-.8-8.7-2.8-12.3ZM8.7 14.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <section className="container-app px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground-subtle">Get in touch</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl">Let&apos;s talk.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-foreground-muted sm:text-lg">
            Have a question, need help, or want to build with POWFOLIO? Choose the right inbox or connect with us.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl border-y border-border/70">
          {CONTACTS.map((contact) => (
            <a
              key={contact.email}
              href={`mailto:${contact.email}`}
              className="group flex items-center gap-4 border-b border-border/70 py-6 last:border-b-0 sm:gap-5 sm:py-7"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-foreground-muted transition-colors group-hover:border-border-strong group-hover:text-foreground">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">{contact.label}</span>
                <span className="mt-1 block break-words text-base font-medium text-foreground sm:text-lg">{contact.email}</span>
                <span className="mt-1 block text-sm leading-6 text-foreground-muted">{contact.description}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-foreground-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-5 border-b border-border/70 pb-10 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:pb-12">
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">Social</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-foreground-muted">Follow product updates, announcements, and community discussions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://x.com/powfolio_xyz"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              <XIcon />
              <span>X</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-foreground-subtle" aria-hidden="true" />
            </a>
            <a
              href="https://discord.gg/gnQBN5cN9"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              <DiscordIcon />
              <span>Discord</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-foreground-subtle" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-foreground-subtle transition-colors hover:text-foreground">
            Back to POWFOLIO
          </Link>
        </div>
      </section>
    </main>
  );
}
