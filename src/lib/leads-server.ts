import "server-only";
import { prisma } from "@/lib/prisma";
import type { Lead, LeadSource, LeadNote, LeadActivity, Task, LostReason, Stage, Prisma } from "@prisma/client";
import { SOURCE_LABEL } from "@/lib/lead-labels";
import { notifyNewUnassignedLead, notifyLeadAssigned, notifyNewNoteFromColleague } from "@/lib/lead-notifications";
import { normalizePhone } from "@/lib/utils";
import { findOrCreateCustomerByPhone } from "@/lib/customers-server";
import { getStageByKey, listActiveStages } from "@/lib/stages-server";

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
  const newStage = await getStageByKey("NEW");
  if (!newStage) throw new Error("Начальный этап 'NEW' не найден — проверьте таблицу Stage");
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
      stageId: newStage.id,
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
  stage: Stage;
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
  stage: true,
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

/** MANAGER видит только свои заявки (нераспределённые назначает только ADMIN); ADMIN — без ограничений (undefined). */
export function leadScopeCondition(actor?: LeadActor): Prisma.LeadWhereInput | undefined {
  if (actor?.role !== "MANAGER") return undefined;
  return { assignedToId: actor.id };
}

export interface ListLeadsFilter {
  stageId?: string;
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
  if (filter.stageId) conditions.push({ stageId: filter.stageId });
  if (filter.source) conditions.push({ source: filter.source });
  if (filter.customerId) conditions.push({ customerId: filter.customerId });

  if (filter.assignedToId === "unassigned") {
    conditions.push({ assignedToId: null });
  } else if (filter.assignedToId && (!actor || actor.role === "ADMIN" || filter.assignedToId === actor.id)) {
    conditions.push({ assignedToId: filter.assignedToId });
  }
  // MANAGER requesting a different manager's id: request is ignored, full
  // manager scope (own leads only) is enforced below instead.

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
  assignedToId?: string | null;
  archived?: boolean;
  fullName?: string;
  phone?: string;
  email?: string | null;
  city?: string | null;
  comment?: string | null;
  preferredTime?: string | null;
}

export async function getLeadById(id: string, actor?: LeadActor): Promise<LeadWithDetails | null> {
  const lead = await prisma.lead.findUnique({ where: { id }, include: LEAD_DETAIL_INCLUDE });
  if (!lead) return null;
  if (actor?.role === "MANAGER" && lead.assignedToId !== actor.id) {
    return null;
  }
  return lead;
}

export async function updateLead(id: string, input: UpdateLeadInput, actorId?: string, actorRole?: LeadActor["role"]): Promise<Lead> {
  if (actorRole === "MANAGER" && actorId) {
    const current = await prisma.lead.findUnique({ where: { id }, select: { assignedToId: true } });
    if (!current || current.assignedToId !== actorId) {
      throw new Error("Lead not found");
    }
    if (input.assignedToId !== undefined) {
      throw new Error("Назначать заявки может только администратор");
    }
  }

  const { archived, ...rest } = input;
  const data = {
    ...rest,
    ...(rest.phone === undefined ? {} : { phone: normalizePhone(rest.phone) }),
    ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
  };

  if (!actorId || input.assignedToId === undefined) {
    return prisma.lead.update({ where: { id }, data });
  }

  let assignedNotifyTarget: string | null = null;

  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.lead.findUniqueOrThrow({ where: { id }, select: { assignedToId: true } });
    const updatedLead = await tx.lead.update({ where: { id }, data });

    if (input.assignedToId !== undefined && input.assignedToId !== before.assignedToId) {
      const [oldUser, newUser] = await Promise.all([
        before.assignedToId ? tx.user.findUnique({ where: { id: before.assignedToId }, select: { name: true } }) : null,
        input.assignedToId ? tx.user.findUnique({ where: { id: input.assignedToId }, select: { name: true } }) : null,
      ]);
      await tx.leadActivity.create({
        data: {
          leadId: id,
          userId: actorId,
          field: "assignedTo",
          oldValue: oldUser?.name ?? "не назначено",
          newValue: newUser?.name ?? "не назначено",
        },
      });
      if (input.assignedToId && input.assignedToId !== actorId) assignedNotifyTarget = input.assignedToId;
    }

    return updatedLead;
  });

  if (assignedNotifyTarget) {
    notifyLeadAssigned(updated, assignedNotifyTarget).catch((err) => console.error("telegram notify failed:", err));
  }

  return updated;
}

/** Advances a lead to the given target stage (validated by the caller via stage-transitions.ts guards). */
export async function advanceLeadStage(leadId: string, toStageId: string, actorId: string): Promise<Lead> {
  return prisma.$transaction(async (tx) => {
    const before = await tx.lead.findUniqueOrThrow({ where: { id: leadId }, include: { stage: true } });
    const toStage = await tx.stage.findUniqueOrThrow({ where: { id: toStageId } });
    const updated = await tx.lead.update({ where: { id: leadId }, data: { stageId: toStageId } });
    await tx.leadActivity.create({
      data: { leadId, userId: actorId, field: "stage", oldValue: before.stage.name, newValue: toStage.name },
    });
    return updated;
  });
}

