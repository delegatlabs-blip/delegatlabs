import { api } from "./index";
import type { CatalogPack, CatalogPlan } from "./index";

export interface BillingConfig {
  configured: boolean;
  key_id: string | null;
  currency: string;
}

export interface QuotaSlot {
  slot: string;
  cap: number;
  used: number;
  remaining: number;
  period_start: string;
  period: "day" | "week" | string;
}

export interface BillingQuota {
  plan: CatalogPlan | null;
  slots: QuotaSlot[];
  has_remaining: boolean;
  cron_would_skip: boolean;
  reason?: string | null;
  as_of?: string;
}

export type BillingPaymentStatus =
  | "created"
  | "attempted"
  | "paid"
  | "failed"
  | "cancelled";

export interface BillingPayment {
  id: string;
  kind: "subscription" | "credit_pack" | string;
  status: BillingPaymentStatus | string;
  status_label: string;
  sku_code: string | null;
  sku_name: string;
  amount_inr_minor: number;
  currency: string;
  invoice_number: string | null;
  has_invoice: boolean;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  failure_reason: string | null;
  fulfilled: boolean;
  paid_at: string | null;
  created_at: string;
  buyer_email?: string | null;
  buyer_name?: string | null;
  tenant_name?: string | null;
  invoice?: {
    number: string | null;
    issued_at: string | null;
    seller: string;
    buyer_name: string;
    buyer_email: string | null;
    workspace: string | null;
    description: string | null;
    kind: string;
    amount_inr_minor: number;
    currency: string;
    payment_reference: string | null;
  };
}

export interface BillingOrderResponse {
  skip_checkout: boolean;
  key_id: string | null;
  razorpay_order_id?: string;
  amount_inr_minor: number;
  currency: string;
  payment: BillingPayment;
  prefill: { email?: string | null; name?: string | null };
  plan?: CatalogPlan | null;
  pack?: CatalogPack | null;
}

export const billingApi = {
  config: () => api.get<BillingConfig>("/tenant/billing/config").then((r) => r.data),
  quota: () => api.get<BillingQuota>("/tenant/billing/quota").then((r) => r.data),
  payments: (status = "all") =>
    api
      .get<{ payments: BillingPayment[] }>("/tenant/billing/payments", { params: { status } })
      .then((r) => r.data),
  invoice: (paymentId: string) =>
    api.get<BillingPayment>(`/tenant/billing/payments/${paymentId}`).then((r) => r.data),
  createOrder: (body: { kind: "subscription" | "credit_pack"; plan_id?: string; pack_id?: string }) =>
    api.post<BillingOrderResponse>("/tenant/billing/orders", body).then((r) => r.data),
  verifyPayment: (body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post<{ ok: boolean; payment: BillingPayment }>("/tenant/billing/verify", body).then((r) => r.data),
  cancelOrder: (paymentId: string) =>
    api.post<BillingPayment>(`/tenant/billing/orders/${paymentId}/cancel`).then((r) => r.data),
};
