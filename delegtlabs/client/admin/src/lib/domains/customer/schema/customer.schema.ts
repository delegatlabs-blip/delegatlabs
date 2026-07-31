import { z } from "zod";

export const customerStatusSchema = z.enum(["active", "trial", "churned", "suspended"]);
export const customerPlanSchema = z.enum(["Free", "Starter", "Pro", "Enterprise"]);

export const customerCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  plan: customerPlanSchema.optional(),
  status: customerStatusSchema.optional(),
  agents_purchased: z.number().int().nonnegative().optional(),
  total_spend: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();
