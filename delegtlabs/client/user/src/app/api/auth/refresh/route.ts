import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as authService from "@/lib/domains/auth/services/auth.service";
import {
  USER_ACCESS_COOKIE,
  USER_REFRESH_COOKIE,
  clearUserAuthCookies,
  setUserAuthCookies,
} from "@/lib/domains/auth/utils/cookies";

export async function POST() {
  try {
    const jar = await cookies();
    const refresh = jar.get(USER_REFRESH_COOKIE)?.value;
    if (!refresh) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }
    const session = await authService.refreshUserTokens(refresh);
    await setUserAuthCookies(session.accessToken, session.refreshToken);
    return NextResponse.json(session);
  } catch {
    await clearUserAuthCookies();
    const res = NextResponse.json({ error: "Refresh expired" }, { status: 401 });
    res.cookies.delete(USER_ACCESS_COOKIE);
    res.cookies.delete(USER_REFRESH_COOKIE);
    return res;
  }
}
