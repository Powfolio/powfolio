import type { Metadata } from "next";
import LandingView from "@/components/landing/LandingView";

export const metadata: Metadata = {
  title: "Features",
  description: "Trading record, onchain stats, writing, community roles, airdrops, scores, and a private CV.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return <LandingView focus="features" />;
}
