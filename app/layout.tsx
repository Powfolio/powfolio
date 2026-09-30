import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./ui-polish.css";
import "./landing-motion.css";
import "./accent.css";
import "./palette-lock.css";
import "./ux-refine.css";
import "./auth-ui-preloader.css";
import "./route-loader.css";
import Pow3Bot from "@/components/ai/Pow3Bot";
import SkipToContent from "@/components/ui/SkipToContent";
import CookieConsent from "@/components/legal/CookieConsent";
import AppRouteLoader from "@/components/ui/AppRouteLoader";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const FAVICON = "/folio-mark.png?v=20260924";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Web3 Proof of Work Portfolio`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: ["web3", "portfolio", "proof of work", "crypto", "trader portfolio", "onchain resume"],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: FAVICON, type: "image/png", sizes: "32x32" }],
    shortcut: FAVICON,
    apple: [{ url: FAVICON, type: "image/png", sizes: "32x32" }],
  },
  openGraph: { type: "website", url: SITE_URL, siteName: SITE_NAME, title: `${SITE_NAME} | Web3 Proof of Work Portfolio`, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} | Web3 Proof of Work Portfolio`, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href={FAVICON} type="image/png" sizes="32x32" />
        <link rel="shortcut icon" href={FAVICON} />
        <link rel="apple-touch-icon" href={FAVICON} />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('pow3folio-theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark');}catch(e){}})();` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <SkipToContent />
        <AppRouteLoader />
        {children}
        <Pow3Bot />
        <CookieConsent />
      </body>
    </html>
  );
}
