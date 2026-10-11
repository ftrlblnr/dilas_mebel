import "server-only";
import { prisma } from "@/lib/prisma";
import type { Lead, LeadSource, LeadStatus, LeadNote, LeadActivity, Task, LostReason, Prisma } from "@prisma/client";
import { OVERDUE_HOURS, STATUS_LABEL, SOURCE_LABEL } from "@/lib/lead-labels";
import { notifyNewUnassignedLead, notifyLeadAssigned, notifyNewNoteFromColleague } from "@/lib/lead-notifications";
import { normalizePhone } from "@/lib/utils";
import { findOrCreateCustomerByPhone } from "@/lib/customers-server";

export interface LeadItemInput {
  productId?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  criterionName?: string;
  variantLabel?: string;
}

export interface CreateLeadInput {
  refNumber: string;
  source: LeadSource;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  comment?: string;
  preferredTime?: string;
  items?: LeadItemInput[];
  totalPrice?: number;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const phone = normalizePhone(input.phone);
  const customer = await findOrCreateCustomerByPhone(phone, {
    fullName: input.fullName,
    email: input.email,
    city: input.city,
  });
  const lead = await prisma.lead.create({
    data: {
      refNumber: input.refNumber,
      source: input.source,
      fullName: input.fullName,
      phone,
      email: input.email,
      city: input.city,
      comment: input.comment,
      preferredTime: input.preferredTime,
      itemsJson: JSON.stringify(input.items ?? []),
      totalPrice: input.totalPrice ?? 0,
      customerId: customer.id,
    },
  });
  notifyNewUnassignedLead(lead).catch((err) => console.error("telegram notify failed:", err));
  return lead;
}

export type LeadWithNotes = Lead & {
  notes: (LeadNote & { author: { name: string } })[];
  assignedTo: { id: string; name: string } | null;
  activities: (LeadActivity & { user: { name: string } })[];
  customer: { id: string; fullName: string; phone: string };
  order: { amount: number; payments: { amount: number; refunds: { amount: number }[] }[] } | null;
};

export type LeadWithDetails = LeadWithNotes & {
  tasks: (Task & { assignedTo: { name: string } })[];
};

const LEAD_INCLUDE = {
  notes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" as const } },
  assignedTo: { select: { id: true, name: true } },
  activities: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" as const } },
  customer: { select: { id: true, fullName: true, phone: true } },
  order: {
    select: {
      amount: true,
      payments: {
        where: { status: "CONFIRMED" as const },
        select: { amount: true, refunds: { select: { amount: true } } },
      },
    },
  },
};

const LEAD_DETAIL_INCLUDE = {
  ...LEAD_INCLUDE,
  tasks: { include: { assignedTo: { select: { name: true } } }, orderBy: { dueAt: "asc" as const } },
};

/** Актор, от имени которого выполняется запрос — определяет область видимости заявок. */
export interface LeadActor {
  id: string;
  role: "ADMIN" | "MANAGER";
}

/** MANAGER видит только свои + нераспределённые заявки; ADMIN — без ограничений (undefined). */
export function leadScopeCondition(actor?: LeadActor): Prisma.LeadWhereInput | undefined {
  if (actor?.role !== "MANAGER") return undefined;
  return { OR: [{ assignedToId: actor.id }, { assignedToId: null }] };
}

export interface ListLeadsFilter {
  status?: LeadStatus;
  source?: LeadSource;
  /** a user id, "unassigned", or omitted for no filter */
  assignedToId?: string;
  customerId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  /** include archived leads in results (default: excluded) */
  includeArchived?: boolean;
  /** skip pagination and return every matching lead (used by CSV export) */
  all?: boolean;
}

export interface ListLeadsResult {
  leads: LeadWithNotes[];
  total: number;
}

