"use client";

import type {
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PaymentType } from "@/lib/domains/agent/types";
import type { AgentDrawerFormValues } from "@/lib/domains/agent/schema/agent-drawer.schema";
import { CreditPacksEditor, SubscriptionPlansEditor } from "./payment-plans-editor";
import { cn } from "@/lib/utils";

type FormValues = AgentDrawerFormValues;

export function AgentDrawerPricingStep({
  errors,
  watch,
  setValue,
}: {
  errors: FieldErrors<FormValues>;
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}) {
  const paymentType = watch("paymentType");

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Payment type
        </h3>
        <RadioGroup
          value={paymentType}
          onValueChange={(v) =>
            setValue("paymentType", v as PaymentType, { shouldValidate: true })
          }
          className="grid gap-3 sm:grid-cols-2"
        >
          {[
            {
              value: "subscription",
              title: "Subscription",
              desc: "Recurring plans with activate / deactivate",
            },
            {
              value: "credit",
              title: "Credit based",
              desc: "One-time packs with credits & features",
            },
          ].map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                paymentType === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <RadioGroupItem value={opt.value} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">{opt.title}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </RadioGroup>

        {paymentType === "subscription" ? (
          <SubscriptionPlansEditor
            plans={watch("subscriptionPlans")}
            onChange={(next) =>
              setValue("subscriptionPlans", next, { shouldValidate: true })
            }
            error={
              errors.subscriptionPlans?.root?.message ||
              errors.subscriptionPlans?.message
            }
          />
        ) : (
          <CreditPacksEditor
            packs={watch("creditPacks")}
            onChange={(next) => setValue("creditPacks", next, { shouldValidate: true })}
            error={errors.creditPacks?.root?.message || errors.creditPacks?.message}
          />
        )}
      </section>
    </div>
  );
}
