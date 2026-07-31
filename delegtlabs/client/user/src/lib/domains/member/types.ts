export type MemberRole = "Owner" | "Admin" | "Editor" | "Viewer";
export type MemberStatus = "active" | "invited" | "suspended";

/** Domain entity — always belongs to a tenant. */
export type Member = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: MemberRole | string;
  status: MemberStatus;
  department: string;
  notes: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemberCreateInput = {
  name: string;
  email: string;
  role?: MemberRole;
  status?: MemberStatus;
  department?: string;
  notes?: string;
  password?: string;
};

export type MemberUpdateInput = Partial<Omit<MemberCreateInput, "password">>;

export type MemberDto = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: string;
  status: MemberStatus;
  department?: string;
  notes?: string;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};
