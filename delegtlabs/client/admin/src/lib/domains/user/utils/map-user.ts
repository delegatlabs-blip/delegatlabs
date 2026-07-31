import type { ApiUser, User } from "../types";

export function mapUser(row: ApiUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    company: row.company || "",
    role: row.role || "Viewer",
    status: row.status || "active",
    notes: row.notes || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
