"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, ExternalLink, MessageCircle, Phone, ShoppingBag, Settings2 } from "lucide-react";
import type { LeadStatus, LeadSource } from "@prisma/client";
import { STATUS_LABEL, STATUS_OPTIONS, SOURCE_LABEL } from "@/lib/lead-labels";

const SOURCE_ICON: Record<LeadSource, typeof Phone> = {
  CALLBACK: ShoppingBag,
  QUICK_CALLBACK: Phone,
  CUSTOM_ORDER: Settings2,
};
import { parseLeadItems, type MiniLead, type AssignableUser } from "@/lib/miniapp-types";
import {
  useTelegramBackButton,
  useTelegramMainButton,
  hapticImpact,
  hapticNotification,
  openExternalLink,
} from "@/lib/telegram-webapp";
import { formatPrice } from "@/lib/utils";

const ACTIVITY_FIELD_LABEL: Record<string, string> = {
  status: "Статус",
  assignedTo: "Ответственный",
};

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
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

  const loadLead = useCallback(async () => {
    const res = await fetch(`/api/crm/leads/${leadId}`);
    if (res.ok) setLead(await res.json());
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    loadLead();
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

  async function handleStatusChange(status: LeadStatus) {
    if (status === lead?.status) return;
    const res = await fetch(`/api/crm/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      hapticImpact("light");
      loadLead();
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
        <span className={`ma-badge ma-badge-${lead.status}`}>{STATUS_LABEL[lead.status]}</span>
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
              {lead.preferredTime && <span className="ma-row-sub">Удобное время: {lead.preferredTime}</span>}
              {lead.comment && <span className="ma-row-sub">{lead.comment}</span>}
            </div>
          )}
          <span className="ma-row-sub block mt-2">Создана {formatDateTime(lead.createdAt)}</span>
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
          <label className="text-xs font-medium ma-hint">Статус</label>
          <div className="ma-segment-group">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`ma-segment ${lead.status === s ? "ma-segment-active" : ""}`}
                onClick={() => handleStatusChange(s)}
              >
                <span className={`ma-dot ma-dot-${s}`} />
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

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
