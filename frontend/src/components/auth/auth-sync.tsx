"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setAuthHeader } from "@/lib/api";

export function AuthSync({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      setAuthHeader(userId);
    }
  }, [userId, isLoaded]);

  return <>{children}</>;
}
