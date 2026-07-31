import type { ApiCustomer, Customer } from "../types";

export function mapCustomer(row: ApiCustomer): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    company: row.company || "",
    plan: row.plan || "Starter",
    status: row.status || "active",
    agentsPurchased: Number(row.agents_purchased ?? 0),
    totalSpend: Number(row.total_spend ?? 0),
    notes: row.notes || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
