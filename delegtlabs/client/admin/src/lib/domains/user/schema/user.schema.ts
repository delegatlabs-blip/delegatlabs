import { z } from "zod";

export const userStatusSchema = z.enum(["active", "invited", "suspended"]);
export const userRoleSchema = z.enum(["Owner", "Admin", "Editor", "Viewer", "Billing"]);

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  status: userStatusSchema.optional(),
  notes: z.string().optional(),
});

export const userUpdateSchema = userCreateSchema.partial();
