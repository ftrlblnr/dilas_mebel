import "server-only";
import { prisma } from "@/lib/prisma";
import type { SalesOrder, PaymentMethod, OrderAgreementStatus, TransferStatus, Role, Prisma } from "@prisma/client";
import { getLeadById, type LeadActor } from "@/lib/leads-server";
import { getCrmSettings } from "@/lib/crm-settings-server";
import { computeOrderTotals } from "@/lib/order-totals";

export { computeOrderTotals };

const ORDER_INCLUDE = {
  payments: {
    include: {
      submittedBy: { select: { name: true } },
      confirmedBy: { select: { name: true } },
      refunds: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
  scheduleRows: { orderBy: { dueDate: "asc" as const } },
  createdBy: { select: { name: true } },
  approvedBy: { select: { name: true } },
} satisfies Prisma.SalesOrderInclude;

export type OrderWithDetails = Prisma.SalesOrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

async function assertLeadVisible(leadId: string, actor: LeadActor): Promise<void> {
  const lead = await getLeadById(leadId, actor);
  if (!lead) throw new Error("Заявка не найдена");
}

function validateAmount(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Сумма не может быть отрицательной");
}

function validateDiscount(discountPercent: number) {
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error("Скидка должна быть от 0 до 100%");
  }
}

export async function resolveApprovalRequired(discountPercent: number, actorRole: Role): Promise<boolean> {
  if (actorRole === "ADMIN" || discountPercent === 0) return false;
  const settings = await getCrmSettings();
  return discountPercent > settings.managerDiscountLimitPercent;
}

export interface CreateOrderInput {
  amount: number;
  discountPercent?: number;
  discountReason?: string;
}

export async function createOrder(leadId: string, input: CreateOrderInput, actor: LeadActor): Promise<SalesOrder> {
  await assertLeadVisible(leadId, actor);
  const existing = await prisma.salesOrder.findUnique({ where: { leadId } });
  if (existing) throw new Error("По этой заявке уже создан заказ");
  validateAmount(input.amount);
  const discountPercent = input.discountPercent ?? 0;
  validateDiscount(discountPercent);
  const approvalRequired = await resolveApprovalRequired(discountPercent, actor.role);

  return prisma.salesOrder.create({
    data: {
      leadId,
      amount: Math.round(input.amount),
      discountPercent,
      discountReason: input.discountReason,
      approvalRequired,
      createdById: actor.id,
    },
  });
}

export interface UpdateOrderInput {
  amount?: number;
  discountPercent?: number;
  discountReason?: string | null;
}

export async function updateOrder(orderId: string, input: UpdateOrderInput, actor: LeadActor): Promise<SalesOrder> {
  const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id: orderId } });
  await assertLeadVisible(order.leadId, actor);
  if (order.agreementStatus !== "DRAFT") {
    throw new Error("Заказ уже принят или отменён — верните его в черновик, чтобы изменить сумму или скидку");
  }
  if (input.amount !== undefined) validateAmount(input.amount);
  const discountPercent = input.discountPercent ?? order.discountPercent;
  validateDiscount(discountPercent);
  const approvalRequired = await resolveApprovalRequired(discountPercent, actor.role);

  return prisma.salesOrder.update({
    where: { id: orderId },
    data: {
      ...(input.amount !== undefined ? { amount: Math.round(input.amount) } : {}),
      ...(input.discountPercent !== undefined ? { discountPercent: input.discountPercent } : {}),
      ...(input.discountReason !== undefined ? { discountReason: input.discountReason } : {}),
      approvalRequired,
      // any change to amount/discount invalidates a prior approval — it must be re-confirmed
      approvedById: null,
      approvedAt: null,
    },
  });
}

export async function approveDiscount(orderId: string, actor: LeadActor): Promise<SalesOrder> {
  if (actor.role !== "ADMIN") throw new Error("Только администратор может согласовать скидку");
  const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id: orderId } });
  await assertLeadVisible(order.leadId, actor);
  return prisma.salesOrder.update({
    where: { id: orderId },
    data: { approvedById: actor.id, approvedAt: new Date() },
  });
}

