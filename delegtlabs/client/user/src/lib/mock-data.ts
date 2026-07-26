export type UserRole = "Admin" | "Editor" | "Viewer" | "Owner";
export type UserStatus = "active" | "invited" | "suspended";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
};

const firstNames = [
  "Elena", "Marcus", "Sarah", "Jameson", "Priya", "Kai", "Amara", "Diego",
  "Yuki", "Nadia", "Oliver", "Zara", "Leo", "Maya", "Ethan", "Ivy",
  "Rafael", "Anya", "Julian", "Hana", "Owen", "Mira", "Felix", "Talia",
];
const lastNames = [
  "Rodriguez", "Chen", "Jenkins", "Wu", "Patel", "Nakamura", "Okafor", "Silva",
  "Kim", "Al-Sayed", "Bennett", "Volkov", "Marchetti", "Hassan", "Novak", "Reyes",
];
const roles: UserRole[] = ["Admin", "Editor", "Viewer", "Owner"];
const departments = ["Engineering", "Design", "Product", "Marketing", "Sales", "Operations", "Finance"];
const statuses: UserStatus[] = ["active", "active", "active", "invited", "suspended"];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

export const mockUsers: User[] = Array.from({ length: 42 }, (_, i) => {
  const first = pick(firstNames, i * 3);
  const last = pick(lastNames, i * 7);
  const daysAgo = (i * 13) % 380;
  const created = new Date();
  created.setDate(created.getDate() - daysAgo);
  const lastLoginDays = (i * 5) % 30;
  const login = new Date();
  login.setDate(login.getDate() - lastLoginDays);
  return {
    id: `usr_${String(i + 1).padStart(4, "0")}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@vertex.io`,
    role: pick(roles, i),
    department: pick(departments, i * 2),
    status: pick(statuses, i),
    lastLogin: login.toISOString(),
    createdAt: created.toISOString(),
  };
});

export const revenueSeries = [
  { month: "Jan", revenue: 42000, target: 40000 },
  { month: "Feb", revenue: 51000, target: 45000 },
  { month: "Mar", revenue: 48500, target: 50000 },
  { month: "Apr", revenue: 61200, target: 55000 },
  { month: "May", revenue: 72800, target: 60000 },
  { month: "Jun", revenue: 68400, target: 65000 },
  { month: "Jul", revenue: 84900, target: 70000 },
  { month: "Aug", revenue: 92300, target: 75000 },
  { month: "Sep", revenue: 88700, target: 80000 },
  { month: "Oct", revenue: 101200, target: 85000 },
  { month: "Nov", revenue: 118400, target: 90000 },
  { month: "Dec", revenue: 128450, target: 95000 },
];

export const trafficSources = [
  { name: "Direct", value: 45, fill: "var(--color-chart-1)" },
  { name: "Organic", value: 32, fill: "var(--color-chart-2)" },
  { name: "Social", value: 15, fill: "var(--color-chart-3)" },
  { name: "Referral", value: 8, fill: "var(--color-chart-4)" },
];

export const recentOrders = [
  { id: "ORD-9028", customer: "Elena Rodriguez", email: "elena@company.co", amount: 1240, status: "completed" as const, date: "2m ago" },
  { id: "ORD-9027", customer: "Jameson Wu", email: "j.wu@enterprise.io", amount: 3120.5, status: "pending" as const, date: "15m ago" },
  { id: "ORD-9026", customer: "Sarah Jenkins", email: "s.jenkins@studio.xyz", amount: 450, status: "cancelled" as const, date: "1h ago" },
  { id: "ORD-9025", customer: "Priya Patel", email: "priya@northstar.dev", amount: 2890, status: "completed" as const, date: "2h ago" },
  { id: "ORD-9024", customer: "Kai Nakamura", email: "kai@orbit.co", amount: 780.25, status: "completed" as const, date: "4h ago" },
  { id: "ORD-9023", customer: "Amara Okafor", email: "amara@lumen.io", amount: 5420, status: "pending" as const, date: "6h ago" },
];

export const activityFeed = [
  { id: 1, type: "success" as const, title: "Subscription renewed", description: "Stellar Labs renewed the Enterprise plan", time: "2 min ago" },
  { id: 2, type: "info" as const, title: "New user registered", description: "Sarah Jenkins joined the team", time: "15 min ago" },
  { id: 3, type: "warning" as const, title: "Deployment warning", description: "Build v2.1.0 completed with warnings", time: "1 hour ago" },
  { id: 4, type: "success" as const, title: "Backup completed", description: "Daily backup finished successfully", time: "3 hours ago" },
  { id: 5, type: "info" as const, title: "API key created", description: "Marcus Chen created a new production API key", time: "5 hours ago" },
];