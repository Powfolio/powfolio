import type { Metadata } from "next";
import { ArrowUpRight, Mail, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | POWFOLIO",
  description: "Get in touch with the POWFOLIO team for support, privacy questions, or development matters.",
};

const CONTACTS = [
  {
    label: "Support",
    email: "support@powfolio.xyz",
    description: "Account help, product questions, reports, and anything that needs a response from the team.",
    icon: Mail,
  },
  {
    label: "Privacy",
    email: "privacy@powfolio.xyz",
    description: "Privacy requests, data questions, account deletion matters, and other privacy-related concerns.",
    icon: ShieldCheck,
  },
  {
    label: "Development",
    email: "dev@powfolio.xyz",
    description: "Technical issues, integration questions, and development-related matters.",
    icon: Wrench,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <section className="container-app py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Contact
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Let&apos;s talk about POWFOLIO.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-foreground-muted sm:text-lg">
            Whether you need help, have a privacy question, or want to discuss something technical, send your message to the right inbox and we&apos;ll take it from there.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
          {CONTACTS.map((contact) => {
            const Icon = contact.icon;
            return (
              <a
                key={contact.email}
                href={`mailto:${contact.email}`}
                className="group relative flex min-h-[250px] flex-col rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:bg-surface-hover hover:shadow-lg hover:shadow-black/5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-foreground-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
                <div className="mt-auto pt-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">{contact.label}</p>
                  <h2 className="mt-2 break-words text-lg font-semibold tracking-tight text-foreground">{contact.email}</h2>
                  <p className="mt-3 text-sm leading-6 text-foreground-muted">{contact.description}</p>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mx-auto mt-5 max-w-5xl rounded-2xl border border-border bg-surface/60 p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">Stay connected</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Follow POWFOLIO on X</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
                Product updates, launches, and what&apos;s happening behind the build.
              </p>
            </div>
            <a
              href="https://x.com/powfolio_xyz"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary shrink-0"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @powfolio_xyz
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mx-auto mt-10 text-center text-sm text-foreground-subtle">
          <Link href="/" className="transition-colors hover:text-foreground">Back to POWFOLIO</Link>
        </div>
      </section>
    </main>
  );
}
