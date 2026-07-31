export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  userId: string;
  email: string;
  role: string;
  name: string;
  mustReset?: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  tenantName: string;
  name: string;
  email: string;
  password: string;
};

export type TenantId = string & { readonly __brand: "TenantId" };

export type SessionClaims = {
  sub: string;
  tenant_id: string;
  email: string;
  role: string;
  must_reset?: boolean;
  exp?: number;
};

export type TokenDto = {
  access_token: string;
  tenant_id: string;
  user_id: string;
  email: string;
  role: string;
  name: string;
};
