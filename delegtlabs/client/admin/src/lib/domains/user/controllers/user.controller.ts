"use server";

import * as userService from "../services/user.service";
import type { User, UserCreateInput, UserUpdateInput } from "../types";
import { mapUser } from "../utils/map-user";

export async function listUsers(): Promise<User[]> {
  const rows = await userService.fetchUsers();
  return rows.map(mapUser);
}

export async function createUser(
  input: UserCreateInput,
): Promise<{ user: User; oneTimePassword: string }> {
  const row = await userService.postUser(input);
  const { provisionOwnerAuth } = await import(
    "@/lib/domains/auth/services/provision.service"
  );
  const creds = await provisionOwnerAuth({
    adminId: row.id,
    email: row.email,
  });
  return { user: mapUser(row), oneTimePassword: creds.oneTimePassword };
}

export async function updateUser(
  id: string,
  patch: UserUpdateInput,
): Promise<User | undefined> {
  try {
    const row = await userService.putUser(id, patch);
    return mapUser(row);
  } catch {
    return undefined;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await userService.removeUser(id);
    return true;
  } catch {
    return false;
  }
}
