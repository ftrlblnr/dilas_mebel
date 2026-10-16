"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, ExternalLink, MessageCircle, Phone, ShoppingBag, Settings2 } from "lucide-react";
import type { LeadSource, TaskType, PaymentMethod } from "@prisma/client";
import { SOURCE_LABEL, TASK_TYPE_LABEL, TASK_TYPE_OPTIONS, PREFERRED_TIME_LABEL } from "@/lib/lead-labels";
import {
  AGREEMENT_STATUS_LABEL,
  TRANSFER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_LABEL,
} from "@/lib/order-labels";

const SOURCE_ICON: Record<LeadSource, typeof Phone> = {
  CALLBACK: ShoppingBag,
  QUICK_CALLBACK: Phone,
  CUSTOM_ORDER: Settings2,
};
import { parseLeadItems, type MiniLead, type MiniOrder, type AssignableUser } from "@/lib/miniapp-types";
import {
  useTelegramBackButton,
  useTelegramMainButton,
  hapticImpact,
  hapticNotification,
  openExternalLink,
} from "@/lib/telegram-webapp";
import { formatPrice } from "@/lib/utils";

const ACTIVITY_FIELD_LABEL: Record<string, string> = {
  stage: "Этап",
  assignedTo: "Ответственный",
};

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

function orderRemaining(order: MiniOrder): number {
  let net = 0;
  for (const p of order.payments) {
    if (p.status !== "CONFIRMED") continue;
    net += p.amount;
    for (const r of p.refunds) net -= r.amount;
  }
  return order.amount - net;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadDetail({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<MiniLead | null>(null);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>("CALL");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [postingTask, setPostingTask] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [order, setOrder] = useState<MiniOrder | null | undefined>(undefined);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentNote, setPaymentNote] = useState("");
  const [postingPayment, setPostingPayment] = useState(false);

  const loadLead = useCallback(async () => {
    const res = await fetch(`/api/crm/leads/${leadId}`);
    if (res.ok) setLead(await res.json());
    setLoading(false);
  }, [leadId]);

  const loadOrder = useCallback(async () => {
    const res = await fetch(`/api/crm/leads/${leadId}/order`);
    if (res.ok) setOrder(await res.json());
  }, [leadId]);

  useEffect(() => {
    loadLead();
    loadOrder();
    fetch("/api/crm/users/assignable")
      .then((r) => r.json())
      .then(setUsers);
  }, [loadLead]);

  useTelegramBackButton(() => router.back());

  const handleAddNote = useCallback(async () => {
    const text = noteText.trim();
    if (!text || savingNote) return;
    setSavingNote(true);
    const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setSavingNote(false);
    if (res.ok) {
      setNoteText("");
      hapticNotification("success");
      loadLead();
    }
  }, [leadId, noteText, savingNote, loadLead]);

  useTelegramMainButton({
    text: "Добавить заметку",
    onClick: handleAddNote,
    visible: noteText.trim().length > 0,
    disabled: savingNote,
  });

  async function handleCopyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(`+7${phone}`);
      setCopied(true);
      hapticNotification("success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable in this WebView — tel: link remains the fallback
    }
  }

  async function handleAddTask() {
    if (!taskAssignee || !taskDue || postingTask) return;
    setPostingTask(true);
    const res = await fetch(`/api/crm/leads/${leadId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: taskType, assignedToId: taskAssignee, dueAt: new Date(taskDue).toISOString() }),
    });
    setPostingTask(false);
    if (res.ok) {
      setTaskDue("");
      hapticNotification("success");
      loadLead();
    }
  }

  async function handleToggleTask(taskId: string, completed: boolean) {
    setSavingTaskId(taskId);
    const res = await fetch(`/api/crm/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    setSavingTaskId(null);
    if (res.ok) {
      hapticImpact("light");
      loadLead();
    }
  }

  async function handleSubmitPayment() {
    const amount = Number(paymentAmount);
    if (!order || !Number.isFinite(amount) || amount <= 0 || postingPayment) return;
    setPostingPayment(true);
    const res = await fetch(`/api/crm/orders/${order.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method: paymentMethod, note: paymentNote || undefined }),
    });
    setPostingPayment(false);
    if (res.ok) {
      setPaymentAmount("");
      setPaymentNote("");
      hapticNotification("success");
      loadOrder();
    }
  }

  async function handleAssigneeChange(assignedToId: string) {
    if (assignedToId === (lead?.assignedToId ?? "")) return;
    const res = await fetch(`/api/crm/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: assignedToId || null }),
    });
    if (res.ok) {
      hapticImpact("light");
      loadLead();
    }
  }

  if (loading) {
    return (
      <div className="ma-screen flex items-center justify-center">
        <p className="ma-hint text-sm">Загрузка...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="ma-screen flex items-center justify-center">
        <p className="ma-hint text-sm">Заявка не найдена</p>
      </div>
    );
  }

  const SourceIcon = SOURCE_ICON[lead.source];

  return (
    <div className="ma-screen pb-10">
      <div className="ma-topbar" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <span className="ma-row-title">{lead.refNumber}</span>
        <span className="ma-badge" style={{ background: `${lead.stage.color}1A`, color: lead.stage.color }}>{lead.stage.name}</span>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        <div className="ma-card">
          <div className="flex items-center gap-3">
            <div className="ma-avatar ma-avatar-lg">{initials(lead.fullName)}</div>
            <div className="min-w-0 flex-1">
              <span className="ma-row-title block truncate">{lead.fullName}</span>
              <span className="ma-row-sub flex items-center gap-1.5 mt-0.5">
                <span className={`ma-badge ma-badge-source-${lead.source}`}>
                  <SourceIcon size={11} /> {SOURCE_LABEL[lead.source]}
                </span>
              </span>
            </div>
          </div>

          <div className="ma-contact-actions">
            <button type="button" onClick={() => openExternalLink(`tel:+7${digitsOnly(lead.phone)}`)} className="ma-contact-action">
              <span className="ma-contact-action-icon"><Phone size={15} /></span>
              Позвонить
            </button>
            <button
              type="button"
              onClick={() => openExternalLink(`https://wa.me/7${digitsOnly(lead.phone)}`)}
              className="ma-contact-action"
            >
              <span className="ma-contact-action-icon"><MessageCircle size={15} /></span>
              WhatsApp
            </button>
            <button type="button" onClick={() => handleCopyPhone(lead.phone)} className="ma-contact-action">
              <span className="ma-contact-action-icon">{copied ? <Check size={15} /> : <Copy size={15} />}</span>
              {copied ? "Скопировано" : "+7" + lead.phone}
            </button>
          </div>

          {(lead.email || lead.city || lead.preferredTime || lead.comment) && (
            <div className="flex flex-col gap-1 mt-3 pt-3" style={{ borderTop: "1px solid var(--ma-border)" }}>
              {lead.email && <span className="ma-row-sub">{lead.email}</span>}
              {lead.city && <span className="ma-row-sub">{lead.city}</span>}
              {lead.preferredTime && <span className="ma-row-sub">Удобное время: {PREFERRED_TIME_LABEL[lead.preferredTime] ?? lead.preferredTime}</span>}
              {lead.comment && <span className="ma-row-sub">{lead.comment}</span>}
            </div>
          )}
          <span className="ma-row-sub block mt-2">Создана {formatDateTime(lead.createdAt)}</span>
          <span className="ma-row-sub block mt-1">Клиент: {lead.customer.fullName}</span>
        </div>

        {(() => {
          const items = parseLeadItems(lead.itemsJson);
          if (items.length === 0) return null;
          const isCustomOrder = lead.source === "CUSTOM_ORDER";
          return (
            <div className="ma-card flex flex-col">
              <span className="text-xs font-medium ma-hint mb-1 flex items-center gap-1.5">
                Состав заказа
                {isCustomOrder && items[0]?.productId && (
                  <button
                    type="button"
                    onClick={() => openExternalLink(`https://dilas.kz/products/${items[0].productId}`)}
                    className="ma-link inline-flex items-center gap-1 text-xs"
                  >
                    {items[0].productName} <ExternalLink size={11} />
                  </button>
                )}
              </span>
              {items.map((it, i) => (
                <div key={i} className="ma-item-row">
                  <span className="ma-item-title">
                    {isCustomOrder || !it.productId ? (
                      isCustomOrder ? it.criterionName : it.productName
                    ) : (
                      <button
                        type="button"
                        onClick={() => openExternalLink(`https://dilas.kz/products/${it.productId}`)}
                        className="ma-link inline-flex items-center gap-1"
                      >
                        {it.productName} <ExternalLink size={11} />
                      </button>
                    )}
                    {!isCustomOrder && it.quantity ? ` × ${it.quantity}` : ""}
                  </span>
                  <span className="ma-item-value">
                    {isCustomOrder
                      ? it.variantLabel
                      : it.price
                        ? formatPrice(it.price * (it.quantity ?? 1))
                        : "—"}
                  </span>
                </div>
              ))}
              {lead.totalPrice > 0 && (
                <div className="ma-item-row">
                  <span className="ma-item-title">Итого</span>
                  <span className="ma-row-title">{formatPrice(lead.totalPrice)}</span>
                </div>
              )}
            </div>
          );
        })()}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium ma-hint">Ответственный</label>
          <div className="ma-segment-group">
            <button
              type="button"
              className={`ma-segment ${!lead.assignedToId ? "ma-segment-active" : ""}`}
              onClick={() => handleAssigneeChange("")}
            >
              Не назначено
            </button>
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`ma-segment ${lead.assignedToId === u.id ? "ma-segment-active" : ""}`}
                onClick={() => handleAssigneeChange(u.id)}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="ma-section-title">Задачи</p>
      <div className="px-4 flex flex-col gap-2">
        {lead.tasks.length === 0 && <p className="ma-hint text-sm">Нет задач</p>}
        {lead.tasks.map((task) => (
          <div key={task.id} className="ma-note flex items-start gap-2">
            <input
              type="checkbox"
              checked={!!task.completedAt}
              disabled={savingTaskId === task.id}
              onChange={(e) => handleToggleTask(task.id, e.target.checked)}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <p className={`ma-text text-sm ${task.completedAt ? "line-through" : ""}`}>
                {TASK_TYPE_LABEL[task.type]} — {task.assignedTo.name}
              </p>
              <p className="ma-hint text-xs">
                Срок: {formatDateTime(task.dueAt)}
                {task.result && <> · {task.result}</>}
              </p>
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-2 mt-1">
          <select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)} className="ma-input">
            {TASK_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{TASK_TYPE_LABEL[t]}</option>
            ))}
          </select>
          <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="ma-input">
            <option value="">Кому назначить...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="ma-input" />
          <button
            type="button"
            onClick={handleAddTask}
            disabled={!taskAssignee || !taskDue || postingTask}
            className="ma-button-primary"
          >
            Добавить задачу
          </button>
        </div>
      </div>

      <p className="ma-section-title">Заказ</p>
      <div className="px-4 flex flex-col gap-2">
        {order === undefined ? (
          <p className="ma-hint text-sm">Загрузка...</p>
        ) : order === null ? (
          <p className="ma-hint text-sm">Заказ ещё не создан</p>
        ) : (
          <>
            <div className="ma-card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="ma-row-title">{formatPrice(order.amount)}</span>
                <span className="ma-hint text-xs">{AGREEMENT_STATUS_LABEL[order.agreementStatus]}</span>
              </div>
              {order.discountPercent > 0 && <span className="ma-row-sub">Скидка {order.discountPercent}%</span>}
              <span className="ma-row-sub">Передача: {TRANSFER_STATUS_LABEL[order.transferStatus]}</span>
              {(() => {
                const remaining = orderRemaining(order);
                return (
                  <span className={`ma-row-sub ${remaining > 0 ? "" : remaining < 0 ? "text-red-500" : ""}`}>
                    {remaining > 0 ? `Остаток: ${formatPrice(remaining)}` : remaining < 0 ? `Переплата: ${formatPrice(-remaining)}` : "Оплачено полностью"}
                  </span>
                );
              })()}
            </div>

            {order.payments.map((p) => (
              <div key={p.id} className="ma-note flex items-center justify-between">
                <span className="ma-text text-sm">{formatPrice(p.amount)} · {PAYMENT_METHOD_LABEL[p.method]}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: p.status === "CONFIRMED" ? "#dcfce7" : p.status === "REJECTED" ? "#fee2e2" : "#fef3c7",
                    color: p.status === "CONFIRMED" ? "#15803d" : p.status === "REJECTED" ? "#b91c1c" : "#b45309",
                  }}
                >
                  {PAYMENT_STATUS_LABEL[p.status]}
                </span>
              </div>
            ))}

            <div className="flex flex-col gap-2 mt-1">
              <input
                type="number"
                placeholder="Сумма платежа"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="ma-input"
              />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="ma-input">
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
                ))}
              </select>
              <input
                placeholder="Примечание"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="ma-input"
              />
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={!paymentAmount || postingPayment}
                className="ma-button-primary"
              >
                Отправить на проверку
              </button>
            </div>
          </>
        )}
      </div>

      <p className="ma-section-title">Заметки</p>
      <div className="px-4 flex flex-col gap-2">
        {lead.notes.length === 0 && <p className="ma-hint text-sm">Пока нет заметок</p>}
        {lead.notes.map((note) => (
          <div key={note.id} className="ma-note">
            <div className="ma-note-header">
              <span className="ma-note-author">{note.author.name}</span>
              <span className="ma-note-time">{formatDateTime(note.createdAt)}</span>
            </div>
            <p className="ma-text text-sm">{note.text}</p>
          </div>
        ))}
        <textarea
          className="ma-textarea mt-2"
          placeholder="Новая заметка..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
      </div>

      {lead.activities.length > 0 && (
        <>
          <p className="ma-section-title">История</p>
          <div className="px-4 pb-4">
            <div className="ma-timeline">
              {lead.activities.map((a) => (
                <div key={a.id} className="ma-timeline-item">
                  <span className="ma-timeline-dot" />
                  <div className="ma-timeline-body">
                    <p className="ma-timeline-text">
                      {ACTIVITY_FIELD_LABEL[a.field] ?? a.field}: {a.oldValue ?? "—"} → {a.newValue ?? "—"}
                    </p>
                    <p className="ma-timeline-meta">
                      {a.user.name} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
