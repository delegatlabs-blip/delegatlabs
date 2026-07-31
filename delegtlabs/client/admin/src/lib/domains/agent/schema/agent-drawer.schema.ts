import { z } from "zod";

const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Plan name required"),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  currency: z.string().min(1, "Currency required"),
  billingInterval: z.enum(["monthly", "yearly", "one-time"]),
  featuresText: z.string().optional(),
  active: z.boolean(),
});

const creditPackSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Pack name required"),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  currency: z.string().min(1, "Currency required"),
  credits: z.coerce.number().min(1, "Credits must be at least 1"),
  featuresText: z.string().optional(),
  active: z.boolean(),
});

export const agentDrawerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    agentType: z
      .string()
      .trim()
      .min(1, "Agent type is required")
      .refine(
        (v) => {
          const n = v.toLowerCase();
          return (
            n === "linkedin-agent" ||
            n.includes("linkedin") ||
            n === "lawyer-agent" ||
            n.includes("lawyer") ||
            n.includes("legal")
          );
        },
        { message: "Enter LinkedIn Growth Agent or Lawyer Drafting Agent" },
      ),
    category: z.string().trim().min(1, "Category is required"),
    description: z.string().optional(),
    status: z.enum(["draft", "active", "paused"]),
    shortDescription: z
      .string()
      .trim()
      .min(8, "Short description must be at least 8 characters"),
    detailedDescription: z
      .string()
      .trim()
      .min(20, "Detailed description must be at least 20 characters"),
    paymentType: z.enum(["subscription", "credit"]),
    subscriptionPlans: z.array(subscriptionPlanSchema),
    creditPacks: z.array(creditPackSchema),
    redirectUrl: z
      .string()
      .trim()
      .url("Enter a valid redirect URL (include https://)"),
    demoUrl: z
      .string()
      .trim()
      .refine((v) => v === "" || z.string().url().safeParse(v).success, {
        message: "Enter a valid demo URL",
      }),
    documentationUrl: z
      .string()
      .trim()
      .refine((v) => v === "" || z.string().url().safeParse(v).success, {
        message: "Enter a valid documentation URL",
      }),
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

export type AgentDrawerFormValues = z.infer<typeof agentDrawerSchema>;
