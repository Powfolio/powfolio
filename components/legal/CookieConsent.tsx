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
    <div className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-foreground-muted">
          Pow3Folio uses necessary cookies to keep you signed in and protect the product. We do not run advertising cookies.{" "}
          <Link href="/cookies" className="text-primary hover:underline">
            Cookie policy
          </Link>
        </p>
        <button type="button" className="btn-primary shrink-0 text-xs" onClick={accept}>
          Got it
        </button>
      </div>
    </div>
  );
}