/** Cancels a lead (-> "CANCELED" stage) with a reason, available from any non-terminal stage. */
export async function cancelLeadStage(
  leadId: string,
  actorId: string,
  reason: LostReason,
  note: string | null
): Promise<Lead> {
  const canceled = await getStageByKey("CANCELED");
  if (!canceled) throw new Error("Этап 'CANCELED' не найден — проверьте таблицу Stage");
  return prisma.$transaction(async (tx) => {
    const before = await tx.lead.findUniqueOrThrow({ where: { id: leadId }, include: { stage: true } });
    const updated = await tx.lead.update({
      where: { id: leadId },
      data: { stageId: canceled.id, lostReason: reason, lostReasonNote: note },
    });
    await tx.leadActivity.create({
      data: { leadId, userId: actorId, field: "stage", oldValue: before.stage.name, newValue: canceled.name },
    });
    return updated;
  });
}

export async function bulkUpdateLeads(
  ids: string[],
  data: { assignedToId?: string | null },
  actorId?: string,
  actorRole?: LeadActor["role"]
): Promise<number> {
  if (actorRole === "MANAGER" && data.assignedToId !== undefined) {
    throw new Error("Назначать заявки может только администратор");
  }

  let scopedIds = ids;
  if (actorRole === "MANAGER" && actorId) {
    const allowed = await prisma.lead.findMany({
      where: { id: { in: ids }, assignedToId: actorId },
      select: { id: true },
    });
    scopedIds = allowed.map((l) => l.id);
    if (scopedIds.length === 0) return 0;
  }

  if (!actorId || data.assignedToId === undefined) {
    const result = await prisma.lead.updateMany({ where: { id: { in: scopedIds } }, data });
    return result.count;
  }

  const before = await prisma.lead.findMany({
    where: { id: { in: scopedIds } },
    select: { id: true, assignedToId: true },
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
  const header = ["№", "Дата", "Источник", "Имя", "Телефон", "Email", "Город", "Этап", "Ответственный", "Сумма"];
  const rows = leads.map((lead) => [
    lead.refNumber,
    lead.createdAt.toLocaleString("ru-RU"),
    SOURCE_LABEL[lead.source],
    lead.fullName,
    `+7${lead.phone}`,
    lead.email ?? "",
    lead.city ?? "",
    lead.stage.name,
    lead.assignedTo?.name ?? "",
    String(lead.totalPrice),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
}

export interface LeadStats {
  total: number;
  byStage: { stageId: string; key: string; name: string; color: string; count: number }[];
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
  const { OVERDUE_HOURS } = await import("@/lib/lead-labels");
  const overdueThreshold = new Date(Date.now() - OVERDUE_HOURS * 60 * 60 * 1000);

  const [total, stageGroups, sourceGroups, unassigned, overdue, overdueTasks, lossReasonGroups, users, stages] = await Promise.all([
    prisma.lead.count({ where: activeWhere }),
    prisma.lead.groupBy({ by: ["stageId"], where: activeWhere, _count: true }),
    prisma.lead.groupBy({ by: ["source"], where: activeWhere, _count: true }),
    prisma.lead.count({ where: { ...activeWhere, assignedToId: null } }),
    prisma.lead.count({ where: { ...activeWhere, stage: { key: "NEW" }, createdAt: { lte: overdueThreshold } } }),
    prisma.task.count({ where: { completedAt: null, dueAt: { lte: new Date() } } }),
    prisma.lead.groupBy({ by: ["lostReason"], where: { ...activeWhere, stage: { key: "CANCELED" }, lostReason: { not: null } }, _count: true }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
    listActiveStages(),
  ]);

  const lossReasons = lossReasonGroups
    .filter((g): g is typeof g & { lostReason: LostReason } => g.lostReason !== null)
    .map((g) => ({ reason: g.lostReason, count: g._count }));

  const countByStageId = new Map(stageGroups.map((g) => [g.stageId, g._count]));
  const byStage = stages.map((s) => ({ stageId: s.id, key: s.key, name: s.name, color: s.color, count: countByStageId.get(s.id) ?? 0 }));

  const bySource = { CALLBACK: 0, QUICK_CALLBACK: 0, CUSTOM_ORDER: 0 } as Record<LeadSource, number>;
  for (const g of sourceGroups) bySource[g.source] = g._count;

  const managerLoad = await Promise.all(
    users.map(async (u) => ({
      id: u.id,
      name: u.name,
      count: await prisma.lead.count({
        where: { ...activeWhere, assignedToId: u.id, stage: { type: "WORK" } },
      }),
    }))
  );
  managerLoad.sort((a, b) => b.count - a.count);

  const won = byStage.find((s) => s.key === "DONE")?.count ?? 0;
  const lost = byStage.find((s) => s.key === "CANCELED")?.count ?? 0;
  const decided = won + lost;
  const conversionRate = decided > 0 ? won / decided : null;

  return { total, byStage, bySource, unassigned, overdue, overdueTasks, conversionRate, lossReasons, managerLoad };
}

export function parseLeadItems(lead: Lead): LeadItemInput[] {
  try {
    const parsed = JSON.parse(lead.itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
