"use client";

import { useEffect, useRef } from "react";
import { FINAL_LOGIN_MARKUP } from "@/components/auth/final-login-markup";
import { bootFinalLogin } from "@/components/auth/boot-final-login";

export default function AuthExperience({
  initialMode,
  nextPath = "/dashboard",
}: {
  initialMode: "signin" | "signup";
  nextPath?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.innerHTML = FINAL_LOGIN_MARKUP;
    return bootFinalLogin(root, { initialMode, nextPath: nextPath || "/dashboard" });
  }, [initialMode, nextPath]);

  return <div ref={rootRef} className="pow-auth-page" />;
}