export async function listLeads(filter: ListLeadsFilter = {}, actor?: LeadActor): Promise<ListLeadsResult> {
  const conditions: Prisma.LeadWhereInput[] = [];
  if (!filter.includeArchived) conditions.push({ archivedAt: null });
  if (filter.status) conditions.push({ status: filter.status });
  if (filter.source) conditions.push({ source: filter.source });
  if (filter.customerId) conditions.push({ customerId: filter.customerId });

  if (filter.assignedToId === "unassigned") {
    conditions.push({ assignedToId: null });
  } else if (filter.assignedToId && (!actor || actor.role === "ADMIN" || filter.assignedToId === actor.id)) {
    conditions.push({ assignedToId: filter.assignedToId });
  }
  // MANAGER requesting a different manager's id: request is ignored, full
  // manager scope (own + unassigned) is enforced below instead.

  if (filter.dateFrom || filter.dateTo) {
    conditions.push({
      createdAt: {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      },
    });
  }
  if (filter.search?.trim()) {
    const term = filter.search.trim();
    conditions.push({
      OR: [
        { fullName: { contains: term } },
        { phone: { contains: term } },
        { refNumber: { contains: term } },
      ],
    });
  }

  const scope = leadScopeCondition(actor);
  if (scope) conditions.push(scope);

  const where: Prisma.LeadWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const page = Math.max(1, filter.page ?? 1);
  const pageSize = filter.pageSize ?? 20;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: LEAD_INCLUDE,
      ...(filter.all ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total };
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  assignedToId?: string | null;
  archived?: boolean;
  fullName?: string;
  phone?: string;
  email?: string | null;
  city?: string | null;
  comment?: string | null;
  preferredTime?: string | null;
  lostReason?: LostReason;
  lostReasonNote?: string | null;
}

export async function getLeadById(id: string, actor?: LeadActor): Promise<LeadWithDetails | null> {
  const lead = await prisma.lead.findUnique({ where: { id }, include: LEAD_DETAIL_INCLUDE });
  if (!lead) return null;
  if (actor?.role === "MANAGER" && lead.assignedToId !== null && lead.assignedToId !== actor.id) {
    return null;
  }
  return lead;
}

export async function updateLead(id: string, input: UpdateLeadInput, actorId?: string, actorRole?: LeadActor["role"]): Promise<Lead> {
  if (actorRole === "MANAGER" && actorId) {
    const current = await prisma.lead.findUnique({ where: { id }, select: { assignedToId: true } });
    if (!current || (current.assignedToId !== null && current.assignedToId !== actorId)) {
      throw new Error("Lead not found");
    }
  }

  if (input.status === "LOST" && !input.lostReason) {
    const current = await prisma.lead.findUnique({ where: { id }, select: { lostReason: true } });
    if (!current?.lostReason) throw new Error("Укажите причину отказа");
  }

  const { archived, ...rest } = input;
  const data = {
    ...rest,
    ...(rest.phone === undefined ? {} : { phone: normalizePhone(rest.phone) }),
    ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
  };

  if (!actorId || (input.status === undefined && input.assignedToId === undefined)) {
    return prisma.lead.update({ where: { id }, data });
  }

  let assignedNotifyTarget: string | null = null;

  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.lead.findUniqueOrThrow({ where: { id }, select: { status: true, assignedToId: true } });
    const updatedLead = await tx.lead.update({ where: { id }, data });

    const activities: Prisma.LeadActivityCreateManyInput[] = [];
    if (input.status !== undefined && input.status !== before.status) {
      activities.push({
        leadId: id,
        userId: actorId,
        field: "status",
        oldValue: STATUS_LABEL[before.status],
        newValue: STATUS_LABEL[input.status],
      });
    }
    if (input.assignedToId !== undefined && input.assignedToId !== before.assignedToId) {
      const [oldUser, newUser] = await Promise.all([
        before.assignedToId ? tx.user.findUnique({ where: { id: before.assignedToId }, select: { name: true } }) : null,
        input.assignedToId ? tx.user.findUnique({ where: { id: input.assignedToId }, select: { name: true } }) : null,
      ]);
      activities.push({
        leadId: id,
        userId: actorId,
        field: "assignedTo",
        oldValue: oldUser?.name ?? "не назначено",
        newValue: newUser?.name ?? "не назначено",
      });
      if (input.assignedToId && input.assignedToId !== actorId) assignedNotifyTarget = input.assignedToId;
    }
    if (activities.length > 0) await tx.leadActivity.createMany({ data: activities });

    return updatedLead;
  });

  if (assignedNotifyTarget) {
    notifyLeadAssigned(updated, assignedNotifyTarget).catch((err) => console.error("telegram notify failed:", err));
  }

  return updated;
}

