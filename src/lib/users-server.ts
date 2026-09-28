import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: Date;
}

const SELECT_SUMMARY = { id: true, email: true, name: true, role: true, active: true, createdAt: true } as const;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function verifyCredentials(email: string, password: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.active) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function getUserActiveStatus(id: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id }, select: { active: true } });
  return user?.active ?? false;
}

export async function listUsers(): Promise<UserSummary[]> {
  return prisma.user.findMany({ select: SELECT_SUMMARY, orderBy: { createdAt: "asc" } });
}

export async function listAssignableUsers(): Promise<{ id: string; name: string }[]> {
  return prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}

function assertPasswordStrength(password: string, email: string, name: string) {
  if (password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");
  const lower = password.toLowerCase();
  if (lower === email.toLowerCase() || lower === name.toLowerCase()) {
    throw new Error("Пароль не должен совпадать с email или именем");
  }
}

export async function createManagerUser(input: { email: string; name: string; password: string }): Promise<UserSummary> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  assertPasswordStrength(input.password, email, name);
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { email, name, passwordHash, role: "MANAGER" },
    select: SELECT_SUMMARY,
  });
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  await prisma.user.update({ where: { id }, data: { active } });
}

export async function setUserRole(id: string, role: Role): Promise<void> {
  await prisma.user.update({ where: { id }, data: { role } });
}

export async function updateUserProfile(id: string, input: { name?: string; email?: string }): Promise<UserSummary> {
  const data: { name?: string; email?: string } = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.email !== undefined) data.email = input.email.trim().toLowerCase();
  return prisma.user.update({ where: { id }, data, select: SELECT_SUMMARY });
}

export async function changeOwnPassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Пользователь не найден");
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Текущий пароль указан неверно");
  assertPasswordStrength(newPassword, user.email, user.name);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
}

export async function adminResetPassword(id: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Пользователь не найден");
  assertPasswordStrength(newPassword, user.email, user.name);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
}

export async function getTelegramLinkStatus(userId: string): Promise<{ linked: boolean }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true } });
  return { linked: !!user?.telegramChatId };
}

/** Links a verified Telegram chat id to a CRM user, stealing it from any other account it was previously linked to. */
export async function linkTelegramAccount(userId: string, chatId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.updateMany({ where: { telegramChatId: chatId, NOT: { id: userId } }, data: { telegramChatId: null } }),
    prisma.user.update({ where: { id: userId }, data: { telegramChatId: chatId } }),
  ]);
}

export async function upsertAdminUser(input: { email: string; name: string; password: string }): Promise<UserSummary> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", active: true, name },
    create: { email, name, passwordHash, role: "ADMIN" },
    select: SELECT_SUMMARY,
  });
}
