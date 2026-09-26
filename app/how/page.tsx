import type { Metadata } from "next";
import LandingView from "@/components/landing/LandingView";

export const metadata: Metadata = {
  title: "How it works",
  description: "Create a Powfolio, add proof of work, raise your scores, and share one public link.",
  alternates: { canonical: "/how" },
};

export default function HowPage() {
  return <LandingView focus="how" />;
}