export async function bulkUpdateLeads(
  ids: string[],
  data: { status?: LeadStatus; assignedToId?: string | null },
  actorId?: string,
  actorRole?: LeadActor["role"]
): Promise<number> {
  if (data.status === "LOST") {
    throw new Error("Закрытие без продажи с указанием причины доступно только по одной заявке — откройте заявку и закройте её оттуда");
  }

  let scopedIds = ids;
  if (actorRole === "MANAGER" && actorId) {
    const allowed = await prisma.lead.findMany({
      where: { id: { in: ids }, OR: [{ assignedToId: actorId }, { assignedToId: null }] },
      select: { id: true },
    });
    scopedIds = allowed.map((l) => l.id);
    if (scopedIds.length === 0) return 0;
  }

  if (!actorId || (data.status === undefined && data.assignedToId === undefined)) {
    const result = await prisma.lead.updateMany({ where: { id: { in: scopedIds } }, data });
    return result.count;
  }

  const before = await prisma.lead.findMany({
    where: { id: { in: scopedIds } },
    select: { id: true, status: true, assignedToId: true },
  });
  const result = await prisma.lead.updateMany({ where: { id: { in: scopedIds } }, data });

  const nameCache = new Map<string, string>();
  async function nameOf(userId: string | null): Promise<string> {
    if (!userId) return "не назначено";
    if (!nameCache.has(userId)) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      nameCache.set(userId, u?.name ?? "не назначено");
    }
    return nameCache.get(userId)!;
  }

  const activities: Prisma.LeadActivityCreateManyInput[] = [];
  const assignedLeadIds: string[] = [];
  for (const lead of before) {
    if (data.status !== undefined && data.status !== lead.status) {
      activities.push({
        leadId: lead.id,
        userId: actorId,
        field: "status",
        oldValue: STATUS_LABEL[lead.status],
        newValue: STATUS_LABEL[data.status],
      });
    }
    if (data.assignedToId !== undefined && data.assignedToId !== lead.assignedToId) {
      activities.push({
        leadId: lead.id,
        userId: actorId,
        field: "assignedTo",
        oldValue: await nameOf(lead.assignedToId),
        newValue: await nameOf(data.assignedToId),
      });
      if (data.assignedToId && data.assignedToId !== actorId) assignedLeadIds.push(lead.id);
    }
  }
  if (activities.length > 0) await prisma.leadActivity.createMany({ data: activities });

  if (assignedLeadIds.length > 0 && data.assignedToId) {
    const assignedLeads = await prisma.lead.findMany({
      where: { id: { in: assignedLeadIds } },
      select: { refNumber: true, fullName: true, phone: true },
    });
    for (const lead of assignedLeads) {
      notifyLeadAssigned(lead, data.assignedToId).catch((err) => console.error("telegram notify failed:", err));
    }
  }

  return result.count;
}

export async function addLeadNote(leadId: string, authorId: string, text: string): Promise<LeadNote> {
  const note = await prisma.leadNote.create({ data: { leadId, authorId, text } });
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { refNumber: true, assignedToId: true } });
  if (lead) {
    notifyNewNoteFromColleague(lead, authorId, text).catch((err) => console.error("telegram notify failed:", err));
  }
  return note;
}

export async function updateLeadNote(id: string, text: string): Promise<LeadNote> {
  return prisma.leadNote.update({ where: { id }, data: { text } });
}

