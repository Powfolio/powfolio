"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "pow3folio-cookie-ack";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("cookie-open", open);
    return () => document.body.classList.remove("cookie-open");
  }, [open]);

  function accept() {
    try {
      localStorage.setItem(KEY, "necessary");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="cookie-banner fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4">
      <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-border bg-surface/95 p-3.5 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-5 text-foreground-muted">
          Necessary cookies only — sign-in and security. No ads.{" "}
          <Link href="/cookies" className="text-primary hover:underline">
            Policy
          </Link>
        </p>
        <button type="button" className="btn-primary h-9 shrink-0 px-4 text-xs" onClick={accept}>
          Got it
        </button>
      </div>
    </div>
  );
}
