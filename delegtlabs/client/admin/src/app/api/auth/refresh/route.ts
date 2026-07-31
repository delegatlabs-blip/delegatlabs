import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as authService from "@/lib/domains/auth/services/auth.service";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  clearAdminAuthCookies,
  setAdminAuthCookies,
} from "@/lib/domains/auth/utils/cookies";

export async function POST() {
  try {
    const jar = await cookies();
    const refresh = jar.get(ADMIN_REFRESH_COOKIE)?.value;
    if (!refresh) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }
    const result = await authService.refreshOwnerTokens(refresh);
    await setAdminAuthCookies(result.accessToken, result.refreshToken);
    return NextResponse.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      email: result.email,
      role: result.role,
      name: result.name,
      subjectId: result.subjectId,
      mustReset: result.mustReset,
    });
  } catch {
    await clearAdminAuthCookies();
    const res = NextResponse.json({ error: "Refresh expired" }, { status: 401 });
    res.cookies.delete(ADMIN_ACCESS_COOKIE);
    res.cookies.delete(ADMIN_REFRESH_COOKIE);
    return res;
  }
}
