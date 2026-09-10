import { api } from "@shared/api";

/** Admin-only tenant operations: assign/activate a paid plan, edit a tenant's topics,
 * and reset a tenant's onboarding profile. Kept out of api/index.ts, which has a fixed
 * line-count budget. */

export type TenantTopicPatch = Partial<{
  name: string;
  weight: number;
  is_active: boolean;
  selected_option_value: string;
}>;

export const adminTenantOpsApi = {
  activateSubscription: (tenantId: string, agentKind: string, planId: string) =>
    api
      .post(`/admin/tenants/${tenantId}/subscriptions/${agentKind}/activate`, { plan_id: planId })
      .then((r) => r.data),
  tenantTopics: (tenantId: string) =>
    api.get(`/admin/tenants/${tenantId}/topics`).then((r) => r.data),
  updateTenantTopic: (tenantId: string, topicId: number, data: TenantTopicPatch) =>
    api.patch(`/admin/tenants/${tenantId}/topics/${topicId}`, data).then((r) => r.data),
  resetTenantOnboarding: (tenantId: string) =>
    api.post(`/admin/tenants/${tenantId}/onboarding/reset`, {}).then((r) => r.data),
};
