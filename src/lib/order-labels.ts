import type { OrderAgreementStatus, TransferStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

export const AGREEMENT_STATUS_LABEL: Record<OrderAgreementStatus, string> = {
  DRAFT: "Черновик",
  ACCEPTED: "Принят",
  CANCELED: "Отменён",
};

export const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  NOT_TRANSFERRED: "Не передано",
  TRANSFERRED: "Передано",
  CONFIRMED_RECEIVED: "Получение подтверждено",
};

export const TRANSFER_STATUS_OPTIONS: TransferStatus[] = ["NOT_TRANSFERRED", "TRANSFERRED", "CONFIRMED_RECEIVED"];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Наличные",
  CARD: "Картой",
  BANK_TRANSFER: "Банковский перевод",
  OTHER: "Другое",
};

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING_REVIEW: "На проверке",
  CONFIRMED: "Подтверждён",
  REJECTED: "Отклонён",
};

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};
