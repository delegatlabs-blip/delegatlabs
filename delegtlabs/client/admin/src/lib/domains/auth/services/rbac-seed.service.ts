import { prisma } from "@/lib/db";

const OWNER_ROLE = "Owner";
const USER_ROLE = "User";

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

/** Idempotent seed for roles + permission matrices. */
export async function ensureRbacSeed() {
  const owner = await prisma.role.upsert({
    where: { name: OWNER_ROLE },
    create: { name: OWNER_ROLE, label: "Owner" },
    update: { label: "Owner" },
  });
  const user = await prisma.role.upsert({
    where: { name: USER_ROLE },
    create: { name: USER_ROLE, label: "User" },
    update: { label: "User" },
  });

  for (const p of ADMIN_PERMS) {
    const perm = await prisma.adminPermission.upsert({
      where: { key: p.key },
      create: { key: p.key, description: p.description },
      update: { description: p.description },
    });
    await prisma.adminRolePermission.upsert({
      where: { roleId_permissionId: { roleId: owner.id, permissionId: perm.id } },
      create: { roleId: owner.id, permissionId: perm.id },
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
      where: { roleId_permissionId: { roleId: user.id, permissionId: perm.id } },
      create: { roleId: user.id, permissionId: perm.id },
      update: {},
    });
  }

  return { ownerRoleId: owner.id, userRoleId: user.id };
}

export { OWNER_ROLE, USER_ROLE };
