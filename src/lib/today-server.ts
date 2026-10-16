import "server-only";
import { prisma } from "@/lib/prisma";
import { leadScopeCondition, type LeadActor } from "@/lib/leads-server";

/** Активные (не закрытые) заявки в области видимости актора, у которых нет ни одной открытой задачи. */
export async function getLeadsWithoutOpenTask(actor: LeadActor, limit = 10) {
  const scope = leadScopeCondition(actor);
  return prisma.lead.findMany({
    where: {
      archivedAt: null,
      stage: { type: "WORK" },
      tasks: { none: { completedAt: null } },
      ...(scope ?? {}),
    },
    select: { id: true, refNumber: true, fullName: true, stage: { select: { name: true } }, assignedTo: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/** Новые заявки без ответственного — общая очередь, требующая разбора. */
export async function getUnassignedNewLeads(limit = 10) {
  return prisma.lead.findMany({
    where: { archivedAt: null, assignedToId: null, stage: { key: "NEW" } },
    select: { id: true, refNumber: true, fullName: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/** Просроченные задачи конкретного пользователя. */
export async function getMyOverdueTasks(userId: string, limit = 10) {
  return prisma.task.findMany({
    where: { assignedToId: userId, completedAt: null, dueAt: { lt: new Date() } },
    include: { lead: { select: { id: true, refNumber: true, fullName: true } } },
    orderBy: { dueAt: "asc" },
    take: limit,
  });
}

/**
 * Платежи, ждущие подтверждения. ADMIN видит все (он единственный, кто может
 * подтверждать), MANAGER — только те, что сам отправил на проверку.
 */
export async function getPendingPayments(actor: LeadActor, limit = 10) {
  return prisma.payment.findMany({
    where: {
      status: "PENDING_REVIEW",
      ...(actor.role === "ADMIN" ? {} : { submittedById: actor.id }),
    },
    include: { order: { select: { lead: { select: { id: true, refNumber: true, fullName: true } } } } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}
