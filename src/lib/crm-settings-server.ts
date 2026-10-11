import "server-only";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function getCrmSettings() {
  const existing = await prisma.crmSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.crmSettings.create({ data: { id: 1 } });
}

export async function updateCrmSettings(managerDiscountLimitPercent: number, actorRole: Role | undefined) {
  if (actorRole !== "ADMIN") throw new Error("Только администратор может менять настройки");
  if (managerDiscountLimitPercent < 0 || managerDiscountLimitPercent > 100) {
    throw new Error("Лимит скидки должен быть от 0 до 100%");
  }
  return prisma.crmSettings.upsert({
    where: { id: 1 },
    update: { managerDiscountLimitPercent },
    create: { id: 1, managerDiscountLimitPercent },
  });
}
