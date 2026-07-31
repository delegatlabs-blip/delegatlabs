import { prisma } from "@/lib/db";
import type {
  ApiCustomer,
  CustomerCreateInput,
  CustomerUpdateInput,
} from "../types";

function toApiCustomer(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  plan: string;
  status: string;
  agentsPurchased: number;
  totalSpend: { toString(): string } | number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}): ApiCustomer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    plan: row.plan as ApiCustomer["plan"],
    status: row.status as ApiCustomer["status"],
    agents_purchased: row.agentsPurchased,
    total_spend: Number(row.totalSpend),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function fetchCustomers(): Promise<ApiCustomer[]> {
  const rows = await prisma.adminCustomer.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(toApiCustomer);
}

export async function postCustomer(input: CustomerCreateInput): Promise<ApiCustomer> {
  const row = await prisma.adminCustomer.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || "",
      company: input.company?.trim() || "",
      plan: input.plan ?? "Starter",
      status: input.status ?? "active",
      agentsPurchased: input.agents_purchased ?? 0,
      totalSpend: input.total_spend ?? 0,
      notes: input.notes?.trim() || "",
    },
  });
  return toApiCustomer(row);
}

export async function putCustomer(
  id: string,
  patch: CustomerUpdateInput,
): Promise<ApiCustomer> {
  const row = await prisma.adminCustomer.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.email !== undefined ? { email: patch.email.trim() } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
      ...(patch.company !== undefined ? { company: patch.company.trim() } : {}),
      ...(patch.plan !== undefined ? { plan: patch.plan } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.agents_purchased !== undefined
        ? { agentsPurchased: patch.agents_purchased }
        : {}),
      ...(patch.total_spend !== undefined ? { totalSpend: patch.total_spend } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes.trim() } : {}),
    },
  });
  return toApiCustomer(row);
}

export async function removeCustomer(id: string): Promise<void> {
  await prisma.adminCustomer.delete({ where: { id } });
}
