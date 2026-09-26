"use client";

import { useEffect } from "react";

export default function LandingFocus({ target }: { target?: string }) {
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
    return () => window.clearTimeout(id);
  }, [target]);
  return null;
}
