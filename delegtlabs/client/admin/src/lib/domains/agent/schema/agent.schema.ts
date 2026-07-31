import { z } from "zod";

export const agentSlugSchema = z.enum(["linkedin-agent", "lawyer-agent"]);
export const agentStatusSchema = z.enum(["active", "paused", "draft"]);

export const agentCreateSchema = z.object({
  name: z.string().min(1),
  slug: agentSlugSchema,
  description: z.string().optional(),
  category: z.string().optional(),
  status: agentStatusSchema.optional(),
});
