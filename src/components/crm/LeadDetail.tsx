"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquarePlus,
  Phone,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  X,
  Check,
  ExternalLink,
  AlarmClock,
  ShoppingBag,
  Settings2,
  Search,
  Copy,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import type { LeadWithDetails, LeadItemInput } from "@/lib/leads-server";
import type { OrderWithDetails } from "@/lib/orders-server";
import type { QuoteWithVersions } from "@/lib/quotes-server";
import type { LeadSource, TaskType, PaymentMethod, LostReason, Stage } from "@prisma/client";
import type { Product } from "@/types";
import { SOURCE_LABEL, OVERDUE_HOURS, TASK_TYPE_LABEL, TASK_TYPE_OPTIONS, LOST_REASON_LABEL, LOST_REASON_OPTIONS, PREFERRED_TIME_LABEL } from "@/lib/lead-labels";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
} from "@/lib/order-labels";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_STYLE } from "@/lib/quote-labels";
import StagePill from "@/components/crm/StagePill";
import { getTransitionRule, canCancelStage, type StageContext } from "@/lib/stage-transitions";

const SOURCE_ICON: Record<LeadSource, typeof Phone> = {
  CALLBACK: ShoppingBag,
  QUICK_CALLBACK: Phone,
  CUSTOM_ORDER: Settings2,
};

interface OrderDraft {
  amount: string;
  discountPercent: string;
  discountReason: string;
}

interface PaymentDraft {
  amount: string;
  method: PaymentMethod;
  externalRef: string;
  note: string;
}

interface TaskDraft {
  type: TaskType;
  assignedToId: string;
  dueAt: string;
}

interface EditableFields {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  comment: string;
  preferredTime: string;
}

interface QuoteLineDraft {
  productId?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  lineDiscountPercent: number;
  isManual: boolean;
  description?: string;
}

function computeQuoteDraftTotal(lines: { unitPrice: number; quantity: number; lineDiscountPercent: number }[], discountPercent: number): number {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity * (1 - l.lineDiscountPercent / 100), 0);
  return Math.round(subtotal * (1 - discountPercent / 100));
}

function computeOrderTotals(order: OrderWithDetails) {
  let netReceipts = 0;
  for (const p of order.payments) {
    if (p.status !== "CONFIRMED") continue;
    netReceipts += p.amount;
    for (const r of p.refunds) netReceipts -= r.amount;
  }
  return { netReceipts, remaining: order.amount - netReceipts };
}

function parseItems(itemsJson: string): LeadItemInput[] {
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function overdueHours(createdAt: Date | string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (60 * 60 * 1000));
}

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

function nextOpenTask(lead: LeadWithDetails) {
  const openTasks = lead.tasks.filter((t) => !t.completedAt);
  if (openTasks.length === 0) return null;
  return [...openTasks].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0];
}

interface Props {
  lead: LeadWithDetails;
  order: OrderWithDetails | null;
  quote: QuoteWithVersions | null;
  allStages: Stage[];
  assignableUsers: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole?: string;
  backHref?: string;
}

