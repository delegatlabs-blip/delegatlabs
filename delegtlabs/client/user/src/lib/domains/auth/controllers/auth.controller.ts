import type { LoginInput, RegisterInput } from "../types";
import { requireTenantId } from "../utils/jwt";
import { useAuthStore } from "../session-store";
import {
  loginAction,
  logoutAction,
  registerAction,
  resetPasswordAction,
} from "../actions";

export async function login(input: LoginInput) {
  const session = await loginAction(input);
  useAuthStore.getState().setSession(session);
  requireTenantId({
    sub: session.userId,
    tenant_id: session.tenantId,
    email: session.email,
    role: session.role,
    must_reset: session.mustReset,
  });
  return session;
}

export async function register(input: RegisterInput) {
  const session = await registerAction(input);
  useAuthStore.getState().setSession(session);
  requireTenantId({
    sub: session.userId,
    tenant_id: session.tenantId,
    email: session.email,
    role: session.role,
  });
  return session;
}

export async function resetPassword(email: string, newPassword: string) {
  await resetPasswordAction(email, newPassword);
}

export async function logout() {
  try {
    await logoutAction();
  } catch {
    /* ignore */
  }
  useAuthStore.getState().clearSession();
}

export const loginUseCase = login;
export const registerUseCase = register;
export const logoutUseCase = logout;
export const resetPasswordUseCase = resetPassword;
