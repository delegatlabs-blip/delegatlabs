"use server";

import * as customerService from "../services/customer.service";
import type { Customer, CustomerCreateInput, CustomerUpdateInput } from "../types";
import { mapCustomer } from "../utils/map-customer";

export async function listCustomers(): Promise<Customer[]> {
  const rows = await customerService.fetchCustomers();
  return rows.map(mapCustomer);
}

export async function createCustomer(
  input: CustomerCreateInput,
): Promise<{ customer: Customer; oneTimePassword: string }> {
  const row = await customerService.postCustomer(input);
  const { provisionUserAuth } = await import(
    "@/lib/domains/auth/services/provision.service"
  );
  const creds = await provisionUserAuth({
    userId: row.id,
    email: row.email,
  });
  return { customer: mapCustomer(row), oneTimePassword: creds.oneTimePassword };
}

export async function updateCustomer(
  id: string,
  patch: CustomerUpdateInput,
): Promise<Customer | undefined> {
  try {
    const row = await customerService.putCustomer(id, patch);
    return mapCustomer(row);
  } catch {
    return undefined;
  }
}

export async function deleteCustomer(id: string): Promise<boolean> {
  try {
    await customerService.removeCustomer(id);
    return true;
  } catch {
    return false;
  }
}
