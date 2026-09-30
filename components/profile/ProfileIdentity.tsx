"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { connectEthereumWallet } from "@/lib/wallet";
import { startXAuth } from "@/lib/x-oauth";
import { SITE_URL } from "@/lib/site";
import { isReservedUsername, reservedUsernameMessage } from "@/lib/usernames";
import DeleteAccount from "@/components/profile/DeleteAccount";
import OnboardingTour, { resetOnboarding } from "@/components/onboarding/OnboardingTour";
import type { Credential, Education, Profile, Skill, WorkExperience } from "@/types/database";

export default function ProfileIdentity({ profile, email, credentials }: { profile: Profile; email: string | null; credentials: Credential[] }) {
  const router = useRouter();
  return <div className="p-8">Profile workspace loading</div>;
}
