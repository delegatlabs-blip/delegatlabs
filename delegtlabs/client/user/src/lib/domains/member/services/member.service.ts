import { prisma } from "@/lib/db";
import type { Member, MemberCreateInput, MemberDto, MemberUpdateInput } from "../types";
import { mapMember } from "../utils/map-member";
import { hashPassword } from "@/lib/domains/auth/utils/crypto";

function toDto(row: {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string;
  notes: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): MemberDto {
  return {
    id: row.id,
    tenant_id: row.tenantId,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status as MemberDto["status"],
    department: row.department,
    notes: row.notes,
    last_login_at: row.lastLoginAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function fetchMembers(tenantId: string): Promise<Member[]> {
  const rows = await prisma.tenantMember.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => mapMember(toDto(r)));
}

export async function postMember(
  tenantId: string,
  input: MemberCreateInput,
): Promise<Member> {
  const row = await prisma.tenantMember.create({
    data: {
      tenantId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role ?? "Viewer",
      status: input.status ?? "invited",
      department: input.department ?? "",
      notes: input.notes ?? "",
      passwordHash: input.password ? hashPassword(input.password) : "",
    },
  });
  return mapMember(toDto(row));
}

export async function putMember(
  tenantId: string,
  id: string,
  input: MemberUpdateInput,
): Promise<Member> {
  const row = await prisma.tenantMember.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.department !== undefined ? { department: input.department } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
  if (row.tenantId !== tenantId) throw new Error("Member not in tenant");
  return mapMember(toDto(row));
}

export async function removeMember(tenantId: string, id: string): Promise<void> {
  const row = await prisma.tenantMember.findUniqueOrThrow({ where: { id } });
  if (row.tenantId !== tenantId) throw new Error("Member not in tenant");
  await prisma.tenantMember.delete({ where: { id } });
}
