import type { Member, MemberDto } from "../types";

export function mapMember(dto: MemberDto): Member {
  return {
    id: dto.id,
    tenantId: dto.tenant_id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    status: dto.status,
    department: dto.department || "",
    notes: dto.notes || "",
    lastLoginAt: dto.last_login_at ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}
