import Link from "next/link";
import BrandMark from "@/components/ui/BrandMark";
import { SITE_NAME } from "@/lib/site";

const LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/signup", label: "Get started" },
  { href: "/login", label: "Log in" },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/30 py-8">
      <div className="container-app flex flex-col items-center justify-between gap-3 text-xs text-foreground-subtle sm:flex-row">
        <div className="flex items-center gap-2">
          <BrandMark markOnly href="/" />
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
