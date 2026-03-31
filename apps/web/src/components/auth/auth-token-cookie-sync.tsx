"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ACCESS_TOKEN_KEY = "sip.accessToken";

export function AuthTokenCookieSync() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      return;
    }

    const encodedToken = encodeURIComponent(token);
    const expectedCookiePrefix = `${ACCESS_TOKEN_KEY}=`;
    const existingCookie = document.cookie
      .split("; ")
      .find((part) => part.startsWith(expectedCookiePrefix));

    if (existingCookie === `${expectedCookiePrefix}${encodedToken}`) {
      return;
    }

    document.cookie = `${ACCESS_TOKEN_KEY}=${encodedToken}; path=/; max-age=604800; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