export default function LeadDetail({ lead, order, quote, allStages, assignableUsers, currentUserId, currentUserRole, backHref }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<EditableFields | null>(null);
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);
  const [cancelDraft, setCancelDraft] = useState<{ reason: LostReason; note: string }>({
    reason: lead.lostReason ?? "PRICE",
    note: lead.lostReasonNote ?? "",
  });
  const [advancing, setAdvancing] = useState(false);

  const [noteDraft, setNoteDraft] = useState("");
  const [postingNote, setPostingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditText, setNoteEditText] = useState("");
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const [taskDraft, setTaskDraft] = useState<TaskDraft>({ type: "CALL", assignedToId: lead.assignedToId ?? currentUserId, dueAt: "" });
  const [postingTask, setPostingTask] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const [orderDraft, setOrderDraft] = useState<OrderDraft>({ amount: String(lead.totalPrice || ""), discountPercent: "0", discountReason: "" });
  const [savingOrder, setSavingOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({ amount: "", method: "CASH", externalRef: "", note: "" });
  const [postingPayment, setPostingPayment] = useState(false);
  const [savingPaymentId, setSavingPaymentId] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectReasonDraft, setRejectReasonDraft] = useState("");
  const [refundingPaymentId, setRefundingPaymentId] = useState<string | null>(null);
  const [refundAmountDraft, setRefundAmountDraft] = useState("");
  const [refundReasonDraft, setRefundReasonDraft] = useState("");

  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false);
  const [quoteLines, setQuoteLines] = useState<QuoteLineDraft[]>([]);
  const [quoteDiscountPercent, setQuoteDiscountPercent] = useState("0");
  const [quoteDiscountReason, setQuoteDiscountReason] = useState("");
  const [quoteValidUntil, setQuoteValidUntil] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteActionId, setQuoteActionId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [orderPreviewOpen, setOrderPreviewOpen] = useState(false);

  const items = parseItems(lead.itemsJson);
  const isOverdue = lead.stage.key === "NEW" && overdueHours(lead.createdAt) >= OVERDUE_HOURS;
  const SourceIcon = SOURCE_ICON[lead.source];
  const isAdmin = currentUserRole === "ADMIN";
  const actorRole: "ADMIN" | "MANAGER" = isAdmin ? "ADMIN" : "MANAGER";
  const stageCtx: StageContext = { lead, order, quote, actorRole };
  const rule = getTransitionRule(lead.stage.key);
  const guard = rule?.guard(stageCtx);
  const roleOk = rule ? rule.allowedRoles.includes(actorRole) : false;
  const nextTask = nextOpenTask(lead);
  const canCancel = canCancelStage(lead.stage.type, actorRole);

  async function handleLeadUpdate(data: { assignedToId?: string | null; archived?: boolean }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.message ?? "");
      showToast("Сохранено");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось сохранить", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvance() {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Этап обновлён");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось перейти к следующему этапу", "error");
    } finally {
      setAdvancing(false);
    }
  }

  function handleOpenCancel() {
    setCancelDraft({ reason: lead.lostReason ?? "PRICE", note: lead.lostReasonNote ?? "" });
    setCancelPromptOpen(true);
  }

  async function handleConfirmCancel() {
    setCancelPromptOpen(false);
    setAdvancing(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", cancelReason: cancelDraft.reason, cancelNote: cancelDraft.note || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Заказ отменён");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось отменить заказ", "error");
    } finally {
      setAdvancing(false);
    }
  }

  function startEdit() {
    setEditing(true);
    setEditDraft({
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email ?? "",
      city: lead.city ?? "",
      comment: lead.comment ?? "",
      preferredTime: lead.preferredTime ?? "",
    });
  }

  async function handleSaveEdit() {
    if (!editDraft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editDraft.fullName,
          phone: editDraft.phone,
          email: editDraft.email || null,
          city: editDraft.city || null,
          comment: editDraft.comment || null,
          preferredTime: editDraft.preferredTime || null,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Заявка обновлена");
      setEditing(false);
      setEditDraft(null);
      router.refresh();
    } catch {
      showToast("Не удалось сохранить изменения", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    const text = noteDraft.trim();
    if (!text) return;
    setPostingNote(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      setNoteDraft("");
      showToast("Заметка добавлена");
      router.refresh();
    } catch {
      showToast("Не удалось добавить заметку", "error");
    } finally {
      setPostingNote(false);
    }
  }

  function startEditNote(noteId: string, text: string) {
    setEditingNoteId(noteId);
    setNoteEditText(text);
  }

  async function handleSaveNote(noteId: string) {
    const text = noteEditText.trim();
    if (!text) return;
    setSavingNoteId(noteId);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      showToast("Заметка обновлена");
      setEditingNoteId(null);
      router.refresh();
    } catch {
      showToast("Не удалось сохранить заметку", "error");
    } finally {
      setSavingNoteId(null);
    }
  }

  async function handleDeleteNote(noteId: string) {
    setSavingNoteId(noteId);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Заметка удалена");
      router.refresh();
    } catch {
      showToast("Не удалось удалить заметку", "error");
    } finally {
      setSavingNoteId(null);
    }
  }

  async function handleAddTask() {
    if (!taskDraft.dueAt) return;
    setPostingTask(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskDraft, dueAt: new Date(taskDraft.dueAt).toISOString() }),
      });
      if (!res.ok) throw new Error();
      setTaskDraft({ type: "CALL", assignedToId: lead.assignedToId ?? currentUserId, dueAt: "" });
      showToast("Задача создана");
      router.refresh();
    } catch {
      showToast("Не удалось создать задачу", "error");
    } finally {
      setPostingTask(false);
    }
  }

  async function handleToggleTask(taskId: string, completed: boolean) {
    setSavingTaskId(taskId);
    try {
      const res = await fetch(`/api/crm/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error();
      if (completed && lead.stage.type === "WORK") {
        const otherOpenTasks = lead.tasks.filter((t) => !t.completedAt && t.id !== taskId);
        if (otherOpenTasks.length === 0) {
          showToast("Задача выполнена — не забудьте создать следующий шаг", "success");
        }
      }
      router.refresh();
    } catch {
      showToast("Не удалось обновить задачу", "error");
    } finally {
      setSavingTaskId(null);
    }
  }

  async function handleCreateOrder() {
    const amount = Number(orderDraft.amount);
    if (!Number.isFinite(amount) || amount < 0) return;
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          discountPercent: Number(orderDraft.discountPercent) || 0,
          discountReason: orderDraft.discountReason || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Заказ создан");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось создать заказ", "error");
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleOrderPatch(patch: Record<string, unknown>) {
    if (!order) return;
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/crm/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Заказ обновлён");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось обновить заказ", "error");
    } finally {
      setSavingOrder(false);
    }
  }

  function startEditOrder() {
    if (!order) return;
    setOrderDraft({ amount: String(order.amount), discountPercent: String(order.discountPercent), discountReason: order.discountReason ?? "" });
    setEditingOrder(true);
  }

  async function handleSaveOrderEdit() {
    await handleOrderPatch({
      amount: Number(orderDraft.amount),
      discountPercent: Number(orderDraft.discountPercent) || 0,
      discountReason: orderDraft.discountReason || null,
    });
    setEditingOrder(false);
  }

  async function handleApproveDiscount() {
    if (!order) return;
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/crm/orders/${order.id}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Скидка согласована");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось согласовать скидку", "error");
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleSubmitPayment() {
    if (!order) return;
    const amount = Number(paymentDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setPostingPayment(true);
    try {
      const res = await fetch(`/api/crm/orders/${order.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: paymentDraft.method,
          externalRef: paymentDraft.externalRef || undefined,
          note: paymentDraft.note || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      setPaymentDraft({ amount: "", method: "CASH", externalRef: "", note: "" });
      showToast("Платёж отправлен на проверку");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось отправить платёж", "error");
    } finally {
      setPostingPayment(false);
    }
  }

  async function handlePaymentAction(paymentId: string, action: "confirm" | "reject", reason?: string) {
    setSavingPaymentId(paymentId);
    try {
      const res = await fetch(`/api/crm/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast(action === "confirm" ? "Оплата подтверждена" : "Оплата отклонена");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось обновить платёж", "error");
    } finally {
      setSavingPaymentId(null);
    }
  }

  function openRejectForm(paymentId: string) {
    setRejectingPaymentId(paymentId);
    setRejectReasonDraft("");
  }

  async function confirmReject(paymentId: string) {
    await handlePaymentAction(paymentId, "reject", rejectReasonDraft || undefined);
    setRejectingPaymentId(null);
    setRejectReasonDraft("");
  }

  function openRefundForm(paymentId: string, maxAmount: number) {
    setRefundingPaymentId(paymentId);
    setRefundAmountDraft(String(maxAmount));
    setRefundReasonDraft("");
  }

  async function confirmRefund(paymentId: string) {
    const amount = Number(refundAmountDraft);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!refundReasonDraft.trim()) return;
    setSavingPaymentId(paymentId);
    try {
      const res = await fetch(`/api/crm/payments/${paymentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: refundReasonDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Возврат оформлен");
      setRefundingPaymentId(null);
      setRefundAmountDraft("");
      setRefundReasonDraft("");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось оформить возврат", "error");
    } finally {
      setSavingPaymentId(null);
    }
  }

  const latestQuoteVersion = quote?.versions[0] ?? null;
  const olderQuoteVersions = quote?.versions.slice(1) ?? [];
  const quoteDraftTotal = computeQuoteDraftTotal(quoteLines, Number(quoteDiscountPercent) || 0);

  async function loadProducts() {
    if (products) return;
    try {
      const res = await fetch("/api/products");
      if (res.ok) setProducts(await res.json());
    } catch {
      // silent — picker just stays empty, manual line entry remains available
    }
  }

  function openQuoteBuilder(prefill?: typeof latestQuoteVersion) {
    if (prefill) {
      setQuoteLines(
        prefill.items.map((i) => ({
          productId: i.productId ?? undefined,
          productName: i.productName,
          productImage: i.productImage ?? undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineDiscountPercent: i.lineDiscountPercent,
          isManual: i.isManual,
          description: i.description ?? undefined,
        }))
      );
      setQuoteDiscountPercent(String(prefill.discountPercent));
      setQuoteDiscountReason(prefill.discountReason ?? "");
    } else {
      // Prefill from the lead's own priced catalog items (CALLBACK/QUICK_CALLBACK) so the
      // manager doesn't have to re-pick what's already in the lead; CUSTOM_ORDER rows have
      // no catalog productId/price and are naturally excluded (UX-12).
      const priced = items.filter((i) => i.productId && typeof i.price === "number");
      setQuoteLines(
        priced.map((i) => ({
          productId: i.productId,
          productName: i.productName ?? "",
          quantity: i.quantity ?? 1,
          unitPrice: i.price ?? 0,
          lineDiscountPercent: 0,
          isManual: false,
        }))
      );
      setQuoteDiscountPercent("0");
      setQuoteDiscountReason("");
    }
    setQuoteValidUntil("");
    setQuoteBuilderOpen(true);
    loadProducts();
  }

  function addProductLine(product: Product) {
    setQuoteLines((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        quantity: 1,
        unitPrice: product.salePrice ?? product.price,
        lineDiscountPercent: 0,
        isManual: false,
      },
    ]);
  }

  function addManualLine() {
    setQuoteLines((prev) => [...prev, { productName: "", quantity: 1, unitPrice: 0, lineDiscountPercent: 0, isManual: true }]);
  }

  function updateQuoteLine(index: number, patch: Partial<QuoteLineDraft>) {
    setQuoteLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeQuoteLine(index: number) {
    setQuoteLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveQuoteVersion() {
    if (quoteLines.length === 0) return;
    setSavingQuote(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/quote/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: quoteLines,
          discountPercent: Number(quoteDiscountPercent) || 0,
          discountReason: quoteDiscountReason || undefined,
          validUntil: quoteValidUntil ? new Date(quoteValidUntil).toISOString() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Предложение создано");
      setQuoteBuilderOpen(false);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось создать предложение", "error");
    } finally {
      setSavingQuote(false);
    }
  }

  async function handleSendQuote(versionId: string) {
    setQuoteActionId(versionId);
    try {
      const res = await fetch(`/api/crm/quote-versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Отмечено как отправленное — скопируйте ссылку и отправьте клиенту");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось отправить предложение", "error");
    } finally {
      setQuoteActionId(null);
    }
  }

  async function handleApproveQuoteDiscount(versionId: string) {
    setQuoteActionId(versionId);
    try {
      const res = await fetch(`/api/crm/quote-versions/${versionId}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Скидка согласована");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось согласовать скидку", "error");
    } finally {
      setQuoteActionId(null);
    }
  }

  function openOrderPreview() {
    setOrderPreviewOpen(true);
  }

  async function confirmCreateOrderFromQuote() {
    if (!latestQuoteVersion) return;
    const total = computeQuoteDraftTotal(latestQuoteVersion.items, latestQuoteVersion.discountPercent);
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          discountPercent: latestQuoteVersion.discountPercent,
          discountReason: latestQuoteVersion.discountReason || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Заказ создан из предложения");
      setOrderPreviewOpen(false);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось создать заказ", "error");
    } finally {
      setSavingOrder(false);
    }
  }

  function handleCopyLink(token: string) {
    const url = `${window.location.origin}/q/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1500);
    });
  }

  const filteredProducts = products?.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 20) ?? [];

  return (
    <div>
      <Link href={backHref ?? "/crm"} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary mb-4">
        <ArrowLeft size={14} /> Назад к заявкам
      </Link>

      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-display font-bold text-lg text-primary">{lead.refNumber}</span>
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1", "bg-surface border border-border text-text-muted")}>
              <SourceIcon size={11} /> {SOURCE_LABEL[lead.source]}
            </span>
            <StagePill stage={lead.stage} />
            {lead.archivedAt && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-surface border border-border text-text-muted">В архиве</span>
            )}
            {isOverdue && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                <AlarmClock size={13} /> {overdueHours(lead.createdAt)} ч без ответа
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                  <Check size={13} /> Сохранить
                </button>
                <button onClick={() => { setEditing(false); setEditDraft(null); }} className="flex items-center gap-1 text-xs text-text-muted hover:text-primary">
                  <X size={13} /> Отмена
                </button>
              </>
            ) : (
              <button onClick={startEdit} className="flex items-center gap-1 text-xs text-text-muted hover:text-primary">
                <Pencil size={13} /> Редактировать
              </button>
            )}
            <button
              onClick={() => handleLeadUpdate({ archived: !lead.archivedAt })}
              disabled={saving}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-primary disabled:opacity-50"
            >
              {lead.archivedAt ? <><ArchiveRestore size={13} /> Вернуть из архива</> : <><Archive size={13} /> Архивировать</>}
            </button>
          </div>
        </div>

        <p className="font-semibold text-text text-lg mb-1">{lead.fullName}</p>
        <p className="text-xs text-text-muted mb-4">{formatDate(lead.createdAt)}</p>

        {editing && editDraft ? (
          <div className="grid sm:grid-cols-2 gap-3 text-sm bg-surface/40 border border-border rounded-lg p-3">
            <input value={editDraft.fullName} onChange={(e) => setEditDraft({ ...editDraft, fullName: e.target.value })} placeholder="Имя" className="input-field text-sm" />
            <input value={editDraft.phone} onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })} placeholder="Телефон" className="input-field text-sm" />
            <input value={editDraft.email} onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })} placeholder="Email" className="input-field text-sm" />
            <input value={editDraft.city} onChange={(e) => setEditDraft({ ...editDraft, city: e.target.value })} placeholder="Город" className="input-field text-sm" />
            <input value={editDraft.preferredTime} onChange={(e) => setEditDraft({ ...editDraft, preferredTime: e.target.value })} placeholder="Удобное время" className="input-field text-sm" />
            <input value={editDraft.comment} onChange={(e) => setEditDraft({ ...editDraft, comment: e.target.value })} placeholder="Комментарий" className="input-field text-sm sm:col-span-2" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="relative">
                <span className="text-text-muted">Телефон: </span>
                <button type="button" onClick={() => setPhoneMenuOpen((v) => !v)} className="text-primary hover:underline font-medium">
                  +7{lead.phone}
                </button>
                {phoneMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPhoneMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-border overflow-hidden min-w-[180px]">
                      <a href={`tel:+7${digitsOnly(lead.phone)}`} onClick={() => setPhoneMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface/60">
                        <Phone size={14} /> Позвонить
                      </a>
                      <a
                        href={`https://wa.me/7${digitsOnly(lead.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setPhoneMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-surface/60"
                      >
                        <MessageSquarePlus size={14} /> WhatsApp
                      </a>
                    </div>
                  </>
                )}
              </p>
              {lead.email && <p><span className="text-text-muted">Email: </span>{lead.email}</p>}
              {lead.city && <p><span className="text-text-muted">Город: </span>{lead.city}</p>}
              {lead.preferredTime && <p><span className="text-text-muted">Время: </span>{PREFERRED_TIME_LABEL[lead.preferredTime] ?? lead.preferredTime}</p>}
              {lead.comment && <p><span className="text-text-muted">Комментарий: </span>{lead.comment}</p>}
              <p>
                <span className="text-text-muted">Клиент: </span>
                <Link href={`/crm/customers/${lead.customer.id}`} className="text-primary hover:underline font-medium">
                  {lead.customer.fullName}
                </Link>
              </p>
            </div>

            {items.length > 0 && (
              <div>
                <p className="text-text-muted mb-1.5 flex items-center gap-1.5">
                  Состав заказа:
                  {lead.source === "CUSTOM_ORDER" && items[0]?.productId && (
                    <Link href={`/products/${items[0].productId}`} target="_blank" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
                      {items[0].productName} <ExternalLink size={12} />
                    </Link>
                  )}
                </p>
                {lead.source === "CUSTOM_ORDER" ? (
                  <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                    <thead className="bg-surface">
                      <tr>
                        <th className="text-left px-2 py-1.5 font-semibold text-text-muted">Параметр</th>
                        <th className="text-left px-2 py-1.5 font-semibold text-text-muted">Значение</th>
                        <th className="text-right px-2 py-1.5 font-semibold text-text-muted">Доплата</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5 text-text-muted">{it.criterionName}</td>
                          <td className="px-2 py-1.5 text-text font-medium">{it.variantLabel}</td>
                          <td className="px-2 py-1.5 text-right text-text">{it.price ? formatPrice(it.price) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                    <thead className="bg-surface">
                      <tr>
                        <th className="text-left px-2 py-1.5 font-semibold text-text-muted">Товар</th>
                        <th className="text-center px-2 py-1.5 font-semibold text-text-muted">Кол-во</th>
                        <th className="text-right px-2 py-1.5 font-semibold text-text-muted">Цена</th>
                        <th className="text-right px-2 py-1.5 font-semibold text-text-muted">Сумма</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5 text-text font-medium">
                            {it.productId ? (
                              <Link href={`/products/${it.productId}`} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
                                {it.productName} <ExternalLink size={12} />
                              </Link>
                            ) : (
                              it.productName
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-center text-text-muted">{it.quantity}</td>
                          <td className="px-2 py-1.5 text-right text-text-muted">{it.price ? formatPrice(it.price) : "—"}</td>
                          <td className="px-2 py-1.5 text-right text-text font-medium">{it.price && it.quantity ? formatPrice(it.price * it.quantity) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card p-5 mb-4">
        {lead.stage.type !== "LOSE" && (
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            {allStages.filter((s) => s.type !== "LOSE").map((s) => {
              const done = s.order < lead.stage.order;
              const isCurrent = s.id === lead.stageId;
              return (
                <div key={s.id} className="flex-1 min-w-[90px] flex flex-col gap-1">
                  <div className={cn("h-1.5 rounded-full", done || isCurrent ? "bg-primary" : "bg-border")} />
                  <span className={cn("text-[11px] whitespace-nowrap truncate", isCurrent ? "font-bold text-text" : "text-text-muted")}>{s.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {rule ? (
          <div className="bg-surface/60 border border-border rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-text mb-1">Следующий шаг</p>
            <p className="text-sm text-text-muted mb-3">{rule.instructionText(stageCtx)}</p>
            {nextTask && (
              <p className="text-xs text-text-muted mb-3">
                Задача: {TASK_TYPE_LABEL[nextTask.type]} — {nextTask.assignedTo.name}, до {formatDate(nextTask.dueAt)}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleAdvance}
                disabled={advancing || !guard?.ok || !roleOk}
                title={!roleOk ? "Доступно только администратору" : !guard?.ok ? guard?.reason : undefined}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                {rule.primaryLabel}
              </button>
              {rule.secondaryLabel && latestQuoteVersion && (
                <button onClick={() => openQuoteBuilder(latestQuoteVersion)} className="text-xs text-text-muted hover:text-primary">
                  {rule.secondaryLabel}
                </button>
              )}
              {!roleOk ? (
                <span className="text-xs text-amber-700">Доступно только администратору</span>
              ) : guard && !guard.ok ? (
                <span className="text-xs text-amber-700">{guard.reason}</span>
              ) : null}
            </div>
          </div>
        ) : lead.stage.type === "WIN" ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm text-green-800 font-medium">
            Заказ выполнен — оплата подтверждена.
          </div>
        ) : (
          <div className="bg-surface/60 border border-border rounded-lg p-4 mb-4 text-sm text-text-muted">
            Заказ отменён{lead.lostReason ? `: ${LOST_REASON_LABEL[lead.lostReason]}` : ""}{lead.lostReasonNote ? ` — ${lead.lostReasonNote}` : ""}
          </div>
        )}

        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Ответственный:</span>
            {isAdmin ? (
              <select
                value={lead.assignedToId ?? ""}
                disabled={saving}
                onChange={(e) => handleLeadUpdate({ assignedToId: e.target.value || null })}
                className="input-field text-sm w-auto py-1.5"
              >
                <option value="">Не назначено</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-text">{lead.assignedTo ? lead.assignedTo.name : "не назначено"}</span>
            )}
          </div>
          {canCancel && (
            <button onClick={handleOpenCancel} className="text-xs text-text-muted hover:text-red-600">
              Отменить заказ
            </button>
          )}
        </div>

        {cancelPromptOpen && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">Причина отказа:</span>
            <select
              value={cancelDraft.reason}
              onChange={(e) => setCancelDraft({ ...cancelDraft, reason: e.target.value as LostReason })}
              className="input-field text-sm w-auto py-1.5"
            >
              {LOST_REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>{LOST_REASON_LABEL[r]}</option>
              ))}
            </select>
            <input
              value={cancelDraft.note}
              onChange={(e) => setCancelDraft({ ...cancelDraft, note: e.target.value })}
              placeholder="Комментарий (необязательно)"
              className="input-field text-sm flex-1 min-w-[160px]"
            />
            <button onClick={handleConfirmCancel} disabled={advancing} className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50">
              Подтвердить
            </button>
            <button onClick={() => setCancelPromptOpen(false)} className="text-xs text-text-muted hover:text-primary">
              Отмена
            </button>
          </div>
        )}
      </div>

      <div className="card p-5 mb-4">
        <p className="text-xs text-text-muted mb-2 font-semibold">Задачи</p>
        <div className="space-y-2 mb-3">
          {lead.tasks.length === 0 && <p className="text-xs text-text-muted">Нет задач</p>}
          {lead.tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-2 text-sm bg-white border border-border rounded-lg px-3 py-2">
              <input
                type="checkbox"
                checked={!!task.completedAt}
                disabled={savingTaskId === task.id}
                onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className={cn("text-text", task.completedAt && "line-through text-text-muted")}>
                  {TASK_TYPE_LABEL[task.type]} — {task.assignedTo.name}
                </p>
                <p className="text-xs text-text-muted">
                  Срок: {formatDate(task.dueAt)}
                  {task.result && <> · {task.result}</>}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={taskDraft.type} onChange={(e) => setTaskDraft({ ...taskDraft, type: e.target.value as TaskType })} className="input-field text-sm w-auto py-1.5">
            {TASK_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{TASK_TYPE_LABEL[t]}</option>
            ))}
          </select>
          <select value={taskDraft.assignedToId} onChange={(e) => setTaskDraft({ ...taskDraft, assignedToId: e.target.value })} className="input-field text-sm w-auto py-1.5">
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input type="datetime-local" value={taskDraft.dueAt} onChange={(e) => setTaskDraft({ ...taskDraft, dueAt: e.target.value })} className="input-field text-sm w-auto py-1.5" />
          <button onClick={handleAddTask} disabled={postingTask || !taskDraft.dueAt} className="btn-primary px-3 disabled:opacity-50 text-sm">
            Добавить задачу
          </button>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <p className="text-xs text-text-muted mb-2 font-semibold">Предложение</p>

        {!latestQuoteVersion && !quoteBuilderOpen && (
          <button onClick={() => openQuoteBuilder()} className="btn-primary px-3 py-2 text-sm">
            Создать предложение
          </button>
        )}

        {quoteBuilderOpen && (
          <div className="bg-white border border-border rounded-lg p-3 space-y-3 text-sm">
            <div>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Поиск товара..."
                  className="input-field pl-9 text-sm"
                />
              </div>
              {productSearch && (
                <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border mb-2">
                  {filteredProducts.length === 0 && <p className="text-xs text-text-muted p-2">Ничего не найдено</p>}
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { addProductLine(p); setProductSearch(""); }}
                      className="flex items-center gap-2 w-full text-left px-2 py-1.5 hover:bg-surface/60"
                    >
                      {p.images[0] && <img src={p.images[0]} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" />}
                      <span className="flex-1 truncate text-text">{p.name}</span>
                      <span className="text-text-muted text-xs whitespace-nowrap">{formatPrice(p.salePrice ?? p.price)}</span>
                    </button>
                  ))}
                </div>
              )}
              <button type="button" onClick={addManualLine} className="text-xs text-primary hover:underline">
                + Добавить вручную
              </button>
            </div>

            <div className="space-y-2">
              {quoteLines.length === 0 && <p className="text-xs text-text-muted">Добавьте товар из каталога или вручную</p>}
              {quoteLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 border border-border rounded-lg px-2 py-1.5 flex-wrap">
                  {line.productImage && <img src={line.productImage} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" />}
                  {line.isManual ? (
                    <input
                      value={line.productName}
                      onChange={(e) => updateQuoteLine(idx, { productName: e.target.value })}
                      placeholder="Название"
                      className="input-field text-sm flex-1 min-w-[100px]"
                    />
                  ) : (
                    <span className="flex-1 min-w-[100px] truncate text-text">{line.productName}</span>
                  )}
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateQuoteLine(idx, { quantity: Number(e.target.value) || 1 })}
                    className="input-field text-sm w-16"
                    title="Количество"
                  />
                  <input
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) => updateQuoteLine(idx, { unitPrice: Number(e.target.value) || 0 })}
                    className="input-field text-sm w-28"
                    placeholder="Цена"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={line.lineDiscountPercent}
                    onChange={(e) => updateQuoteLine(idx, { lineDiscountPercent: Number(e.target.value) || 0 })}
                    className="input-field text-sm w-16"
                    title="Скидка на строку, %"
                  />
                  <span className="text-xs text-text-muted w-24 text-right whitespace-nowrap">
                    {formatPrice(line.unitPrice * line.quantity * (1 - line.lineDiscountPercent / 100))}
                  </span>
                  <button onClick={() => removeQuoteLine(idx)} className="text-text-muted hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="number"
                min={0}
                max={100}
                value={quoteDiscountPercent}
                onChange={(e) => setQuoteDiscountPercent(e.target.value)}
                placeholder="Общая скидка %"
                className="input-field text-sm w-32"
              />
              <input
                value={quoteDiscountReason}
                onChange={(e) => setQuoteDiscountReason(e.target.value)}
                placeholder="Причина скидки"
                className="input-field text-sm flex-1 min-w-[140px]"
              />
              <input type="date" value={quoteValidUntil} onChange={(e) => setQuoteValidUntil(e.target.value)} className="input-field text-sm w-auto" title="Действительно до" />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-semibold text-text">Итого: {formatPrice(quoteDraftTotal)}</span>
              <div className="flex gap-3 items-center">
                <button onClick={() => setQuoteBuilderOpen(false)} className="text-xs text-text-muted hover:text-primary">
                  Отмена
                </button>
                <button onClick={handleSaveQuoteVersion} disabled={savingQuote || quoteLines.length === 0} className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50">
                  {quote ? "Сохранить как новую версию" : "Создать предложение"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!quoteBuilderOpen && latestQuoteVersion && (
          <div className="bg-white border border-border rounded-lg p-3 space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", QUOTE_STATUS_STYLE[latestQuoteVersion.status])}>
                {QUOTE_STATUS_LABEL[latestQuoteVersion.status]}
              </span>
              <span className="text-xs text-text-muted">версия {latestQuoteVersion.versionNumber}</span>
              <span className="font-semibold text-text">{formatPrice(computeQuoteDraftTotal(latestQuoteVersion.items, latestQuoteVersion.discountPercent))}</span>
              {latestQuoteVersion.discountPercent > 0 && (
                <span className="text-xs text-text-muted">
                  скидка {latestQuoteVersion.discountPercent}%{latestQuoteVersion.discountReason ? ` — ${latestQuoteVersion.discountReason}` : ""}
                </span>
              )}
              {latestQuoteVersion.validUntil && <span className="text-xs text-text-muted">до {formatDate(latestQuoteVersion.validUntil)}</span>}
            </div>

            {latestQuoteVersion.approvalRequired &&
              (latestQuoteVersion.approvedAt ? (
                <span className="text-xs text-green-700">Скидка согласована ({latestQuoteVersion.approvedBy?.name})</span>
              ) : (
                <span className="flex items-center gap-2 text-xs text-amber-700">
                  Требуется согласование
                  {isAdmin && (
                    <button onClick={() => handleApproveQuoteDiscount(latestQuoteVersion.id)} className="text-primary hover:underline font-semibold">
                      Согласовать
                    </button>
                  )}
                </span>
              ))}

            <div className="space-y-1">
              {latestQuoteVersion.items.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-xs text-text-muted gap-2">
                  <span className="truncate">{i.productName} × {i.quantity}</span>
                  <span className="whitespace-nowrap">{formatPrice(i.unitPrice * i.quantity * (1 - i.lineDiscountPercent / 100))}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {latestQuoteVersion.status === "DRAFT" && (
                <>
                  <button onClick={() => openQuoteBuilder(latestQuoteVersion)} className="text-xs text-text-muted hover:text-primary">
                    Редактировать
                  </button>
                  <button onClick={() => handleSendQuote(latestQuoteVersion.id)} disabled={quoteActionId === latestQuoteVersion.id} className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50">
                    Отметить как отправленное
                  </button>
                </>
              )}
              {latestQuoteVersion.status !== "DRAFT" && (
                <>
                  <button type="button" onClick={() => handleCopyLink(latestQuoteVersion.publicToken)} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    {copiedToken === latestQuoteVersion.publicToken ? <Check size={13} /> : <Copy size={13} />}
                    {copiedToken === latestQuoteVersion.publicToken ? "Скопировано" : "Скопировать ссылку для клиента"}
                  </button>
                  <button onClick={() => openQuoteBuilder(latestQuoteVersion)} className="text-xs text-text-muted hover:text-primary">
                    Создать новую версию
                  </button>
                </>
              )}
              {latestQuoteVersion.status === "ACCEPTED" && !order && (
                <button onClick={openOrderPreview} className="text-xs text-green-700 font-semibold hover:underline">
                  Создать заказ из предложения
                </button>
              )}
            </div>
          </div>
        )}

        {olderQuoteVersions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-text-muted mb-1.5">История версий</p>
            <div className="space-y-1">
              {olderQuoteVersions.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs text-text-muted border border-border rounded-lg px-2 py-1 gap-2">
                  <span>Версия {v.versionNumber} · {formatDate(v.createdAt)}</span>
                  <span className={cn("px-2 py-0.5 rounded-full font-semibold whitespace-nowrap", QUOTE_STATUS_STYLE[v.status])}>{QUOTE_STATUS_LABEL[v.status]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 mb-4">
        <p className="text-xs text-text-muted mb-2 font-semibold">Заказ и оплаты</p>
        {!order ? (
          <div className="bg-white border border-border rounded-lg p-3 flex flex-wrap gap-2">
            <input
              type="number"
              placeholder="Сумма заказа"
              value={orderDraft.amount}
              onChange={(e) => setOrderDraft({ ...orderDraft, amount: e.target.value })}
              className="input-field text-sm w-32"
            />
            <input
              type="number"
              placeholder="Скидка %"
              value={orderDraft.discountPercent}
              onChange={(e) => setOrderDraft({ ...orderDraft, discountPercent: e.target.value })}
              className="input-field text-sm w-24"
            />
            <input
              placeholder="Причина скидки"
              value={orderDraft.discountReason}
              onChange={(e) => setOrderDraft({ ...orderDraft, discountReason: e.target.value })}
              className="input-field text-sm flex-1 min-w-[140px]"
            />
            <button onClick={handleCreateOrder} disabled={savingOrder || !orderDraft.amount} className="btn-primary px-3 text-sm disabled:opacity-50">
              Создать заказ
            </button>
          </div>
        ) : (
          (() => {
            const { netReceipts, remaining } = computeOrderTotals(order);
            return (
              <div className="bg-white border border-border rounded-lg p-3 space-y-3 text-sm">
                {editingOrder ? (
                  <div className="flex flex-wrap gap-2">
                    <input type="number" value={orderDraft.amount} onChange={(e) => setOrderDraft({ ...orderDraft, amount: e.target.value })} className="input-field text-sm w-32" />
                    <input type="number" value={orderDraft.discountPercent} onChange={(e) => setOrderDraft({ ...orderDraft, discountPercent: e.target.value })} className="input-field text-sm w-24" />
                    <input
                      placeholder="Причина скидки"
                      value={orderDraft.discountReason}
                      onChange={(e) => setOrderDraft({ ...orderDraft, discountReason: e.target.value })}
                      className="input-field text-sm flex-1 min-w-[140px]"
                    />
                    <button onClick={handleSaveOrderEdit} disabled={savingOrder} className="text-primary disabled:opacity-50">
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEditingOrder(false)} className="text-text-muted">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-text">{formatPrice(order.amount)}</span>
                    {order.discountPercent > 0 && (
                      <span className="text-xs text-text-muted">
                        скидка {order.discountPercent}%{order.discountReason ? ` — ${order.discountReason}` : ""}
                      </span>
                    )}
                    {lead.stage.key === "AGREEMENT" && (
                      <button onClick={startEditOrder} className="text-text-muted hover:text-primary">
                        <Pencil size={13} />
                      </button>
                    )}
                    {order.approvalRequired &&
                      (order.approvedAt ? (
                        <span className="text-xs text-green-700">Скидка согласована ({order.approvedBy?.name})</span>
                      ) : (
                        <span className="flex items-center gap-2 text-xs text-amber-700">
                          Требуется согласование
                          {isAdmin && (
                            <button onClick={handleApproveDiscount} className="text-primary hover:underline font-semibold">
                              Согласовать
                            </button>
                          )}
                        </span>
                      ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-xs">
                  <span>Подтверждено: <b className="text-text">{formatPrice(netReceipts)}</b></span>
                  <span className={remaining > 0 ? "text-amber-700" : remaining < 0 ? "text-red-600 font-semibold" : "text-green-700"}>
                    {remaining > 0 ? `Остаток: ${formatPrice(remaining)}` : remaining < 0 ? `Переплата: ${formatPrice(-remaining)}` : "Оплачено полностью"}
                  </span>
                </div>

                <div className="space-y-2">
                  {order.payments.length === 0 && <p className="text-xs text-text-muted">Платежей пока нет</p>}
                  {order.payments.map((p) => (
                    <div key={p.id} className="border border-border rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-text">{formatPrice(p.amount)} · {PAYMENT_METHOD_LABEL[p.method]}</span>
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", PAYMENT_STATUS_STYLE[p.status])}>{PAYMENT_STATUS_LABEL[p.status]}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        Заявил: {p.submittedBy.name}
                        {p.confirmedBy && <> · {p.status === "REJECTED" ? "Отклонил" : "Подтвердил"}: {p.confirmedBy.name}</>}
                        {p.externalRef && <> · №{p.externalRef}</>}
                        {p.note && <> · {p.note}</>}
                        {p.rejectedReason && <> · Причина: {p.rejectedReason}</>}
                      </p>
                      {p.refunds.length > 0 && (
                        <p className="text-xs text-red-600 mt-1">Возвраты: {p.refunds.map((r) => `${formatPrice(r.amount)} (${r.reason})`).join(", ")}</p>
                      )}
                      {isAdmin && p.status === "PENDING_REVIEW" && rejectingPaymentId !== p.id && (
                        <div className="flex gap-3 mt-1.5">
                          <button onClick={() => handlePaymentAction(p.id, "confirm")} disabled={savingPaymentId === p.id} className="text-xs text-primary font-semibold hover:underline disabled:opacity-50">
                            Подтвердить
                          </button>
                          <button onClick={() => openRejectForm(p.id)} disabled={savingPaymentId === p.id} className="text-xs text-red-600 hover:underline disabled:opacity-50">
                            Отклонить
                          </button>
                        </div>
                      )}
                      {isAdmin && p.status === "PENDING_REVIEW" && rejectingPaymentId === p.id && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <input
                            value={rejectReasonDraft}
                            onChange={(e) => setRejectReasonDraft(e.target.value)}
                            placeholder="Причина отклонения (необязательно)"
                            className="input-field text-xs flex-1 min-w-[160px] py-1"
                            autoFocus
                          />
                          <button onClick={() => confirmReject(p.id)} disabled={savingPaymentId === p.id} className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50">
                            Подтвердить отклонение
                          </button>
                          <button onClick={() => setRejectingPaymentId(null)} className="text-xs text-text-muted hover:text-primary">
                            Отмена
                          </button>
                        </div>
                      )}
                      {isAdmin && p.status === "CONFIRMED" && refundingPaymentId !== p.id && (
                        <button
                          onClick={() => openRefundForm(p.id, p.amount - p.refunds.reduce((s, r) => s + r.amount, 0))}
                          disabled={savingPaymentId === p.id}
                          className="text-xs text-text-muted hover:text-red-600 mt-1.5 disabled:opacity-50"
                        >
                          Оформить возврат
                        </button>
                      )}
                      {isAdmin && p.status === "CONFIRMED" && refundingPaymentId === p.id && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <input
                            type="number"
                            value={refundAmountDraft}
                            onChange={(e) => setRefundAmountDraft(e.target.value)}
                            placeholder="Сумма возврата"
                            className="input-field text-xs w-28 py-1"
                            autoFocus
                          />
                          <input
                            value={refundReasonDraft}
                            onChange={(e) => setRefundReasonDraft(e.target.value)}
                            placeholder="Причина возврата"
                            className="input-field text-xs flex-1 min-w-[140px] py-1"
                          />
                          <button
                            onClick={() => confirmRefund(p.id)}
                            disabled={savingPaymentId === p.id || !refundAmountDraft || !refundReasonDraft.trim()}
                            className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
                          >
                            Подтвердить возврат
                          </button>
                          <button onClick={() => setRefundingPaymentId(null)} className="text-xs text-text-muted hover:text-primary">
                            Отмена
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    placeholder="Сумма"
                    value={paymentDraft.amount}
                    onChange={(e) => setPaymentDraft({ ...paymentDraft, amount: e.target.value })}
                    className="input-field text-sm w-28"
                  />
                  <select value={paymentDraft.method} onChange={(e) => setPaymentDraft({ ...paymentDraft, method: e.target.value as PaymentMethod })} className="input-field text-sm w-auto">
                    {PAYMENT_METHOD_OPTIONS.map((m) => (
                      <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
                    ))}
                  </select>
                  <input
                    placeholder="№ операции"
                    value={paymentDraft.externalRef}
                    onChange={(e) => setPaymentDraft({ ...paymentDraft, externalRef: e.target.value })}
                    className="input-field text-sm w-32"
                  />
                  <input
                    placeholder="Примечание"
                    value={paymentDraft.note}
                    onChange={(e) => setPaymentDraft({ ...paymentDraft, note: e.target.value })}
                    className="input-field text-sm flex-1 min-w-[120px]"
                  />
                  <button onClick={handleSubmitPayment} disabled={postingPayment || !paymentDraft.amount} className="btn-primary px-3 text-sm disabled:opacity-50">
                    Добавить платёж
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </div>

      <div className="card p-5 mb-4">
        <p className="text-xs text-text-muted mb-2 font-semibold">Заметки</p>
        <div className="space-y-2 mb-3">
          {lead.notes.length === 0 && <p className="text-xs text-text-muted">Пока нет заметок</p>}
          {lead.notes.map((note) => {
            const canManage = note.authorId === currentUserId || currentUserRole === "ADMIN";
            const isEditingNote = editingNoteId === note.id;
            return (
              <div key={note.id} className="text-sm bg-white border border-border rounded-lg px-3 py-2">
                {isEditingNote ? (
                  <div className="flex gap-2">
                    <input
                      value={noteEditText}
                      onChange={(e) => setNoteEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(note.id); }}
                      className="input-field text-sm flex-1 py-1"
                      autoFocus
                    />
                    <button onClick={() => handleSaveNote(note.id)} disabled={savingNoteId === note.id || !noteEditText.trim()} className="text-primary disabled:opacity-50">
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEditingNoteId(null)} className="text-text-muted">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-text">{note.text}</p>
                      <p className="text-xs text-text-muted mt-1">{note.author.name} · {formatDate(note.createdAt)}</p>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => startEditNote(note.id, note.text)} className="text-text-muted hover:text-primary">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDeleteNote(note.id)} disabled={savingNoteId === note.id} className="text-text-muted hover:text-red-600 disabled:opacity-50">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }}
            placeholder="Добавить заметку..."
            className="input-field text-sm flex-1"
          />
          <button onClick={handleAddNote} disabled={postingNote || !noteDraft.trim()} className="btn-primary px-3 disabled:opacity-50 flex items-center gap-1.5 text-sm">
            <MessageSquarePlus size={14} /> Добавить
          </button>
        </div>
      </div>

      {lead.activities.length > 0 && (
        <div className="card p-5">
          <p className="text-xs text-text-muted mb-2 font-semibold">История изменений</p>
          <div className="space-y-1">
            {lead.activities.map((a) => (
              <p key={a.id} className="text-xs text-text-muted">
                {a.field === "stage" ? "Этап" : "Ответственный"}: <span className="text-text">{a.oldValue ?? "—"} → {a.newValue ?? "—"}</span>
                {" · "}{a.user.name}, {formatDate(a.createdAt)}
              </p>
            ))}
          </div>
        </div>
      )}

      {orderPreviewOpen && latestQuoteVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="font-display font-bold text-lg text-text mb-1">Создать заказ из предложения</h3>
            <p className="text-xs text-text-muted mb-4">Версия {latestQuoteVersion.versionNumber} · проверьте состав и итог перед созданием заказа</p>
            <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
              {latestQuoteVersion.items.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm gap-2 border-b border-border pb-1.5">
                  <span className="truncate">{i.productName} × {i.quantity}</span>
                  <span className="whitespace-nowrap font-medium">{formatPrice(i.unitPrice * i.quantity * (1 - i.lineDiscountPercent / 100))}</span>
                </div>
              ))}
            </div>
            {latestQuoteVersion.discountPercent > 0 && (
              <p className="text-xs text-text-muted mb-2">Скидка на предложение: {latestQuoteVersion.discountPercent}%{latestQuoteVersion.discountReason ? ` — ${latestQuoteVersion.discountReason}` : ""}</p>
            )}
            <div className="flex items-center justify-between text-base font-bold text-text mb-5">
              <span>Итого</span>
              <span>{formatPrice(computeQuoteDraftTotal(latestQuoteVersion.items, latestQuoteVersion.discountPercent))}</span>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setOrderPreviewOpen(false)} className="btn-secondary px-5 py-2.5">Отмена</button>
              <button onClick={confirmCreateOrderFromQuote} disabled={savingOrder} className="btn-primary px-5 py-2.5 disabled:opacity-50">
                {savingOrder ? "Создаём..." : "Подтвердить и создать заказ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
