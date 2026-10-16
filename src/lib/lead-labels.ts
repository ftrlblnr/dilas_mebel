import type { LeadSource, TaskType, LostReason } from "@prisma/client";

export const SOURCE_LABEL: Record<LeadSource, string> = {
  CALLBACK: "Заказ",
  QUICK_CALLBACK: "Обратный звонок",
  CUSTOM_ORDER: "Инд. заказ",
};

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  CALL: "Позвонить",
  MEETING: "Встреча",
  PREPARE_OFFER: "Подготовить предложение",
  SEND_OFFER: "Отправить предложение",
  GET_DECISION: "Получить решение",
  CHECK_PAYMENT: "Проверить оплату",
  RESUME_POSTPONED: "Вернуться к отложенной",
  OTHER: "Другое",
};

export const TASK_TYPE_OPTIONS: TaskType[] = [
  "CALL",
  "MEETING",
  "PREPARE_OFFER",
  "SEND_OFFER",
  "GET_DECISION",
  "CHECK_PAYMENT",
  "RESUME_POSTPONED",
  "OTHER",
];

export const LOST_REASON_LABEL: Record<LostReason, string> = {
  PRICE: "Цена",
  TIMELINE: "Срок изготовления или поставки",
  COMPETITOR: "Выбрал конкурента",
  CHANGED_MIND: "Передумал или перестал отвечать",
  OTHER: "Другое",
};

export const LOST_REASON_OPTIONS: LostReason[] = ["PRICE", "TIMELINE", "COMPETITOR", "CHANGED_MIND", "OTHER"];

export const PREFERRED_TIME_LABEL: Record<string, string> = {
  morning: "Утром",
  afternoon: "Днём",
  evening: "Вечером",
};

export const OVERDUE_HOURS = 2;
