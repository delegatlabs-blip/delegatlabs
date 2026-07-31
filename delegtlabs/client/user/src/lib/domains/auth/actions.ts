"use server";

import * as authService from "./services/auth.service";
import type { LoginInput, RegisterInput } from "./types";
import {
  clearUserAuthCookies,
  readUserRefreshCookie,
  setUserAuthCookies,
} from "./utils/cookies";

export async function loginAction(input: LoginInput) {
  const session = await authService.postLogin(input);
  await setUserAuthCookies(session.accessToken, session.refreshToken);
  return session;
}

export async function registerAction(input: RegisterInput) {
  const session = await authService.postRegister(input);
  await setUserAuthCookies(session.accessToken, session.refreshToken);
  return session;
}

export async function refreshUserAction() {
  const refresh = await readUserRefreshCookie();
  if (!refresh) throw new Error("No refresh token");
  const session = await authService.refreshUserTokens(refresh);
  await setUserAuthCookies(session.accessToken, session.refreshToken);
  return session;
}

export async function logoutAction() {
  await clearUserAuthCookies();
}

export async function resetPasswordAction(email: string, newPassword: string) {
  await authService.resetUserPassword(email, newPassword);
}

export async function requestUserOtpAction(email: string) {
  return authService.requestUserPasswordOtp(email);
}

export async function verifyUserOtpAction(email: string, otp: string) {
  return authService.verifyUserOtp(email, otp);
}

export async function resetUserPasswordWithOtpAction(
  email: string,
  otp: string,
  newPassword: string,
) {
  await authService.resetUserPasswordWithOtp(email, otp, newPassword);
}
