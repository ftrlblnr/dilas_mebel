import type { StageType } from "@prisma/client";

export const STAGE_TYPE_LABEL: Record<StageType, string> = {
  WORK: "Рабочий",
  WIN: "Успех",
  LOSE: "Отказ",
};
