"use client";

import ProfileIdentityScreen from "@/components/profile/ProfileIdentityScreen";
import type { Credential, Profile } from "@/types/database";

export default function ProfileIdentity(props: { profile: Profile; email: string | null; credentials: Credential[] }) {
  return <ProfileIdentityScreen {...props} />;
}
