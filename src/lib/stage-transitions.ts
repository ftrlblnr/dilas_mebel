import type { LeadWithDetails } from "@/lib/leads-server";
import type { OrderWithDetails } from "@/lib/orders-server";
import type { QuoteWithVersions } from "@/lib/quotes-server";
import { computeOrderTotals } from "@/lib/order-totals";

export type GuardResult = { ok: true } | { ok: false; reason: string };

export interface StageContext {
  lead: LeadWithDetails;
  order: OrderWithDetails | null;
  quote: QuoteWithVersions | null;
  actorRole: "ADMIN" | "MANAGER";
}

export interface StageTransitionRule {
  /** Stage.key to transition into on the primary action */
  toKey: string;
  /** Button label, exact prototype wording */
  primaryLabel: string;
  /** Optional secondary action — does not advance the stage */
  secondaryLabel?: string;
  /** Who may click the primary button */
  allowedRoles: ("ADMIN" | "MANAGER")[];
  /** ok, or a reason string to show next to a disabled button */
  guard: (ctx: StageContext) => GuardResult;
  /** Short instruction sentence shown in the "Следующий шаг" block */
  instructionText: (ctx: StageContext) => string;
}

/** Keyed by the CURRENT Stage.key. No entry for a stage means it's terminal (DONE/CANCELED). */
export const STAGE_TRANSITIONS: Record<string, StageTransitionRule> = {
  NEW: {
    toKey: "IN_PROGRESS",
    primaryLabel: "Назначить менеджера",
    allowedRoles: ["ADMIN"],
    guard: (ctx) =>
      ctx.lead.assignedToId ? { ok: true } : { ok: false, reason: "Назначьте ответственного менеджера" },
    instructionText: () => "Назначьте ответственного менеджера.",
  },
  IN_PROGRESS: {
    toKey: "SELECTION_QUOTE",
    primaryLabel: "Потребность выяснена →",
    allowedRoles: ["ADMIN", "MANAGER"],
    guard: () => ({ ok: true }),
    instructionText: () => "Свяжитесь с клиентом и уточните, что ему нужно.",
  },
  SELECTION_QUOTE: {
    toKey: "AGREEMENT",
    primaryLabel: "Клиент принял КП →",
    secondaryLabel: "Нужна новая версия КП",
    allowedRoles: ["ADMIN", "MANAGER"],
    guard: (ctx) =>
      ctx.quote?.versions[0]?.status === "ACCEPTED"
        ? { ok: true }
        : { ok: false, reason: "КП должно быть отправлено и принято клиентом" },
    instructionText: (ctx) =>
      ctx.quote?.versions[0]?.status === "VIEWED" || ctx.quote?.versions[0]?.status === "SENT"
        ? "Клиент ещё не принял КП. Получите решение и отметьте результат."
        : "Соберите состав заказа и отправьте КП клиенту.",
  },
  AGREEMENT: {
    toKey: "AWAITING_PAYMENT",
    primaryLabel: "Условия согласованы →",
    allowedRoles: ["ADMIN", "MANAGER"],
    guard: (ctx) => {
      if (!ctx.order) return { ok: false, reason: "Создайте заказ из принятого КП" };
      if (ctx.order.approvalRequired && !ctx.order.approvedAt) {
        return { ok: false, reason: "Скидка по заказу ждёт согласования администратора" };
      }
      return { ok: true };
    },
    instructionText: () => "Клиент согласен. Подтвердите итоговую сумму и условия оплаты.",
  },
  AWAITING_PAYMENT: {
    toKey: "DONE",
    primaryLabel: "Подтвердить оплату (админ) ✓",
    allowedRoles: ["ADMIN"],
    guard: (ctx) => {
      if (!ctx.order) return { ok: false, reason: "Нет заказа" };
      const { remaining } = computeOrderTotals(ctx.order);
      return remaining <= 0 ? { ok: true } : { ok: false, reason: "Платёж ещё не подтверждён на полную сумму" };
    },
    instructionText: (ctx) =>
      ctx.actorRole === "ADMIN"
        ? "Проверьте платёж и подтвердите поступление оплаты."
        : "Внесите платёж. Администратор подтвердит поступление.",
  },
};

export function getTransitionRule(stageKey: string): StageTransitionRule | undefined {
  return STAGE_TRANSITIONS[stageKey];
}

/** Cancelling is always available from a non-terminal stage; a completed order may only be
 * cancelled by an ADMIN (e.g. a post-fact refund), never by a MANAGER. */
export function canCancelStage(stageType: "WORK" | "WIN" | "LOSE", actorRole: "ADMIN" | "MANAGER"): boolean {
  if (stageType === "LOSE") return false;
  if (stageType === "WIN") return actorRole === "ADMIN";
  return true;
}
