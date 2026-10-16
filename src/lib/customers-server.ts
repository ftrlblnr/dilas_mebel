import "server-only";
import { prisma } from "@/lib/prisma";
import type { Customer, Prisma } from "@prisma/client";
import type { LeadActor } from "@/lib/leads-server";

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

export interface ListCustomersFilter {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListCustomersResult {
  customers: Customer[];
  total: number;
}

/** MANAGER only sees customers who have at least one lead assigned to them; ADMIN sees all. */
export async function listCustomers(filter: ListCustomersFilter = {}, actor?: LeadActor): Promise<ListCustomersResult> {
  const conditions: Prisma.CustomerWhereInput[] = [];
  if (filter.search?.trim()) {
    const term = filter.search.trim();
    conditions.push({ OR: [{ fullName: { contains: term } }, { phone: { contains: term } }] });
  }
  if (actor?.role === "MANAGER") {
    conditions.push({ leads: { some: { assignedToId: actor.id } } });
  }
  const where: Prisma.CustomerWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const page = Math.max(1, filter.page ?? 1);
  const pageSize = filter.pageSize ?? 20;
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.customer.count({ where }),
  ]);
  return { customers, total };
}
