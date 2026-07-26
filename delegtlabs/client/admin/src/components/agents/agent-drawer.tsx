import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGENT_CATALOG,
  defaultCreditPacks,
  defaultListing,
  defaultSubscriptionPlans,
  deriveListingPrice,
  type AgentRecord,
  type AgentSlug,
  type AgentStatus,
  type BillingInterval,
  type PaymentType,
} from "./agent-types";
import { createAgent, updateAgent } from "./agent-store";
import { CreditPacksEditor, SubscriptionPlansEditor } from "./payment-plans-editor";
import { cn } from "@/lib/utils";

const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Plan name required"),
  price: z.coerce.number().min(0),
  currency: z.string().min(1),
  billingInterval: z.enum(["monthly", "yearly", "one-time"]),
  featuresText: z.string().optional(),
  active: z.boolean(),
});

const creditPackSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Pack name required"),
  price: z.coerce.number().min(0),
  currency: z.string().min(1),
  credits: z.coerce.number().min(1, "Credits must be at least 1"),
  featuresText: z.string().optional(),
  active: z.boolean(),
});

const schema = z
  .object({
    name: z.string().min(2, "Name is too short"),
    agentType: z.string().min(1, "Agent type is required"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional(),
    status: z.enum(["draft", "active", "paused"]),
    shortDescription: z.string().min(8, "Add a short website blurb"),
    detailedDescription: z.string().min(20, "Add a longer description for the listing page"),
    paymentType: z.enum(["subscription", "credit"]),
    subscriptionPlans: z.array(subscriptionPlanSchema),
    creditPacks: z.array(creditPackSchema),
    redirectUrl: z.string().url("Enter a valid redirect / panel URL"),
    demoUrl: z
      .string()
      .optional()
      .refine((v) => !v || z.string().url().safeParse(v).success, "Enter a valid demo URL"),
    documentationUrl: z
      .string()
      .optional()
      .refine((v) => !v || z.string().url().safeParse(v).success, "Enter a valid docs URL"),
    tags: z.string().optional(),
    features: z.string().optional(),
    featured: z.boolean(),
    listedOnWebsite: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.paymentType === "subscription" && values.subscriptionPlans.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one subscription plan",
        path: ["subscriptionPlans"],
      });
    }
    if (values.paymentType === "credit" && values.creditPacks.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one credit pack",
        path: ["creditPacks"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

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
  return `plan_${Math.random().toString(36).slice(2, 9)}`;
}

function TypeGlyph({ slug }: { slug: AgentSlug | null }) {
  if (slug === "linkedin-agent") return <Linkedin className="h-6 w-6" />;
  if (slug === "lawyer-agent") return <Gavel className="h-6 w-6" />;
  return <Bot className="h-6 w-6" />;
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
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
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

  const agentType = form.watch("agentType");
  const paymentType = form.watch("paymentType");
  const resolvedSlug = resolveAgentSlug(agentType);
  const catalog = resolvedSlug ? AGENT_CATALOG[resolvedSlug] : null;

  useEffect(() => {
    if (!open || isEdit || !resolvedSlug) return;
    const listing = defaultListing(resolvedSlug);
    const cat = AGENT_CATALOG[resolvedSlug];
    if (!form.getValues("name")) form.setValue("name", cat.label);
    if (!form.getValues("category")) form.setValue("category", cat.category);
    if (!form.getValues("shortDescription")) form.setValue("shortDescription", listing.shortDescription);
    if (!form.getValues("detailedDescription")) {
      form.setValue("detailedDescription", listing.detailedDescription);
    }
    form.setValue("redirectUrl", listing.redirectUrl);
    form.setValue("tags", listing.tags.join(", "));
    form.setValue("features", listing.features.join(", "));
    form.setValue("featured", listing.featured);
    form.setValue("listedOnWebsite", listing.listedOnWebsite);
    form.setValue(
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
    form.setValue(
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
  }, [resolvedSlug, open, isEdit, form]);

  const onSubmit = async (values: FormValues) => {
    const slug = isEdit && agent ? agent.slug : resolveAgentSlug(values.agentType);
    if (!slug) {
      form.setError("agentType", {
        message: "Use a known type, e.g. LinkedIn Growth Agent or Lawyer Drafting Agent",
      });
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

    await new Promise((r) => setTimeout(r, 200));
    try {
      if (isEdit && agent) {
        await updateAgent(agent.id, {
          name: values.name,
          description: values.description?.trim() || listing.shortDescription,
          category: values.category.trim(),
          status: values.status as AgentStatus,
          listing,
        });
        toast.success("Agent updated", {
          description: `${values.name} · ${values.paymentType} · from $${derived.price}`,
        });
      } else {
        const created = await createAgent({
          name: values.name,
          slug,
          description: values.description || listing.shortDescription,
          category: values.category,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-2xl md:max-w-3xl">
        <SheetHeader className="border-b p-6">
          <SheetTitle>{isEdit ? "Edit agent" : "Add agent"}</SheetTitle>
          <SheetDescription>
            Choose subscription or credit-based pricing, then manage plans customers see on the
            website.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-glow">
                <TypeGlyph slug={resolvedSlug} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{catalog?.label ?? "Choose an agent type"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {catalog?.description ??
                    "Type LinkedIn or Lawyer to match a supported agent package."}
                </p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Basics
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="agent-name">Agent name</Label>
                <Input
                  id="agent-name"
                  placeholder={catalog?.label ?? "e.g. Growth LinkedIn Bot"}
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="agent-type">Agent type</Label>
                  <Input
                    id="agent-type"
                    list="agent-type-options"
                    placeholder="e.g. LinkedIn Growth Agent"
                    readOnly={isEdit}
                    {...form.register("agentType")}
                  />
                  <datalist id="agent-type-options">
                    <option value="LinkedIn Growth Agent" />
                    <option value="Lawyer Drafting Agent" />
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="agent-category">Category</Label>
                  <Input
                    id="agent-category"
                    list="agent-category-options"
                    placeholder="e.g. Social Media"
                    {...form.register("category")}
                  />
                  <datalist id="agent-category-options">
                    <option value="Social Media" />
                    <option value="Lead Generation" />
                    <option value="Legal & Compliance" />
                    <option value="Marketing" />
                    <option value="Content Creation" />
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as AgentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Website listing
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="short-desc">Short description</Label>
                <Input
                  id="short-desc"
                  placeholder="Punchy one-liner shown on marketplace cards"
                  {...form.register("shortDescription")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="detailed-desc">Detailed description</Label>
                <Textarea
                  id="detailed-desc"
                  rows={4}
                  placeholder="Full overview for the agent detail page"
                  {...form.register("detailedDescription")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" placeholder="LinkedIn, Lead Gen" {...form.register("tags")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="features">Key features</Label>
                <Textarea
                  id="features"
                  rows={2}
                  placeholder="Feature bullets (comma-separated)"
                  {...form.register("features")}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment type
              </h3>
              <RadioGroup
                value={paymentType}
                onValueChange={(v) => form.setValue("paymentType", v as PaymentType)}
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
                  plans={form.watch("subscriptionPlans")}
                  onChange={(next) => form.setValue("subscriptionPlans", next, { shouldValidate: true })}
                  error={form.formState.errors.subscriptionPlans?.root?.message || form.formState.errors.subscriptionPlans?.message}
                />
              ) : (
                <CreditPacksEditor
                  packs={form.watch("creditPacks")}
                  onChange={(next) => form.setValue("creditPacks", next, { shouldValidate: true })}
                  error={form.formState.errors.creditPacks?.root?.message || form.formState.errors.creditPacks?.message}
                />
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Access & links
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="redirect-url">Redirect URL (agent panel)</Label>
                <Input
                  id="redirect-url"
                  type="url"
                  {...form.register("redirectUrl")}
                />
                {form.formState.errors.redirectUrl && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.redirectUrl.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-url">Demo URL</Label>
                <Input id="demo-url" type="url" {...form.register("demoUrl")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="docs-url">Documentation URL</Label>
                <Input id="docs-url" type="url" {...form.register("documentationUrl")} />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">List on website</p>
                  <p className="text-xs text-muted-foreground">Show in the public marketplace</p>
                </div>
                <Switch
                  checked={form.watch("listedOnWebsite")}
                  onCheckedChange={(v) => form.setValue("listedOnWebsite", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-xs text-muted-foreground">Highlight on homepage / explore</p>
                </div>
                <Switch
                  checked={form.watch("featured")}
                  onCheckedChange={(v) => form.setValue("featured", v)}
                />
              </div>
            </section>
          </div>

          <SheetFooter className="border-t bg-muted/30 p-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="shadow-elegant">
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add agent"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
