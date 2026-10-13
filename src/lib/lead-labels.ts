import type { LeadStatus, LeadSource, TaskType, LostReason } from "@prisma/client";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Новая сделка",
  NEEDS_ASSESSMENT: "Выяснение потребности",
  FURNITURE_SELECTION: "Подбор мебели",
  QUOTE_SENT: "Предложение отправлено",
  NEGOTIATION: "Согласование",
  AWAITING_PAYMENT: "Ожидание оплаты",
  WON: "Успешная продажа",
  LOST: "Закрыта без продажи",
};

export const STATUS_STYLE: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  NEEDS_ASSESSMENT: "bg-cyan-100 text-cyan-700",
  FURNITURE_SELECTION: "bg-violet-100 text-violet-700",
  QUOTE_SENT: "bg-indigo-100 text-indigo-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-600",
};

export const STATUS_OPTIONS: LeadStatus[] = [
  "NEW",
  "NEEDS_ASSESSMENT",
  "FURNITURE_SELECTION",
  "QUOTE_SENT",
  "NEGOTIATION",
  "AWAITING_PAYMENT",
  "WON",
  "LOST",
];

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
