import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import BrandMark from "@/components/ui/BrandMark";

export default function LandingNav({
  signedIn = false,
}: {
  signedIn?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 bg-background/78 backdrop-blur-xl">
      <div className="container-app flex h-16 items-center justify-between gap-3">
        <BrandMark compact href="/" markOnly />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary px-3 py-1.5 text-xs">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-2.5 py-1.5 text-xs">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-3 py-1.5 text-xs">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
