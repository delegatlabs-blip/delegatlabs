import { z } from "zod";

export const memberRoleSchema = z.enum(["Owner", "Admin", "Editor", "Viewer"]);
export const memberStatusSchema = z.enum(["active", "invited", "suspended"]);

export const memberCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: memberRoleSchema.optional(),
  status: memberStatusSchema.optional(),
  department: z.string().optional(),
  notes: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const memberUpdateSchema = memberCreateSchema
  .omit({ password: true })
  .partial();
