import type { QuoteVersionStatus } from "@prisma/client";

export const QUOTE_STATUS_LABEL: Record<QuoteVersionStatus, string> = {
  DRAFT: "Черновик",
  SENT: "Отправлено",
  VIEWED: "Просмотрено",
  ACCEPTED: "Принято",
  EXPIRED: "Истекло",
  SUPERSEDED: "Заменено версией",
};

export const QUOTE_STATUS_STYLE: Record<QuoteVersionStatus, string> = {
  DRAFT: "bg-surface border border-border text-text-muted",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-cyan-100 text-cyan-700",
  ACCEPTED: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-600",
  SUPERSEDED: "bg-surface border border-border text-text-muted",
};
