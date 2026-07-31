import { prisma } from "@/lib/db";
import { generateOneTimePassword, hashPassword } from "../utils/crypto";
import { ensureRbacSeed } from "./rbac-seed.service";

export type ProvisionedCredentials = {
  email: string;
  oneTimePassword: string;
  kind: "owner" | "user";
};

/** Issue shared authentication OTP + auth row for a new Owner (admin_users). */
export async function provisionOwnerAuth(input: {
  adminId: string;
  email: string;
}): Promise<ProvisionedCredentials> {
  const { ownerRoleId } = await ensureRbacSeed();
  const email = input.email.trim().toLowerCase();
  const oneTimePassword = generateOneTimePassword();
  const hashed = hashPassword(oneTimePassword);

  await prisma.authentication.upsert({
    where: { email_kind: { email, kind: "owner" } },
    create: {
      email,
      kind: "owner",
      onetimepassword: hashed,
      tempOtp: null,
      attemptsCount: 0,
    },
    update: {
      onetimepassword: hashed,
      tempOtp: null,
      attemptsCount: 0,
    },
  });

  await prisma.adminAuth.upsert({
    where: { adminId: input.adminId },
    create: {
      email,
      password: "",
      roleId: ownerRoleId,
      adminId: input.adminId,
      mustReset: true,
    },
    update: {
      email,
      password: "",
      roleId: ownerRoleId,
      mustReset: true,
    },
  });

  return { email, oneTimePassword, kind: "owner" };
}

/** Issue shared authentication OTP + auth row for a portal User (admin_customers). */
export async function provisionUserAuth(input: {
  userId: string;
  email: string;
}): Promise<ProvisionedCredentials> {
  const { userRoleId } = await ensureRbacSeed();
  const email = input.email.trim().toLowerCase();
  const oneTimePassword = generateOneTimePassword();
  const hashed = hashPassword(oneTimePassword);

  await prisma.authentication.upsert({
    where: { email_kind: { email, kind: "user" } },
    create: {
      email,
      kind: "user",
      onetimepassword: hashed,
      tempOtp: null,
      attemptsCount: 0,
    },
    update: {
      onetimepassword: hashed,
      tempOtp: null,
      attemptsCount: 0,
    },
  });

  await prisma.userAuth.upsert({
    where: { adminId: input.userId },
    create: {
      email,
      password: "",
      roleId: userRoleId,
      adminId: input.userId,
      mustReset: true,
    },
    update: {
      email,
      password: "",
      roleId: userRoleId,
      mustReset: true,
    },
  });

  return { email, oneTimePassword, kind: "user" };
}
