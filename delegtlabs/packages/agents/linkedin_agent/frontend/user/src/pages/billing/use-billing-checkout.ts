import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { billingApi } from "@shared/api/billing";

import { apiErrorMessage } from "../agents/post-gen/api-error";
import { openRazorpayCheckout } from "./razorpay-checkout";

function invalidateBilling(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["tenant-catalog"] });
  void queryClient.invalidateQueries({ queryKey: ["tenant-credits"] });
  void queryClient.invalidateQueries({ queryKey: ["tenant-billing-quota"] });
  void queryClient.invalidateQueries({ queryKey: ["tenant-billing-payments"] });
  void queryClient.invalidateQueries({ queryKey: ["tenant-billing-config"] });
  void queryClient.invalidateQueries({ queryKey: ["agent-config", "post_gen"] });
}

export function useBillingCheckout() {
  const queryClient = useQueryClient();

  return async function startCheckout(body: {
    kind: "subscription" | "credit_pack";
    plan_id?: string;
    pack_id?: string;
    label: string;
  }) {
    try {
      const order = await billingApi.createOrder({
        kind: body.kind,
        plan_id: body.plan_id,
        pack_id: body.pack_id,
      });
      if (order.skip_checkout) {
        toast.success(body.kind === "subscription" ? "Plan updated" : "Credits added");
        invalidateBilling(queryClient);
        return;
      }
      if (!order.key_id || !order.razorpay_order_id) {
        toast.error("Checkout is not available right now.");
        return;
      }
      const paymentId = order.payment.id;
      let settled = false;
      await openRazorpayCheckout({
        key: order.key_id,
        amount: order.amount_inr_minor,
        currency: order.currency || "INR",
        name: "AntGrav",
        description: body.label,
        orderId: order.razorpay_order_id,
        prefill: order.prefill,
        onSuccess: async (response) => {
          if (settled) return;
          settled = true;
          try {
            await billingApi.verifyPayment(response);
            toast.success("Payment successful");
            invalidateBilling(queryClient);
          } catch (err) {
            toast.error(apiErrorMessage(err, "Payment captured but confirmation failed. Refresh in a minute."));
          }
        },
        onDismiss: () => {
          if (settled) return;
          settled = true;
          void billingApi.cancelOrder(paymentId).catch(() => undefined);
          invalidateBilling(queryClient);
        },
        onFailed: (message) => {
          if (settled) return;
          settled = true;
          toast.error(message);
          invalidateBilling(queryClient);
        },
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not start checkout."));
    }
  };
}
