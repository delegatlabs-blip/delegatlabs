import { cookies } from "next/headers";

export const USER_ACCESS_COOKIE = "dl_user_access";
export const USER_REFRESH_COOKIE = "dl_user_refresh";

const secure = process.env.NODE_ENV === "production";

export async function setUserAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  jar.set(USER_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 30,
  });
  jar.set(USER_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearUserAuthCookies() {
  const jar = await cookies();
  jar.delete(USER_ACCESS_COOKIE);
  jar.delete(USER_REFRESH_COOKIE);
}

export async function readUserRefreshCookie(): Promise<string | undefined> {
  return (await cookies()).get(USER_REFRESH_COOKIE)?.value;
}
