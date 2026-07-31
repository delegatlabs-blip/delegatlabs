import { prisma } from "@/lib/db";
import type { AuthSession, LoginInput, RegisterInput } from "../types";
import {
  createAccessToken,
  createRefreshToken,
  generateNumericOtp,
  hashPassword,
  slugify,
  verifyPassword,
  verifyToken,
} from "../utils/crypto";
import { getDevOtp, sendOtpEmail, useDevOtp } from "./mail.service";

const MAX_ATTEMPTS = 8;
const OTP_TTL_MS = 15 * 60 * 1000;

async function bumpAttempts(email: string) {
  await prisma.authentication.updateMany({
    where: { email, kind: "user" },
    data: { attemptsCount: { increment: 1 } },
  });
}

async function clearOtp(email: string) {
  await prisma.authentication.updateMany({
    where: { email, kind: "user" },
    data: { onetimepassword: null, tempOtp: null, attemptsCount: 0 },
  });
}

async function ensureTenantMembership(input: {
  email: string;
  name: string;
  role: string;
}) {
  const existing = await prisma.tenantMember.findFirst({
    where: { email: input.email },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  const tenant = await prisma.tenant.create({
    data: {
      name: `${input.name}'s workspace`,
      slug: slugify(input.name),
      status: "active",
      members: {
        create: {
          email: input.email,
          name: input.name,
          passwordHash: "",
          role: input.role || "Owner",
          status: "active",
        },
      },
    },
    include: { members: true },
  });
  return tenant.members[0]!;
}

async function buildSession(input: {
  memberId: string;
  tenantId: string;
  email: string;
  role: string;
  name: string;
  mustReset: boolean;
}): Promise<AuthSession> {
  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken({
      subject: input.memberId,
      tenantId: input.tenantId,
      email: input.email,
      role: input.role,
      mustReset: input.mustReset,
    }),
    createRefreshToken({
      subject: input.memberId,
      tenantId: input.tenantId,
      email: input.email,
      role: input.role,
    }),
  ]);
  return {
    accessToken,
    refreshToken,
    tenantId: input.tenantId,
    userId: input.memberId,
    email: input.email,
    role: input.role,
    name: input.name,
    mustReset: input.mustReset,
  };
}

export async function postLogin(input: LoginInput): Promise<AuthSession> {
  const email = input.email.trim().toLowerCase();
  const auth = await prisma.userAuth.findUnique({
    where: { email },
    include: { role: true, user: true },
  });
  if (!auth) throw new Error("Invalid email or password");

  const member = await ensureTenantMembership({
    email: auth.email,
    name: auth.user.name,
    role: auth.role.name,
  });

  if (auth.password && verifyPassword(input.password, auth.password) && !auth.mustReset) {
    await prisma.tenantMember.update({
      where: { id: member.id },
      data: { lastLoginAt: new Date() },
    });
    return buildSession({
      memberId: member.id,
      tenantId: member.tenantId,
      email: auth.email,
      role: auth.role.name,
      name: auth.user.name,
      mustReset: false,
    });
  }

  const challenge = await prisma.authentication.findUnique({
    where: { email_kind: { email, kind: "user" } },
  });
  if (!challenge?.onetimepassword) throw new Error("Invalid email or password");
  if (challenge.attemptsCount >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts — ask an admin to re-issue a one-time password");
  }
  if (!verifyPassword(input.password, challenge.onetimepassword)) {
    await bumpAttempts(email);
    throw new Error("Invalid email or password");
  }

  return buildSession({
    memberId: member.id,
    tenantId: member.tenantId,
    email: auth.email,
    role: auth.role.name,
    name: auth.user.name,
    mustReset: true,
  });
}

export async function refreshUserTokens(refreshToken: string): Promise<AuthSession> {
  const claims = await verifyToken(refreshToken);
  if (claims.kind !== "user" || claims.typ !== "refresh" || !claims.sub || !claims.tenant_id) {
    throw new Error("Invalid refresh token");
  }
  const member = await prisma.tenantMember.findUnique({ where: { id: claims.sub } });
  if (!member) throw new Error("Invalid refresh token");
  const auth = await prisma.userAuth.findUnique({
    where: { email: member.email },
    include: { user: true, role: true },
  });
  if (!auth) throw new Error("Invalid refresh token");
  return buildSession({
    memberId: member.id,
    tenantId: member.tenantId,
    email: auth.email,
    role: auth.role.name,
    name: auth.user.name,
    mustReset: auth.mustReset,
  });
}

export async function requestUserPasswordOtp(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const auth = await prisma.userAuth.findUnique({ where: { email } });
  if (!auth) return { ok: true as const, usedDevOtp: useDevOtp() };
  const otp = useDevOtp() ? getDevOtp() : generateNumericOtp();
  await prisma.authentication.upsert({
    where: { email_kind: { email, kind: "user" } },
    create: { email, kind: "user", tempOtp: hashPassword(otp), attemptsCount: 0 },
    update: { tempOtp: hashPassword(otp), attemptsCount: 0 },
  });
  const mail = await sendOtpEmail({ to: email, otp, kind: "user" });
  return { ok: true as const, usedDevOtp: mail.usedDevOtp || useDevOtp() };
}

export async function verifyUserOtp(emailRaw: string, otp: string) {
  const email = emailRaw.trim().toLowerCase();
  const row = await prisma.authentication.findUnique({
    where: { email_kind: { email, kind: "user" } },
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

export async function resetUserPasswordWithOtp(
  emailRaw: string,
  otp: string,
  newPassword: string,
) {
  await verifyUserOtp(emailRaw, otp);
  const email = emailRaw.trim().toLowerCase();
  if (newPassword.trim().length < 8) throw new Error("Password must be at least 8 characters");
  await prisma.userAuth.update({
    where: { email },
    data: { password: hashPassword(newPassword), mustReset: false },
  });
  await clearOtp(email);
}

export async function resetUserPassword(emailRaw: string, newPassword: string) {
  const email = emailRaw.trim().toLowerCase();
  if (newPassword.trim().length < 8) throw new Error("Password must be at least 8 characters");
  await prisma.userAuth.update({
    where: { email },
    data: { password: hashPassword(newPassword), mustReset: false },
  });
  await clearOtp(email);
}

export async function postRegister(input: RegisterInput): Promise<AuthSession> {
  const email = input.email.trim().toLowerCase();
  const existingAuth = await prisma.userAuth.findUnique({ where: { email } });
  if (existingAuth) throw new Error("Email already registered");

  const existingMember = await prisma.tenantMember.findFirst({ where: { email } });
  if (existingMember) throw new Error("Email already registered");

  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    create: { name: "User", label: "User" },
    update: {},
  });

  const customer = await prisma.adminCustomer.create({
    data: {
      name: input.name.trim(),
      email,
      company: input.tenantName.trim(),
      status: "active",
    },
  });

  await prisma.userAuth.create({
    data: {
      email,
      password: hashPassword(input.password),
      roleId: userRole.id,
      adminId: customer.id,
      mustReset: false,
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: input.tenantName.trim(),
      slug: slugify(input.tenantName.trim()),
      status: "active",
      members: {
        create: {
          email,
          name: input.name.trim(),
          passwordHash: "",
          role: "Owner",
          status: "active",
        },
      },
    },
    include: { members: true },
  });
  const member = tenant.members[0]!;

  return buildSession({
    memberId: member.id,
    tenantId: tenant.id,
    email,
    role: "User",
    name: input.name.trim(),
    mustReset: false,
  });
}
