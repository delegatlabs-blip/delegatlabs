import { cookies } from "next/headers";

export const ADMIN_ACCESS_COOKIE = "dl_admin_access";
export const ADMIN_REFRESH_COOKIE = "dl_admin_refresh";

const secure = process.env.NODE_ENV === "production";

export async function setAdminAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  jar.set(ADMIN_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 30,
  });
  jar.set(ADMIN_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminAuthCookies() {
  const jar = await cookies();
  jar.delete(ADMIN_ACCESS_COOKIE);
  jar.delete(ADMIN_REFRESH_COOKIE);
}

export async function readAdminAccessCookie(): Promise<string | undefined> {
  return (await cookies()).get(ADMIN_ACCESS_COOKIE)?.value;
}

export async function readAdminRefreshCookie(): Promise<string | undefined> {
  return (await cookies()).get(ADMIN_REFRESH_COOKIE)?.value;
}
