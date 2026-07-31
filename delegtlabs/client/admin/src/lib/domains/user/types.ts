export type UserStatus = "active" | "invited" | "suspended";
export type UserRole = "Owner" | "Admin" | "Editor" | "Viewer" | "Billing";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: UserRole | string;
  status: UserStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type UserCreateInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  status?: UserStatus;
  notes?: string;
};

export type UserUpdateInput = Partial<UserCreateInput>;

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  status?: UserStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
