export type CustomerStatus = "active" | "trial" | "churned" | "suspended";
export type CustomerPlan = "Free" | "Starter" | "Pro" | "Enterprise";

export type Customer = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  company: string;
  plan: CustomerPlan;
  status: CustomerStatus;
  agentsPurchased: number;
  totalSpend: number;
  lastOrderAt: string;
  createdAt: string;
};

const firstNames = ["Jordan", "Samira", "Leo", "Amara", "Felix", "Noor", "Hugo", "Ivy", "Ravi", "Claire", "Diego", "Hana", "Owen", "Tara", "Erik", "Maya", "Jules", "Sana", "Cole", "Rita"];
const lastNames = ["Brooks", "Hassan", "Vega", "Okeke", "Nguyen", "Patel", "Berg", "Kim", "Shah", "Moreau", "Costa", "Tanaka", "Walsh", "Singh", "Larsson", "Diaz", "Reed", "Ali", "Frost", "Lopez"];
const companies = ["Northwind AI", "BrightPath Labs", "Orbit Commerce", "Helix Media", "Cedar Analytics", "Nova Retail", "Pulse Health", "Summit Legal", "Atlas Growth", "Velvet Studio", "Quark Systems", "Beacon Co"];
const plans: CustomerPlan[] = ["Free", "Starter", "Pro", "Enterprise"];
const statuses: CustomerStatus[] = ["active", "active", "active", "trial", "churned", "suspended"];

function seeded(i: number) {
  const x = Math.sin(i * 7919 + 104729) * 233280;
  return x - Math.floor(x);
}

export const customers: Customer[] = Array.from({ length: 36 }, (_, i) => {
  const first = firstNames[Math.floor(seeded(i + 1) * firstNames.length)];
  const last = lastNames[Math.floor(seeded(i + 2) * lastNames.length)];
  const daysAgo = Math.floor(seeded(i + 3) * 500);
  const orderDaysAgo = Math.floor(seeded(i + 4) * 90);
  const plan = plans[Math.floor(seeded(i + 5) * plans.length)];
  const agents = Math.floor(seeded(i + 6) * 8) + (plan === "Free" ? 0 : 1);
  const spendBase = { Free: 0, Starter: 49, Pro: 199, Enterprise: 999 }[plan];
  return {
    id: `cus_${(2000 + i).toString(36)}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${companies[i % companies.length].toLowerCase().replace(/\s+/g, "")}.com`,
    avatar: `https://i.pravatar.cc/80?img=${((i + 20) % 70) + 1}`,
    company: companies[Math.floor(seeded(i + 7) * companies.length)],
    plan,
    status: statuses[Math.floor(seeded(i + 8) * statuses.length)],
    agentsPurchased: agents,
    totalSpend: Math.round(spendBase * (1 + seeded(i + 9) * 6) * 100) / 100,
    lastOrderAt: new Date(Date.now() - orderDaysAgo * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString(),
  };
});
