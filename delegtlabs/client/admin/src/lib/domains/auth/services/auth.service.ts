import { prisma } from "@/lib/db";
import {
  createOwnerAccessToken,
  createOwnerRefreshToken,
  generateNumericOtp,
  hashPassword,
  verifyPassword,
  verifyToken,
} from "../utils/crypto";
import { getDevOtp, isDevOtpEnabled, sendOtpEmail } from "./mail.service";

export type AuthLoginResult = {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: string;
  kind: "owner";
  subjectId: string;
  mustReset: boolean;
  name: string;
};

const MAX_ATTEMPTS = 8;
const OTP_TTL_MS = 15 * 60 * 1000;

async function bumpAttempts(email: string) {
  await prisma.authentication.updateMany({
    where: { email, kind: "owner" },
    data: { attemptsCount: { increment: 1 } },
  });
}

async function clearOtp(email: string) {
  await prisma.authentication.updateMany({
    where: { email, kind: "owner" },
    data: { onetimepassword: null, tempOtp: null, attemptsCount: 0 },
  });
}

async function issueOwnerTokens(input: {
  subject: string;
  email: string;
  role: string;
  name: string;
  mustReset: boolean;
}): Promise<AuthLoginResult> {
  const [accessToken, refreshToken] = await Promise.all([
    createOwnerAccessToken({
      subject: input.subject,
      email: input.email,
      role: input.role,
      mustReset: input.mustReset,
    }),
    createOwnerRefreshToken({
      subject: input.subject,
      email: input.email,
      role: input.role,
    }),
  ]);
  return {
    accessToken,
    refreshToken,
    email: input.email,
    role: input.role,
    kind: "owner",
    subjectId: input.subject,
    mustReset: input.mustReset,
    name: input.name,
  };
}

export async function loginOwner(emailRaw: string, password: string): Promise<AuthLoginResult> {
  const email = emailRaw.trim().toLowerCase();
  const auth = await prisma.adminAuth.findUnique({
    where: { email },
    include: { role: true, admin: true },
  });
  if (!auth) throw new Error("Invalid email or password");

  if (auth.password && verifyPassword(password, auth.password) && !auth.mustReset) {
    return issueOwnerTokens({
      subject: auth.adminId,
      email: auth.email,
      role: auth.role.name,
      name: auth.admin.name,
      mustReset: false,
    });
  }

  const challenge = await prisma.authentication.findUnique({
    where: { email_kind: { email, kind: "owner" } },
  });
  if (!challenge?.onetimepassword) throw new Error("Invalid email or password");
  if (challenge.attemptsCount >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts — ask an admin to re-issue a one-time password");
  }
  if (!verifyPassword(password, challenge.onetimepassword)) {
    await bumpAttempts(email);
    throw new Error("Invalid email or password");
  }

  return issueOwnerTokens({
    subject: auth.adminId,
    email: auth.email,
    role: auth.role.name,
    name: auth.admin.name,
    mustReset: true,
  });
}

export async function refreshOwnerTokens(refreshToken: string): Promise<AuthLoginResult> {
  const claims = await verifyToken(refreshToken);
  if (claims.kind !== "owner" || claims.typ !== "refresh" || !claims.sub) {
    throw new Error("Invalid refresh token");
  }
  const auth = await prisma.adminAuth.findUnique({
    where: { adminId: claims.sub },
    include: { role: true, admin: true },
  });
  if (!auth) throw new Error("Invalid refresh token");
  return issueOwnerTokens({
    subject: auth.adminId,
    email: auth.email,
    role: auth.role.name,
    name: auth.admin.name,
    mustReset: auth.mustReset,
  });
}

export async function requestOwnerPasswordOtp(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const auth = await prisma.adminAuth.findUnique({ where: { email } });
  if (!auth) {
    // Avoid email enumeration
    return { ok: true as const, usedDevOtp: isDevOtpEnabled() };
  }
  const otp = isDevOtpEnabled() ? getDevOtp() : generateNumericOtp();
  await prisma.authentication.upsert({
    where: { email_kind: { email, kind: "owner" } },
    create: {
      email,
      kind: "owner",
      tempOtp: hashPassword(otp),
      attemptsCount: 0,
    },
    update: {
      tempOtp: hashPassword(otp),
      attemptsCount: 0,
    },
  });
  const mail = await sendOtpEmail({ to: email, otp, kind: "owner" });
  return { ok: true as const, usedDevOtp: mail.usedDevOtp || isDevOtpEnabled() };
}

export async function verifyOwnerOtp(emailRaw: string, otp: string) {
  const email = emailRaw.trim().toLowerCase();
  const row = await prisma.authentication.findUnique({
    where: { email_kind: { email, kind: "owner" } },
  });
  if (!row?.tempOtp) throw new Error("Invalid or expired code");
  if (Date.now() - row.updatedAt.getTime() > OTP_TTL_MS) {
    throw new Error("Code expired — request a new one");
  }
  if (row.attemptsCount >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts — request a new code");
  }
  if (!verifyPassword(otp.trim(), row.tempOtp)) {
    await bumpAttempts(email);
    throw new Error("Invalid or expired code");
  }
  return { ok: true as const, email };
}

export async function resetOwnerPasswordWithOtp(
  emailRaw: string,
  otp: string,
  newPassword: string,
) {
  await verifyOwnerOtp(emailRaw, otp);
  const email = emailRaw.trim().toLowerCase();
  if (newPassword.trim().length < 8) throw new Error("Password must be at least 8 characters");
  await prisma.adminAuth.update({
    where: { email },
    data: { password: hashPassword(newPassword), mustReset: false },
  });
  await clearOtp(email);
}

export async function resetOwnerPassword(emailRaw: string, newPassword: string) {
  const email = emailRaw.trim().toLowerCase();
  if (newPassword.trim().length < 8) throw new Error("Password must be at least 8 characters");
  await prisma.adminAuth.update({
    where: { email },
    data: { password: hashPassword(newPassword), mustReset: false },
  });
  await clearOtp(email);
}
