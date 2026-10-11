import "server-only";
import { prisma } from "@/lib/prisma";
import type { Task, TaskType, Role } from "@prisma/client";

export interface CreateTaskInput {
  assignedToId: string;
  type: TaskType;
  dueAt: Date;
}

export async function createTask(leadId: string, input: CreateTaskInput, authorId: string): Promise<Task> {
  return prisma.task.create({
    data: { leadId, assignedToId: input.assignedToId, type: input.type, dueAt: input.dueAt, authorId },
  });
}

function canManageTask(task: Task, actorId: string, actorRole?: Role): boolean {
  return actorRole === "ADMIN" || task.authorId === actorId || task.assignedToId === actorId;
}

export async function completeTask(id: string, actorId: string, actorRole: Role | undefined, result?: string): Promise<Task> {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || !canManageTask(task, actorId, actorRole)) throw new Error("Task not found");
  return prisma.task.update({ where: { id }, data: { completedAt: new Date(), result: result ?? null } });
}

export async function reopenTask(id: string, actorId: string, actorRole: Role | undefined): Promise<Task> {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || !canManageTask(task, actorId, actorRole)) throw new Error("Task not found");
  return prisma.task.update({ where: { id }, data: { completedAt: null, result: null } });
}

export async function deleteTask(id: string, actorId: string, actorRole: Role | undefined): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || !canManageTask(task, actorId, actorRole)) throw new Error("Task not found");
  await prisma.task.delete({ where: { id } });
}

export async function listTasksForLead(leadId: string): Promise<(Task & { assignedTo: { name: string }; author: { name: string } })[]> {
  return prisma.task.findMany({
    where: { leadId },
    include: { assignedTo: { select: { name: true } }, author: { select: { name: true } } },
    orderBy: { dueAt: "asc" },
  });
}

export type MyOpenTask = Task & { lead: { id: string; refNumber: string; fullName: string } };

export async function listMyOpenTasks(userId: string, limit = 5): Promise<MyOpenTask[]> {
  return prisma.task.findMany({
    where: { assignedToId: userId, completedAt: null },
    include: { lead: { select: { id: true, refNumber: true, fullName: true } } },
    orderBy: { dueAt: "asc" },
    take: limit,
  });
}
