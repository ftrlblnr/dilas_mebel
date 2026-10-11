import "server-only";
import { prisma } from "@/lib/prisma";
import { sendManagerMessage } from "@/lib/telegram-manager";
import { OVERDUE_HOURS } from "@/lib/lead-labels";

interface LeadContactInfo {
  refNumber: string;
  fullName: string;
  phone: string;
}

export async function notifyNewUnassignedLead(lead: LeadContactInfo): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  if (admins.length === 0) return;
  const text = `Новая заявка ${lead.refNumber}\n${lead.fullName}, +7${lead.phone}\nНикто не назначен.`;
  await Promise.all(admins.map((a) => sendManagerMessage(a.telegramChatId!, text)));
}

export async function notifyLeadAssigned(lead: LeadContactInfo, managerId: string): Promise<void> {
  const manager = await prisma.user.findUnique({ where: { id: managerId }, select: { telegramChatId: true } });
  if (!manager?.telegramChatId) return;
  const text = `Вам назначена заявка ${lead.refNumber}\n${lead.fullName}, +7${lead.phone}`;
  await sendManagerMessage(manager.telegramChatId, text);
}

export async function notifyNewNoteFromColleague(
  lead: { refNumber: string; assignedToId: string | null },
  authorId: string,
  noteText: string
): Promise<void> {
  if (!lead.assignedToId || lead.assignedToId === authorId) return;
  const manager = await prisma.user.findUnique({
    where: { id: lead.assignedToId },
    select: { telegramChatId: true },
  });
  if (!manager?.telegramChatId) return;
  const text = `Новая заметка по заявке ${lead.refNumber}:\n${noteText}`;
  await sendManagerMessage(manager.telegramChatId, text);
}

export async function notifyOverdueLeads(): Promise<number> {
  const threshold = new Date(Date.now() - OVERDUE_HOURS * 60 * 60 * 1000);
  const overdueLeads = await prisma.lead.findMany({
    where: { status: "NEW", archivedAt: null, createdAt: { lte: threshold }, overdueNotifiedAt: null },
    select: { id: true, refNumber: true, fullName: true, phone: true },
  });
  if (overdueLeads.length === 0) return 0;

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  if (admins.length === 0) return 0;

  for (const lead of overdueLeads) {
    const text = `Заявка ${lead.refNumber} просрочена (более ${OVERDUE_HOURS} ч. без реакции)\n${lead.fullName}, +7${lead.phone}`;
    await Promise.all(admins.map((a) => sendManagerMessage(a.telegramChatId!, text)));
  }

  await prisma.lead.updateMany({
    where: { id: { in: overdueLeads.map((l) => l.id) } },
    data: { overdueNotifiedAt: new Date() },
  });

  return overdueLeads.length;
}

const TASK_ESCALATION_HOURS = 24;

export async function notifyOverdueTasks(): Promise<{ remindedCount: number; escalatedCount: number }> {
  const now = new Date();

  const toRemind = await prisma.task.findMany({
    where: { completedAt: null, dueAt: { lte: now }, overdueNotifiedAt: null },
    include: { lead: { select: { refNumber: true, fullName: true } }, assignedTo: { select: { telegramChatId: true } } },
  });
  for (const task of toRemind) {
    if (task.assignedTo.telegramChatId) {
      const text = `Просрочена задача по заявке ${task.lead.refNumber} (${task.lead.fullName})\nСрок: ${task.dueAt.toLocaleString("ru-RU")}`;
      await sendManagerMessage(task.assignedTo.telegramChatId, text);
    }
  }
  if (toRemind.length > 0) {
    await prisma.task.updateMany({ where: { id: { in: toRemind.map((t) => t.id) } }, data: { overdueNotifiedAt: now } });
  }

  const escalationThreshold = new Date(now.getTime() - TASK_ESCALATION_HOURS * 60 * 60 * 1000);
  const toEscalate = await prisma.task.findMany({
    where: { completedAt: null, escalatedAt: null, dueAt: { lte: escalationThreshold } },
    include: { lead: { select: { refNumber: true, fullName: true } }, assignedTo: { select: { name: true } } },
  });
  if (toEscalate.length > 0) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", telegramChatId: { not: null } }, select: { telegramChatId: true } });
    for (const task of toEscalate) {
      const text = `Задача просрочена более ${TASK_ESCALATION_HOURS}ч и всё ещё не выполнена\nЗаявка ${task.lead.refNumber} (${task.lead.fullName})\nИсполнитель: ${task.assignedTo.name}`;
      await Promise.all(admins.map((a) => sendManagerMessage(a.telegramChatId!, text)));
    }
    await prisma.task.updateMany({ where: { id: { in: toEscalate.map((t) => t.id) } }, data: { escalatedAt: now } });
  }

  return { remindedCount: toRemind.length, escalatedCount: toEscalate.length };
}
