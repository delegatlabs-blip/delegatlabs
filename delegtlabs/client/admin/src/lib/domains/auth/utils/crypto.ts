import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ITERATIONS = 120_000;
const JWT_SECRET = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "change-me-in-production");

export type OwnerTokenClaims = JWTPayload & {
  email: string;
  role: string;
  kind: "owner";
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

export function generateOneTimePassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

export function generateNumericOtp(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += String(bytes[i]! % 10);
  return out;
}

/** Owner JWT — no tenant_id. */
export async function createOwnerAccessToken(input: {
  subject: string;
  email: string;
  role: string;
  mustReset?: boolean;
}): Promise<string> {
  return new SignJWT({
    email: input.email,
    role: input.role,
    kind: "owner",
    typ: "access",
    must_reset: Boolean(input.mustReset),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.subject)
    .setIssuedAt()
    .setExpirationTime(input.mustReset ? "15m" : "30m")
    .sign(JWT_SECRET());
}

export async function createOwnerRefreshToken(input: {
  subject: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT({
    email: input.email,
    role: input.role,
    kind: "owner",
    typ: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.subject)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET());
}

export async function verifyToken(token: string): Promise<OwnerTokenClaims> {
  const { payload } = await jwtVerify(token, JWT_SECRET());
  return payload as OwnerTokenClaims;
}

/** @deprecated use createOwnerAccessToken */
export async function createAccessToken(input: {
  subject: string;
  email: string;
  role: string;
  kind: "owner" | "user";
  mustReset?: boolean;
}): Promise<string> {
  return createOwnerAccessToken(input);
}

export async function decodeAccessToken(token: string) {
  return verifyToken(token);
}

export function fingerprint(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 8);
}
