"use server";

import * as memberService from "./services/member.service";
import type { MemberCreateInput, MemberUpdateInput } from "./types";

export async function listMembersAction(tenantId: string) {
  return memberService.fetchMembers(tenantId);
}

export async function createMemberAction(tenantId: string, input: MemberCreateInput) {
  return memberService.postMember(tenantId, input);
}

export async function updateMemberAction(
  tenantId: string,
  id: string,
  input: MemberUpdateInput,
) {
  return memberService.putMember(tenantId, id, input);
}

export async function deleteMemberAction(tenantId: string, id: string) {
  await memberService.removeMember(tenantId, id);
}
