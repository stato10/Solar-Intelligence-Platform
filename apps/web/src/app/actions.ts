"use server";

import { cookies } from "next/headers";

export async function setActiveSite(siteId: string) {
  const cookieStore = await cookies();
  cookieStore.set("sip.activeSiteId", siteId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax"
  });
}
