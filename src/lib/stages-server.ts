import "server-only";
import { prisma } from "@/lib/prisma";
import type { Stage } from "@prisma/client";

export async function listActiveStages(): Promise<Stage[]> {
  return prisma.stage.findMany({ where: { active: true }, orderBy: { order: "asc" } });
}

export async function listAllStages(): Promise<Stage[]> {
  return prisma.stage.findMany({ orderBy: { order: "asc" } });
}

export async function getStageByKey(key: string): Promise<Stage | null> {
  return prisma.stage.findUnique({ where: { key } });
}
