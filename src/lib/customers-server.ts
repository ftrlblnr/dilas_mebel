import "server-only";
import { prisma } from "@/lib/prisma";
import type { Customer } from "@prisma/client";

export interface CustomerDefaults {
  fullName: string;
  email?: string | null;
  city?: string | null;
}

/**
 * Finds the customer by exact normalized-phone match, or creates one.
 * On match, only fills in previously-empty email/city — never overwrites
 * already-curated customer data with whatever a new lead happened to submit.
 */
export async function findOrCreateCustomerByPhone(phone: string, defaults: CustomerDefaults): Promise<Customer> {
  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (!existing) {
    return prisma.customer.create({
      data: { phone, fullName: defaults.fullName, email: defaults.email ?? null, city: defaults.city ?? null },
    });
  }

  const patch: { email?: string; city?: string } = {};
  if (!existing.email && defaults.email) patch.email = defaults.email;
  if (!existing.city && defaults.city) patch.city = defaults.city;
  if (Object.keys(patch).length === 0) return existing;

  return prisma.customer.update({ where: { id: existing.id }, data: patch });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return prisma.customer.findUnique({ where: { id } });
}
