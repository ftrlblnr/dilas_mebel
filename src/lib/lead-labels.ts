import type { LeadStatus, LeadSource } from "@prisma/client";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Завершена",
  CANCELED: "Отменена",
};

export const SOURCE_LABEL: Record<LeadSource, string> = {
  CALLBACK: "Заказ",
  QUICK_CALLBACK: "Обратный звонок",
  CUSTOM_ORDER: "Инд. заказ",
};

export const STATUS_OPTIONS: LeadStatus[] = ["NEW", "IN_PROGRESS", "DONE", "CANCELED"];

export const OVERDUE_HOURS = 2;
