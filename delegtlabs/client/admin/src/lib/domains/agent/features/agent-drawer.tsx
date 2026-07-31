"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Gavel, Linkedin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  createAgent,
  updateAgent,
} from "@/lib/domains/agent/controllers/agent.controller";
import {
  AGENT_CATALOG,
  defaultCreditPacks,
  defaultListing,
  defaultSubscriptionPlans,
  deriveListingPrice,
} from "@/lib/domains/agent/utils";
import type {
  AgentRecord,
  AgentSlug,
  AgentStatus,
  BillingInterval,
  PaymentType,
} from "@/lib/domains/agent/types";
import {
  agentDrawerSchema,
  type AgentDrawerFormValues,
} from "@/lib/domains/agent/schema/agent-drawer.schema";
import {
  AgentDrawerBasicsFields,
  AgentDrawerListingFields,
} from "./agent-drawer-fields";
import { AgentDrawerPricingStep } from "./agent-drawer-pricing-step";
import { AgentDrawerPublishStep } from "./agent-drawer-publish-step";
import { cn } from "@/lib/utils";

type FormValues = AgentDrawerFormValues;
type Step = 1 | 2 | 3 | 4;

const STEPS: { n: Step; label: string; desc: string }[] = [
  { n: 1, label: "Basics", desc: "Name, type, category, and status." },
  { n: 2, label: "Listing", desc: "Marketplace copy, tags, and features." },
  { n: 3, label: "Pricing", desc: "Subscription or credit packs." },
  { n: 4, label: "Publish", desc: "Links and website visibility." },
];

const STEP_FIELDS: Record<Step, readonly (keyof FormValues)[]> = {
  1: ["name", "agentType", "category", "status"],
  2: ["shortDescription", "detailedDescription"],
  3: ["paymentType", "subscriptionPlans", "creditPacks"],
  4: ["redirectUrl", "demoUrl", "documentationUrl"],
};

function resolveAgentSlug(value: string): AgentSlug | null {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "-");
  if (normalized === "linkedin-agent" || normalized.includes("linkedin")) return "linkedin-agent";
  if (normalized === "lawyer-agent" || normalized.includes("lawyer") || normalized.includes("legal")) {
    return "lawyer-agent";
  }
  return null;
}

