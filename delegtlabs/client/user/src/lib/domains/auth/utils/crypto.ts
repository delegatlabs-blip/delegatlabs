import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ITERATIONS = 120_000;
const JWT_SECRET = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "change-me-in-production");

export type UserTokenClaims = JWTPayload & {
  email: string;
  role: string;
  kind: "user";
  tenant_id: string;
  must_reset?: boolean;
  typ?: "access" | "refresh";
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$${salt}$${digest}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const parts = passwordHash.split("$");
  if (parts.length !== 3 || parts[0] !== "pbkdf2_sha256") return false;
  const [, salt, digest] = parts;
  const candidate = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("hex");
  try {
    return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(digest, "hex"));
  } catch {
    return false;
  }
}

export function generateNumericOtp(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += String(bytes[i]! % 10);
  return out;
}

/** User JWT always includes tenant_id. */
export async function createAccessToken(input: {
  subject: string;
  tenantId: string;
  email: string;
  role: string;
  mustReset?: boolean;
}): Promise<string> {
  return new SignJWT({
    tenant_id: input.tenantId,
    email: input.email,
    role: input.role,
    kind: "user",
    typ: "access",
    must_reset: Boolean(input.mustReset),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.subject)
    .setIssuedAt()
    .setExpirationTime(input.mustReset ? "15m" : "30m")
    .sign(JWT_SECRET());
}

export async function createRefreshToken(input: {
  subject: string;
  tenantId: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT({
    tenant_id: input.tenantId,
    email: input.email,
    role: input.role,
    kind: "user",
    typ: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.subject)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET());
}

export async function verifyToken(token: string): Promise<UserTokenClaims> {
  const { payload } = await jwtVerify(token, JWT_SECRET());
  return payload as UserTokenClaims;
}

export async function decodeAccessToken(token: string) {
  return verifyToken(token);
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const suffix = createHash("sha1").update(`${name}-${Date.now()}`).digest("hex").slice(0, 6);
  return `${base || "workspace"}-${suffix}`;
}
