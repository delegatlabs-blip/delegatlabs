import type { AuthSession, TokenDto } from "../types";

export function mapSession(dto: TokenDto): AuthSession {
  return {
    accessToken: dto.access_token,
    refreshToken: "",
    tenantId: dto.tenant_id,
    userId: dto.user_id,
    email: dto.email,
    role: dto.role,
    name: dto.name,
  };
}