export async function setAgreementStatus(orderId: string, status: OrderAgreementStatus, actor: LeadActor): Promise<SalesOrder> {
  const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id: orderId } });
  await assertLeadVisible(order.leadId, actor);
  if (status === "ACCEPTED" && order.approvalRequired && !order.approvedAt) {
    throw new Error("Требуется согласование скидки перед принятием заказа");
  }
  return prisma.salesOrder.update({ where: { id: orderId }, data: { agreementStatus: status } });
}

export async function setTransferStatus(orderId: string, status: TransferStatus, actor: LeadActor): Promise<SalesOrder> {
  const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id: orderId } });
  await assertLeadVisible(order.leadId, actor);
  return prisma.salesOrder.update({ where: { id: orderId }, data: { transferStatus: status } });
}

export interface ScheduleRowInput {
  dueDate: Date;
  amount: number;
  note?: string;
}

export async function addScheduleRow(orderId: string, input: ScheduleRowInput, actor: LeadActor) {
  const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id: orderId } });
  await assertLeadVisible(order.leadId, actor);
  validateAmount(input.amount);
  return prisma.paymentScheduleRow.create({
    data: { orderId, dueDate: input.dueDate, amount: Math.round(input.amount), note: input.note },
  });
}

export interface SubmitPaymentInput {
  amount: number;
  method: PaymentMethod;
  externalRef?: string;
  note?: string;
  payerName?: string;
}

export async function submitPayment(orderId: string, input: SubmitPaymentInput, actor: LeadActor) {
  const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id: orderId } });
  await assertLeadVisible(order.leadId, actor);
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Сумма платежа должна быть больше нуля");

  return prisma.payment.create({
    data: {
      orderId,
      amount: Math.round(input.amount),
      method: input.method,
      externalRef: input.externalRef,
      note: input.note,
      payerName: input.payerName,
      submittedById: actor.id,
    },
  });
}

async function getPaymentWithOrder(paymentId: string) {
  return prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { order: true, refunds: true } });
}

export async function confirmPayment(paymentId: string, actor: LeadActor) {
  if (actor.role !== "ADMIN") throw new Error("Только администратор может подтвердить оплату");
  const payment = await getPaymentWithOrder(paymentId);
  await assertLeadVisible(payment.order.leadId, actor);
  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: "CONFIRMED", confirmedById: actor.id, confirmedAt: new Date(), rejectedReason: null },
  });
}

export async function rejectPayment(paymentId: string, reason: string, actor: LeadActor) {
  if (actor.role !== "ADMIN") throw new Error("Только администратор может отклонить оплату");
  const payment = await getPaymentWithOrder(paymentId);
  await assertLeadVisible(payment.order.leadId, actor);
  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: "REJECTED", confirmedById: actor.id, confirmedAt: new Date(), rejectedReason: reason },
  });
}

export interface CreateRefundInput {
  amount: number;
  reason: string;
}

export async function createRefund(paymentId: string, input: CreateRefundInput, actor: LeadActor) {
  if (actor.role !== "ADMIN") throw new Error("Только администратор может оформить возврат");
  const payment = await getPaymentWithOrder(paymentId);
  await assertLeadVisible(payment.order.leadId, actor);
  if (payment.status !== "CONFIRMED") throw new Error("Возврат возможен только по подтверждённому платежу");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Сумма возврата должна быть больше нуля");

  const alreadyRefunded = payment.refunds.reduce((s, r) => s + r.amount, 0);
  if (input.amount > payment.amount - alreadyRefunded) {
    throw new Error("Сумма возврата превышает доступный остаток платежа");
  }

  return prisma.refund.create({
    data: { paymentId, amount: Math.round(input.amount), reason: input.reason, createdById: actor.id },
  });
}

export async function getOrderForLead(leadId: string, actor: LeadActor): Promise<OrderWithDetails | null> {
  const lead = await getLeadById(leadId, actor);
  if (!lead) return null;
  return prisma.salesOrder.findUnique({ where: { leadId }, include: ORDER_INCLUDE });
}

export async function getAverageWonOrderAmount(): Promise<number | null> {
  const result = await prisma.salesOrder.aggregate({ _avg: { amount: true }, where: { lead: { stage: { type: "WIN" } } } });
  return result._avg.amount !== null ? Math.round(result._avg.amount) : null;
}
