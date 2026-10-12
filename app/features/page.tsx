import type { Metadata } from "next";
import LandingView from "@/components/landing/LandingView";

export const metadata: Metadata = {
  title: "Features",
  description: "Profile, projects, writing, trading, onchain collectibles, airdrops, scores, and a downloadable CV.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return <LandingView focus="features" />;
}
