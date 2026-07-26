export type UserStatus = "active" | "invited" | "suspended";
export type UserRole = "Owner" | "Admin" | "Editor" | "Viewer" | "Billing";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
};

const firstNames = ["Sofia", "Marcus", "Priya", "Chidi", "Elena", "Kenji", "Anna", "Daniel", "Rahul", "Zara", "Lucas", "Mei", "Omar", "Ines", "Noah", "Aria", "Ivan", "Layla", "Milo", "Yara", "Theo", "Nina", "Kai", "June"];
const lastNames = ["Alvarez", "Lin", "Raman", "Okafor", "Ortiz", "Yamada", "Kowalski", "Wu", "Mehta", "Cohen", "Silva", "Chen", "Haddad", "Rossi", "Park", "Nakamura", "Petrov", "Farah", "Bianchi", "Dubois", "Ivanov", "Sato"];
const roles: UserRole[] = ["Owner", "Admin", "Editor", "Viewer", "Billing"];
const depts = ["Engineering", "Design", "Product", "Sales", "Support", "Marketing", "Finance"];
const statuses: UserStatus[] = ["active", "active", "active", "active", "invited", "suspended"];

function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const users: User[] = Array.from({ length: 42 }, (_, i) => {
  const first = firstNames[Math.floor(seeded(i + 1) * firstNames.length)];
  const last = lastNames[Math.floor(seeded(i + 2) * lastNames.length)];
  const daysAgo = Math.floor(seeded(i + 3) * 400);
  const hoursAgo = Math.floor(seeded(i + 4) * 480);
  return {
    id: `usr_${(1000 + i).toString(36)}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@delegatelabs.com`,
    avatar: `https://i.pravatar.cc/80?img=${(i % 70) + 1}`,
    role: roles[Math.floor(seeded(i + 5) * roles.length)],
    department: depts[Math.floor(seeded(i + 6) * depts.length)],
    status: statuses[Math.floor(seeded(i + 7) * statuses.length)],
    lastLogin: new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString(),
  };
});
