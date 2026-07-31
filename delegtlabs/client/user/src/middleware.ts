import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ACCESS = "dl_user_access";
const REFRESH = "dl_user_refresh";
const PUBLIC = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
]);
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_USER_AUTH === "true";

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "change-me-in-production");
}

async function isValidAccess(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return (
      payload.kind === "user" &&
      payload.typ !== "refresh" &&
      typeof payload.tenant_id === "string"
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (AUTH_DISABLED) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC.has(pathname);
  const access = request.cookies.get(ACCESS)?.value;
  const refresh = request.cookies.get(REFRESH)?.value;
  const accessOk = await isValidAccess(access);

  if (!accessOk && refresh && !isPublic) {
    try {
      const origin = request.nextUrl.origin;
      const res = await fetch(`${origin}/api/auth/refresh`, {
        method: "POST",
        headers: { cookie: request.headers.get("cookie") || "" },
      });
      if (res.ok) {
        const next = NextResponse.next();
        const setCookies = res.headers.getSetCookie?.() || [];
        for (const c of setCookies) next.headers.append("set-cookie", c);
        return next;
      }
    } catch {
      /* fall through */
    }
  }

  if (!accessOk && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    redirect.cookies.delete(ACCESS);
    redirect.cookies.delete(REFRESH);
    return redirect;
  }

  if (accessOk && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
