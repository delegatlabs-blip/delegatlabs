"use server";

import * as authService from "../services/auth.service";
import * as provisionService from "../services/provision.service";
import { ensureRbacSeed } from "../services/rbac-seed.service";
import {
  clearAdminAuthCookies,
  readAdminRefreshCookie,
  setAdminAuthCookies,
} from "../utils/cookies";

export async function seedRbac() {
  return ensureRbacSeed();
}

export async function loginOwnerAction(email: string, password: string) {
  const result = await authService.loginOwner(email, password);
  await setAdminAuthCookies(result.accessToken, result.refreshToken);
  return result;
}

export async function refreshOwnerAction() {
  const refresh = await readAdminRefreshCookie();
  if (!refresh) throw new Error("No refresh token");
  const result = await authService.refreshOwnerTokens(refresh);
  await setAdminAuthCookies(result.accessToken, result.refreshToken);
  return result;
}

export async function logoutOwnerAction() {
  await clearAdminAuthCookies();
}

export async function requestOwnerOtpAction(email: string) {
  return authService.requestOwnerPasswordOtp(email);
}

export async function verifyOwnerOtpAction(email: string, otp: string) {
  return authService.verifyOwnerOtp(email, otp);
}

export async function resetOwnerPasswordWithOtpAction(
  email: string,
  otp: string,
  newPassword: string,
) {
  await authService.resetOwnerPasswordWithOtp(email, otp, newPassword);
}

export async function resetOwnerPasswordAction(email: string, newPassword: string) {
  await authService.resetOwnerPassword(email, newPassword);
}

export async function provisionOwnerAuthAction(adminId: string, email: string) {
  return provisionService.provisionOwnerAuth({ adminId, email });
}

export async function provisionUserAuthAction(userId: string, email: string) {
  return provisionService.provisionUserAuth({ userId, email });
}
