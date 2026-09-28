"use client";

import { useEffect, useState } from "react";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.6M12 19.4V21M21 12h-1.6M4.6 12H3M18.4 5.6l-1.1 1.1M6.7 17.3l-1.1 1.1M18.4 18.4l-1.1-1.1M6.7 6.7 5.6 5.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 7.2 7.2 0 1 0 20 14.5Z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("pow3folio-theme") as "dark" | "light" | null;
    const preferred = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(preferred);
    document.documentElement.classList.toggle("dark", preferred === "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("pow3folio-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-ghost h-9 w-9 p-0 text-foreground-muted"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {mounted ? (theme === "dark" ? <SunIcon /> : <MoonIcon />) : <SunIcon />}
    </button>
  );
}
