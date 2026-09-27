"use client";

import { useEffect } from "react";

export default function LandingFocus({ target }: { target?: string }) {
  useEffect(() => {
    if (!target) return;

    function go() {
      const el = document.getElementById(target as string);
      if (!el) return false;
      el.scrollIntoView({ behavior: "auto", block: "start" });
      return true;
    }

    if (go()) return;
    const first = window.setTimeout(go, 80);
    const second = window.setTimeout(go, 360);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [target]);
  return null;
}
