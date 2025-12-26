import "server-only";

import { cookies } from "next/headers";

import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

export function getAdminAccessToken() {
  return cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export function setAdminAccessToken(accessToken: string) {
  cookies().set({
    name: ADMIN_ACCESS_TOKEN_COOKIE,
    value: accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export function clearAdminAccessToken() {
  cookies().set({
    name: ADMIN_ACCESS_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
