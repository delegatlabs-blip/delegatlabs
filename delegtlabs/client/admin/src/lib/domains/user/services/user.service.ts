import { prisma } from "@/lib/db";
import type { ApiUser, UserCreateInput, UserUpdateInput } from "../types";

function toApiUser(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  status: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}): ApiUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    role: row.role,
    status: (row.status as ApiUser["status"]) || "active",
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function fetchUsers(): Promise<ApiUser[]> {
  const rows = await prisma.adminUser.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(toApiUser);
}

export async function fetchUser(id: string): Promise<ApiUser> {
  const row = await prisma.adminUser.findUniqueOrThrow({ where: { id } });
  return toApiUser(row);
}

export async function postUser(input: UserCreateInput): Promise<ApiUser> {
  const row = await prisma.adminUser.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || "",
      company: input.company?.trim() || "",
      role: input.role || "Viewer",
      status: input.status ?? "active",
      notes: input.notes?.trim() || "",
    },
  });
  return toApiUser(row);
}

export async function putUser(id: string, patch: UserUpdateInput): Promise<ApiUser> {
  const row = await prisma.adminUser.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.email !== undefined ? { email: patch.email.trim() } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
      ...(patch.company !== undefined ? { company: patch.company.trim() } : {}),
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes.trim() } : {}),
    },
  });
  return toApiUser(row);
}

export async function removeUser(id: string): Promise<void> {
  await prisma.adminUser.delete({ where: { id } });
}