export async function deleteLeadNote(id: string): Promise<void> {
  await prisma.leadNote.delete({ where: { id } });
}

export async function getLeadNoteAuthor(id: string): Promise<string | null> {
  const note = await prisma.leadNote.findUnique({ where: { id }, select: { authorId: true } });
  return note?.authorId ?? null;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function exportLeadsCsv(filter: ListLeadsFilter = {}, actor?: LeadActor): Promise<string> {
  const { leads } = await listLeads({ ...filter, all: true, page: undefined, pageSize: undefined }, actor);
  const header = ["№", "Дата", "Источник", "Имя", "Телефон", "Email", "Город", "Статус", "Ответственный", "Сумма"];
  const rows = leads.map((lead) => [
    lead.refNumber,
    lead.createdAt.toLocaleString("ru-RU"),
    SOURCE_LABEL[lead.source],
    lead.fullName,
    `+7${lead.phone}`,
    lead.email ?? "",
    lead.city ?? "",
    STATUS_LABEL[lead.status],
    lead.assignedTo?.name ?? "",
    String(lead.totalPrice),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  unassigned: number;
  overdue: number;
  overdueTasks: number;
  conversionRate: number | null;
  lossReasons: { reason: LostReason; count: number }[];
  managerLoad: { id: string; name: string; count: number }[];
}

export async function getLeadStats(): Promise<LeadStats> {
  const activeWhere: Prisma.LeadWhereInput = { archivedAt: null };
  const overdueThreshold = new Date(Date.now() - OVERDUE_HOURS * 60 * 60 * 1000);

  const [total, statusGroups, sourceGroups, unassigned, overdue, overdueTasks, lossReasonGroups, users] = await Promise.all([
    prisma.lead.count({ where: activeWhere }),
    prisma.lead.groupBy({ by: ["status"], where: activeWhere, _count: true }),
    prisma.lead.groupBy({ by: ["source"], where: activeWhere, _count: true }),
    prisma.lead.count({ where: { ...activeWhere, assignedToId: null } }),
    prisma.lead.count({ where: { ...activeWhere, status: "NEW", createdAt: { lte: overdueThreshold } } }),
    prisma.task.count({ where: { completedAt: null, dueAt: { lte: new Date() } } }),
    prisma.lead.groupBy({ by: ["lostReason"], where: { ...activeWhere, status: "LOST", lostReason: { not: null } }, _count: true }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const lossReasons = lossReasonGroups
    .filter((g): g is typeof g & { lostReason: LostReason } => g.lostReason !== null)
    .map((g) => ({ reason: g.lostReason, count: g._count }));

  const byStatus = {
    NEW: 0,
    NEEDS_ASSESSMENT: 0,
    FURNITURE_SELECTION: 0,
    QUOTE_SENT: 0,
    NEGOTIATION: 0,
    AWAITING_PAYMENT: 0,
    WON: 0,
    LOST: 0,
  } as Record<LeadStatus, number>;
  for (const g of statusGroups) byStatus[g.status] = g._count;

  const bySource = { CALLBACK: 0, QUICK_CALLBACK: 0, CUSTOM_ORDER: 0 } as Record<LeadSource, number>;
  for (const g of sourceGroups) bySource[g.source] = g._count;

  const managerLoad = await Promise.all(
    users.map(async (u) => ({
      id: u.id,
      name: u.name,
      count: await prisma.lead.count({
        where: { ...activeWhere, assignedToId: u.id, status: { notIn: ["WON", "LOST"] } },
      }),
    }))
  );
  managerLoad.sort((a, b) => b.count - a.count);

  const decided = byStatus.WON + byStatus.LOST;
  const conversionRate = decided > 0 ? byStatus.WON / decided : null;

  return { total, byStatus, bySource, unassigned, overdue, overdueTasks, conversionRate, lossReasons, managerLoad };
}

export function parseLeadItems(lead: Lead): LeadItemInput[] {
  try {
    const parsed = JSON.parse(lead.itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
