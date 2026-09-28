"use client";

import Link from "next/link";

export default function ProofCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="proof" className="container-app pb-24 pt-4 sm:pb-32">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="folder-loop mb-8" aria-hidden>
          <svg viewBox="0 0 140 108" className="h-20 w-24 sm:h-24 sm:w-28">
            <path className="folder-stroke" d="M18 34h32l10 12h62v46H18V34Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            <path className="folder-stroke folder-stroke-delayed" d="M18 48h104" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path className="folder-stroke folder-stroke-late" d="M42 66h56M42 76h40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-[1.7rem] font-semibold tracking-tight sm:text-[2.2rem]">Ready to share your proof?</h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-foreground-muted">
          One public Powfolio. Trades, writing, roles, and onchain work in a single link teams can open and review.
        </p>
        <div className="mt-8">
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
              Open dashboard
            </Link>
          ) : (
            <Link href="/signup" className="btn-primary px-5 py-2.5 text-sm">
              Get started free
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
