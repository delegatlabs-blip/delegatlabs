import { AUTH_DISABLED } from "@/lib/api";
import { requireSessionTenantId } from "@/lib/domains/auth/session-store";
import type { MemberCreateInput, MemberUpdateInput } from "../types";
import {
  createMemberAction,
  deleteMemberAction,
  listMembersAction,
  updateMemberAction,
} from "../actions";

function tenantId() {
  if (AUTH_DISABLED) {
    try {
      return requireSessionTenantId();
    } catch {
      throw new Error("Sign in required (or set a session) when using Prisma members");
    }
  }
  return requireSessionTenantId();
}

export async function listMembers() {
  return listMembersAction(tenantId());
}

export async function createMember(input: MemberCreateInput) {
  return createMemberAction(tenantId(), input);
}

export async function updateMember(id: string, input: MemberUpdateInput) {
  return updateMemberAction(tenantId(), id, input);
}

export async function deleteMember(id: string) {
  await deleteMemberAction(tenantId(), id);
}

export const listMembersUseCase = listMembers;
export const createMemberUseCase = createMember;
export const updateMemberUseCase = updateMember;
export const deleteMemberUseCase = deleteMember;
