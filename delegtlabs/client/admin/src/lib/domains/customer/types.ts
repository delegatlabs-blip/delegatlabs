export type CustomerStatus = "active" | "trial" | "churned" | "suspended";
export type CustomerPlan = "Free" | "Starter" | "Pro" | "Enterprise";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  plan: CustomerPlan;
  status: CustomerStatus;
  agentsPurchased: number;
  totalSpend: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerCreateInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  plan?: CustomerPlan;
  status?: CustomerStatus;
  agents_purchased?: number;
  total_spend?: number;
  notes?: string;
};

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export type ApiCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  plan?: CustomerPlan;
  status?: CustomerStatus;
  agents_purchased?: number;
  total_spend?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