function csvToList(value?: string) {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function newId() {
  return crypto.randomUUID();
}

function TypeGlyph({ slug }: { slug: AgentSlug | null }) {
  if (slug === "linkedin-agent") return <Linkedin className="h-6 w-6" />;
  if (slug === "lawyer-agent") return <Gavel className="h-6 w-6" />;
  return <Bot className="h-6 w-6" />;
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {STEPS.map((item, i) => (
        <div key={item.n} className="flex items-center gap-1.5">
          {i > 0 && <div className="hidden h-px w-4 bg-border sm:block" />}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold",
                step === item.n
                  ? "bg-primary text-primary-foreground"
                  : step > item.n
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {item.n}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                step === item.n ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const emptyDefaults: FormValues = {
  name: "",
  agentType: "",
  category: "",
  description: "",
  status: "draft",
  shortDescription: "",
  detailedDescription: "",
  paymentType: "subscription",
  subscriptionPlans: [
    {
      id: newId(),
      name: "Starter",
      price: 49,
      currency: "USD",
      billingInterval: "monthly",
      featuresText: "Core features",
      active: true,
    },
  ],
  creditPacks: [
    {
      id: newId(),
      name: "100 credits",
      price: 29,
      currency: "USD",
      credits: 100,
      featuresText: "Usable credits",
      active: true,
    },
  ],
  redirectUrl: "https://app.delegatelabs.com/agents",
  demoUrl: "",
  documentationUrl: "",
  tags: "",
  features: "",
  featured: false,
  listedOnWebsite: true,
};

export function AgentDrawer({
  open,
  onOpenChange,
  agent,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  agent: AgentRecord | null;
  onSaved: () => void;
}) {
  const isEdit = !!agent;
  const [step, setStep] = useState<Step>(1);
  const form = useForm<FormValues>({
    resolver: zodResolver(agentDrawerSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: emptyDefaults,
  });
  const {
    register,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    setError,
    clearErrors,
    trigger,
  } = form;

  useEffect(() => {
    if (!open) return;
    setStep(1);
    if (agent) {
      form.reset({
        name: agent.name,
        agentType: AGENT_CATALOG[agent.slug].label,
        category: agent.category,
        description: agent.description,
        status: agent.status,
        shortDescription: agent.listing.shortDescription,
        detailedDescription: agent.listing.detailedDescription,
        paymentType: agent.listing.paymentType || "subscription",
        subscriptionPlans: (agent.listing.subscriptionPlans?.length
          ? agent.listing.subscriptionPlans
          : defaultSubscriptionPlans(agent.slug)
        ).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          billingInterval: p.billingInterval,
          featuresText: p.features.join(", "),
          active: p.active,
        })),
        creditPacks: (agent.listing.creditPacks?.length
          ? agent.listing.creditPacks
          : defaultCreditPacks(agent.slug)
        ).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          credits: p.credits,
          featuresText: p.features.join(", "),
          active: p.active,
        })),
        redirectUrl: agent.listing.redirectUrl,
        demoUrl: agent.listing.demoUrl,
        documentationUrl: agent.listing.documentationUrl,
        tags: agent.listing.tags.join(", "),
        features: agent.listing.features.join(", "),
        featured: agent.listing.featured,
        listedOnWebsite: agent.listing.listedOnWebsite,
      });
    } else {
      form.reset({
        ...emptyDefaults,
        subscriptionPlans: [{ ...emptyDefaults.subscriptionPlans[0], id: newId() }],
        creditPacks: [{ ...emptyDefaults.creditPacks[0], id: newId() }],
      });
    }
  }, [open, agent, form]);

  const agentType = watch("agentType");
  const resolvedSlug = resolveAgentSlug(agentType);
  const catalog = resolvedSlug ? AGENT_CATALOG[resolvedSlug] : null;

  useEffect(() => {
    if (!open || isEdit || !resolvedSlug) return;
    const listing = defaultListing(resolvedSlug);
    const cat = AGENT_CATALOG[resolvedSlug];
    if (!form.getValues("name")) setValue("name", cat.label, { shouldValidate: true });
    if (!form.getValues("category")) setValue("category", cat.category, { shouldValidate: true });
    if (!form.getValues("shortDescription")) {
      setValue("shortDescription", listing.shortDescription, { shouldValidate: true });
    }
    if (!form.getValues("detailedDescription")) {
      setValue("detailedDescription", listing.detailedDescription, { shouldValidate: true });
    }
    setValue("redirectUrl", listing.redirectUrl, { shouldValidate: true });
    setValue("tags", listing.tags.join(", "));
    setValue("features", listing.features.join(", "));
    setValue("featured", listing.featured);
    setValue("listedOnWebsite", listing.listedOnWebsite);
    setValue(
      "subscriptionPlans",
      listing.subscriptionPlans.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        billingInterval: p.billingInterval,
        featuresText: p.features.join(", "),
        active: p.active,
      })),
    );
    setValue(
      "creditPacks",
      listing.creditPacks.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        credits: p.credits,
        featuresText: p.features.join(", "),
        active: p.active,
      })),
    );
    clearErrors("agentType");
  }, [resolvedSlug, open, isEdit, form, setValue, clearErrors]);

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const ok = await trigger([...fields]);
    if (!ok) {
      toast.error("Fix the highlighted fields before continuing");
      return;
    }
    setStep((s) => Math.min(4, s + 1) as Step);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const onSubmit = async (values: FormValues) => {
    const slug = isEdit && agent ? agent.slug : resolveAgentSlug(values.agentType);
    if (!slug) {
      setError("agentType", {
        message: "Choose LinkedIn Growth Agent or Lawyer Drafting Agent",
      });
      setStep(1);
      return;
    }

    const subscriptionPlans = values.subscriptionPlans.map((p) => ({
      id: p.id || newId(),
      name: p.name.trim(),
      price: Number(p.price),
      currency: p.currency.trim() || "USD",
      billingInterval: p.billingInterval as BillingInterval,
      features: csvToList(p.featuresText),
      active: p.active,
    }));

    const creditPacks = values.creditPacks.map((p) => ({
      id: p.id || newId(),
      name: p.name.trim(),
      price: Number(p.price),
      currency: p.currency.trim() || "USD",
      credits: Number(p.credits),
      features: csvToList(p.featuresText),
      active: p.active,
    }));

    const derived = deriveListingPrice({
      paymentType: values.paymentType,
      subscriptionPlans,
      creditPacks,
      price: 0,
      currency: "USD",
      billingInterval: "monthly",
      planName: "",
    });

    const listing = {
      paymentType: values.paymentType as PaymentType,
      subscriptionPlans,
      creditPacks,
      ...derived,
      redirectUrl: values.redirectUrl.trim(),
      demoUrl: values.demoUrl?.trim() || "",
      documentationUrl: values.documentationUrl?.trim() || "",
      shortDescription: values.shortDescription.trim(),
      detailedDescription: values.detailedDescription.trim(),
      tags: csvToList(values.tags),
      features: csvToList(values.features),
      featured: values.featured,
      listedOnWebsite: values.listedOnWebsite,
    };

    try {
      if (isEdit && agent) {
        const updated = await updateAgent(agent.id, {
          name: values.name.trim(),
          description: values.description?.trim() || listing.shortDescription,
          category: values.category.trim(),
          status: values.status as AgentStatus,
          listing,
        });
        if (!updated) throw new Error("Update failed — check database connection");
        toast.success("Agent updated", {
          description: `${values.name} · ${values.paymentType} · from $${derived.price}`,
        });
      } else {
        const created = await createAgent({
          name: values.name.trim(),
          slug,
          description: values.description?.trim() || listing.shortDescription,
          category: values.category.trim(),
          status: values.status,
          listing,
        });
        toast.success("Agent created", {
          description: `${created.name} · ${values.paymentType} · from $${derived.price}`,
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save agent");
    }
  };

  const current = STEPS[step - 1];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="border-b p-6">
          <SheetTitle>{isEdit ? "Edit agent" : "Add agent"}</SheetTitle>
          <SheetDescription>{current.desc}</SheetDescription>
          <StepIndicator step={step} />
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit, () => {
            toast.error("Fix the highlighted fields before saving");
            setStep(4);
          })}
          className="flex flex-1 flex-col overflow-hidden"
          noValidate
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {step === 1 && (
              <>
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-glow">
                    <TypeGlyph slug={resolvedSlug} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {catalog?.label ?? "Choose an agent type"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {catalog?.description ??
                        "Enter LinkedIn or Lawyer in the Agent type field."}
                    </p>
                  </div>
                </div>
                <AgentDrawerBasicsFields
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  isEdit={isEdit}
                  namePlaceholder={catalog?.label ?? "e.g. Growth LinkedIn Bot"}
                />
              </>
            )}
            {step === 2 && (
              <AgentDrawerListingFields register={register} errors={errors} />
            )}
            {step === 3 && (
              <AgentDrawerPricingStep
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            )}
            {step === 4 && (
              <AgentDrawerPublishStep
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            )}
          </div>

          <SheetFooter className="border-t bg-muted/30 p-4">
            {step === 1 ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button type="button" onClick={goNext} className="shadow-elegant">
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="shadow-elegant">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save changes" : "Add agent"}
              </Button>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
