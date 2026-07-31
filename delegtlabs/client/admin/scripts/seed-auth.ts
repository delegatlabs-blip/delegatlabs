/**
 * Seed roles, permissions, admin owner, portal user, and a demo tenant.
 *
 * Usage (from client/admin):
 *   npm run db:seed
 *
 * Env overrides:
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *   SEED_USER_EMAIL / SEED_USER_PASSWORD
 *   SEED_TENANT_NAME
 */
import { createHash, pbkdf2Sync, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ITERATIONS = 120_000;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$${salt}$${digest}`;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const suffix = createHash("sha1").update(`${name}-seed`).digest("hex").slice(0, 6);
  return `${base || "workspace"}-${suffix}`;
}

const ADMIN_PERMS = [
  { key: "dashboard:read", description: "View admin dashboard" },
  { key: "agents:manage", description: "Manage agents catalog" },
  { key: "users:manage", description: "Manage portal users" },
  { key: "owners:manage", description: "Manage owner accounts" },
  { key: "settings:manage", description: "Manage admin settings" },
] as const;

const USER_PERMS = [
  { key: "dashboard:read", description: "View user dashboard" },
  { key: "agents:use", description: "Use purchased agents" },
  { key: "billing:read", description: "View billing" },
  { key: "members:manage", description: "Manage tenant members" },
] as const;

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@delegtlabs.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
  const userEmail = (process.env.SEED_USER_EMAIL || "user@delegtlabs.com").toLowerCase();
  const userPassword = process.env.SEED_USER_PASSWORD || "User@123456";
  const tenantName = process.env.SEED_TENANT_NAME || "Demo Tenant";

  const ownerRole = await prisma.role.upsert({
    where: { name: "Owner" },
    create: { name: "Owner", label: "Owner" },
    update: { label: "Owner" },
  });
  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    create: { name: "User", label: "User" },
    update: { label: "User" },
  });

  for (const p of ADMIN_PERMS) {
    const perm = await prisma.adminPermission.upsert({
      where: { key: p.key },
      create: { key: p.key, description: p.description },
      update: { description: p.description },
    });
    await prisma.adminRolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: perm.id } },
      create: { roleId: ownerRole.id, permissionId: perm.id },
      update: {},
    });
  }

  for (const p of USER_PERMS) {
    const perm = await prisma.userPermission.upsert({
      where: { key: p.key },
      create: { key: p.key, description: p.description },
      update: { description: p.description },
    });
    await prisma.userRolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: perm.id } },
      create: { roleId: userRole.id, permissionId: perm.id },
      update: {},
    });
  }

  const adminUser = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      name: "Platform Admin",
      email: adminEmail,
      role: "Owner",
      status: "active",
      company: "DelegtLabs",
    },
    update: { name: "Platform Admin", status: "active", role: "Owner" },
  });

  await prisma.adminAuth.upsert({
    where: { adminId: adminUser.id },
    create: {
      email: adminEmail,
      password: hashPassword(adminPassword),
      roleId: ownerRole.id,
      adminId: adminUser.id,
      mustReset: false,
    },
    update: {
      email: adminEmail,
      password: hashPassword(adminPassword),
      roleId: ownerRole.id,
      mustReset: false,
    },
  });

  const portalUser = await prisma.adminCustomer.upsert({
    where: { email: userEmail },
    create: {
      name: "Demo User",
      email: userEmail,
      company: tenantName,
      plan: "Pro",
      status: "active",
    },
    update: { name: "Demo User", company: tenantName, status: "active" },
  });

  await prisma.userAuth.upsert({
    where: { adminId: portalUser.id },
    create: {
      email: userEmail,
      password: hashPassword(userPassword),
      roleId: userRole.id,
      adminId: portalUser.id,
      mustReset: false,
    },
    update: {
      email: userEmail,
      password: hashPassword(userPassword),
      roleId: userRole.id,
      mustReset: false,
    },
  });

  const slug = slugify(tenantName);
  let tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: tenantName, slug, status: "active" },
    });
  }

  await prisma.tenantMember.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: userEmail },
    },
    create: {
      tenantId: tenant.id,
      email: userEmail,
      name: "Demo User",
      passwordHash: "",
      role: "Owner",
      status: "active",
    },
    update: { name: "Demo User", role: "Owner", status: "active" },
  });

  console.log("Auth seed complete:");
  console.log(`  Admin  ${adminEmail} / ${adminPassword}  (no tenant in JWT)`);
  console.log(`  User   ${userEmail} / ${userPassword}`);
  console.log(`  Tenant ${tenant.name} (${tenant.id})`);
  console.log(`  Dev OTP: 123456 (AUTH_USE_DEV_OTP)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
