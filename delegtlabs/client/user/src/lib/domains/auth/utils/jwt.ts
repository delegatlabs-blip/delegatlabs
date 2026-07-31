import type { SessionClaims, TenantId } from "../types";

export function asTenantId(value: string): TenantId {
  if (!value || typeof value !== "string") {
    throw new Error("tenant_id is required");
  }
  return value as TenantId;
}

/** Call wherever a tenant-scoped operation starts. */
export function requireTenantId(claims: SessionClaims | null | undefined): TenantId {
  if (!claims?.tenant_id) {
    throw new Error("Missing tenant_id in session — please sign in again");
  }
  return asTenantId(claims.tenant_id);
}

/** Decode JWT payload (no signature verify — server verifies on every request). */
export function decodeJwtPayload(token: string): SessionClaims | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const raw = JSON.parse(json) as Record<string, unknown>;
    if (!raw.tenant_id || !raw.sub) return null;
    return {
      sub: String(raw.sub),
      tenant_id: String(raw.tenant_id),
      email: String(raw.email ?? ""),
      role: String(raw.role ?? "Viewer"),
      must_reset: Boolean(raw.must_reset),
      exp: typeof raw.exp === "number" ? raw.exp : undefined,
    };
  } catch {
    return null;
  }
}
