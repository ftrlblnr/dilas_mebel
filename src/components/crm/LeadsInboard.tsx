"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, ChevronDown, ChevronUp, MessageSquarePlus, Phone, Search, AlarmClock, ChevronLeft, ChevronRight, Pencil, Trash2, Archive, ArchiveRestore, X, Check, Download, ExternalLink, ShoppingBag, Settings2 } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import type { LeadWithNotes, LeadItemInput } from "@/lib/leads-server";
import type { LeadStatus, LeadSource } from "@prisma/client";

const SOURCE_LABEL: Record<LeadSource, string> = {
  CALLBACK: "Заказ",
  QUICK_CALLBACK: "Обратный звонок",
  CUSTOM_ORDER: "Инд. заказ",
};

const SOURCE_STYLE: Record<LeadSource, string> = {
  CALLBACK: "bg-sky-100 text-sky-700",
  QUICK_CALLBACK: "bg-teal-100 text-teal-700",
  CUSTOM_ORDER: "bg-purple-100 text-purple-700",
};

const SOURCE_ICON: Record<LeadSource, typeof Phone> = {
  CALLBACK: ShoppingBag,
  QUICK_CALLBACK: Phone,
  CUSTOM_ORDER: Settings2,
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Завершена",
  CANCELED: "Отменена",
};

const STATUS_STYLE: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700",
  CANCELED: "bg-red-100 text-red-600",
};

const STATUS_OPTIONS: LeadStatus[] = ["NEW", "IN_PROGRESS", "DONE", "CANCELED"];
const SOURCE_OPTIONS: LeadSource[] = ["CALLBACK", "QUICK_CALLBACK", "CUSTOM_ORDER"];

const OVERDUE_HOURS = 2; // без реакции на новую заявку

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

interface Filters {
  status?: string;
  source?: string;
  assignedToId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  archived?: string;
}

interface EditableFields {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  comment: string;
  preferredTime: string;
}

interface Props {
  leads: LeadWithNotes[];
  total: number;
  page: number;
  pageSize: number;
  assignableUsers: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole?: string;
  filters: Filters;
}

export default function LeadsInboard({ leads, total, page, pageSize, assignableUsers, currentUserId, currentUserRole, filters }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [postingNoteId, setPostingNoteId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditableFields | null>(null);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditText, setNoteEditText] = useState("");
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [phoneMenuId, setPhoneMenuId] = useState<string | null>(null);

  function navigate(updates: Record<string, string | undefined>, resetPage = true) {
    const params = new URLSearchParams();
    const merged = { ...filters, page: resetPage ? undefined : String(page), ...updates };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/crm${params.toString() ? `?${params}` : ""}`);
  }

  async function handleLeadUpdate(id: string, data: { status?: LeadStatus; assignedToId?: string | null; archived?: boolean }) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      showToast("Сохранено");
      router.refresh();
    } catch {
      showToast("Не удалось сохранить", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function handleAddNote(id: string) {
    const text = (noteDrafts[id] ?? "").trim();
    if (!text) return;
    setPostingNoteId(id);
    try {
      const res = await fetch(`/api/crm/leads/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      setNoteDrafts((prev) => ({ ...prev, [id]: "" }));
      showToast("Заметка добавлена");
      router.refresh();
    } catch {
      showToast("Не удалось добавить заметку", "error");
    } finally {
      setPostingNoteId(null);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))));
  }

  async function handleBulkApply() {
    if (selectedIds.size === 0 || (!bulkStatus && !bulkAssignee)) return;
    setSavingBulk(true);
    try {
      const data: Record<string, unknown> = { ids: Array.from(selectedIds) };
      if (bulkStatus) data.status = bulkStatus;
      if (bulkAssignee) data.assignedToId = bulkAssignee === "unassigned" ? null : bulkAssignee;
      const res = await fetch("/api/crm/leads/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      showToast("Заявки обновлены");
      setSelectedIds(new Set());
      setBulkStatus("");
      setBulkAssignee("");
      router.refresh();
    } catch {
      showToast("Не удалось применить массовое действие", "error");
    } finally {
      setSavingBulk(false);
    }
  }

  async function handleArchiveToggle(lead: LeadWithNotes) {
    await handleLeadUpdate(lead.id, { archived: !lead.archivedAt });
  }

  function startEdit(lead: LeadWithNotes) {
    setEditingId(lead.id);
    setEditDraft({
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email ?? "",
      city: lead.city ?? "",
      comment: lead.comment ?? "",
      preferredTime: lead.preferredTime ?? "",
    });
  }

  async function handleSaveEdit(id: string) {
    if (!editDraft) return;
    setSavingEditId(id);
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
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
      setEditingId(null);
      setEditDraft(null);
      router.refresh();
    } catch {
      showToast("Не удалось сохранить изменения", "error");
    } finally {
      setSavingEditId(null);
    }
  }

  function startEditNote(noteId: string, text: string) {
    setEditingNoteId(noteId);
    setNoteEditText(text);
  }

  async function handleSaveNote(leadId: string, noteId: string) {
    const text = noteEditText.trim();
    if (!text) return;
    setSavingNoteId(noteId);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/notes/${noteId}`, {
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

  async function handleDeleteNote(leadId: string, noteId: string) {
    setSavingNoteId(noteId);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Заметка удалена");
      router.refresh();
    } catch {
      showToast("Не удалось удалить заметку", "error");
    } finally {
      setSavingNoteId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const anyFilterActive = !!(filters.status || filters.source || filters.assignedToId || filters.search || filters.dateFrom || filters.dateTo);

  function exportUrl() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/api/crm/leads/export${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="font-display font-bold text-xl text-text">Заявки</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">Всего: {total}</span>
          <a
            href={exportUrl()}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Download size={13} /> Экспорт CSV
          </a>
        </div>
      </div>

      {/* Search + quick filters */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") navigate({ search: searchInput || undefined }); }}
              placeholder="Имя, телефон или № заявки..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <button onClick={() => navigate({ search: searchInput || undefined })} className="btn-primary px-4 py-2 text-sm">Найти</button>

          <select
            value={filters.source ?? ""}
            onChange={(e) => navigate({ source: e.target.value || undefined })}
            className="input-field text-sm w-auto py-2"
          >
            <option value="">Все источники</option>
            {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
          </select>

          <select
            value={filters.assignedToId ?? ""}
            onChange={(e) => navigate({ assignedToId: e.target.value || undefined })}
            className="input-field text-sm w-auto py-2"
          >
            {currentUserRole === "ADMIN" && <option value="">Все ответственные</option>}
            <option value="unassigned">Не назначено</option>
            {currentUserId && <option value={currentUserId}>Мои заявки</option>}
            {currentUserRole === "ADMIN" &&
              assignableUsers.filter((u) => u.id !== currentUserId).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => navigate({ dateFrom: e.target.value || undefined })}
            className="input-field text-sm w-auto py-2"
          />
          <span className="text-text-muted text-xs">—</span>
          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => navigate({ dateTo: e.target.value || undefined })}
            className="input-field text-sm w-auto py-2"
          />

          {anyFilterActive && (
            <button
              onClick={() => { setSearchInput(""); router.push("/crm"); }}
              className="text-xs text-text-muted hover:text-primary underline"
            >
              Сбросить
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["ALL", ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              onClick={() => navigate({ status: s === "ALL" ? undefined : s })}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                (filters.status ?? "ALL") === s ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/40"
              )}
            >
              {s === "ALL" ? "Все статусы" : STATUS_LABEL[s]}
            </button>
          ))}
          <button
            onClick={() => navigate({ archived: filters.archived ? undefined : "1" })}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
              filters.archived ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/40"
            )}
          >
            {filters.archived ? "Скрыть архив" : "Показать архив"}
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="card p-3 mb-4 flex items-center gap-3 flex-wrap bg-primary/5 border-primary/20">
          <span className="text-xs font-semibold text-text">Выбрано: {selectedIds.size}</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="input-field text-sm w-auto py-1.5">
            <option value="">Статус...</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)} className="input-field text-sm w-auto py-1.5">
            <option value="">Ответственный...</option>
            <option value="unassigned">Не назначено</option>
            {assignableUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button
            onClick={handleBulkApply}
            disabled={savingBulk || (!bulkStatus && !bulkAssignee)}
            className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
          >
            Применить
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-text-muted hover:text-primary underline">
            Снять выбор
          </button>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="card p-10 text-center">
          <ClipboardList size={36} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Заявок не найдено</p>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs text-text-muted px-1">
            <input type="checkbox" checked={selectedIds.size === leads.length} onChange={toggleSelectAll} />
            Выбрать все на странице
          </label>
          {leads.map((lead) => {
            const items = parseItems(lead.itemsJson);
            const expanded = expandedId === lead.id;
            const isOverdue = lead.status === "NEW" && overdueHours(lead.createdAt) >= OVERDUE_HOURS;
            const SourceIcon = SOURCE_ICON[lead.source];
            return (
              <div key={lead.id} className={cn("card overflow-hidden", isOverdue && "ring-1 ring-red-300", lead.archivedAt && "opacity-60")}>
                <div className="w-full flex items-center gap-3 p-4 hover:bg-surface/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="shrink-0"
                  />
                  <button
                    onClick={() => setExpandedId(expanded ? null : lead.id)}
                    className="flex-1 flex items-center justify-between gap-4 text-left min-w-0"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-bold text-primary text-xs whitespace-nowrap">{lead.refNumber}</span>
                      <span className="text-xs text-text-muted whitespace-nowrap hidden sm:inline">{formatDate(lead.createdAt)}</span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap hidden md:inline-flex items-center gap-1", SOURCE_STYLE[lead.source])}>
                        <SourceIcon size={11} /> {SOURCE_LABEL[lead.source]}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-text text-sm truncate">{lead.fullName}</p>
                        <p className="text-xs text-text-muted truncate">
                          {lead.assignedTo ? lead.assignedTo.name : <span className="italic">не назначено</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {lead.archivedAt && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-surface border border-border text-text-muted whitespace-nowrap">
                          В архиве
                        </span>
                      )}
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600 whitespace-nowrap">
                          <AlarmClock size={13} /> {overdueHours(lead.createdAt)} ч без ответа
                        </span>
                      )}
                      {lead.totalPrice > 0 && <span className="font-bold text-primary text-sm hidden sm:inline">{formatPrice(lead.totalPrice)}</span>}
                      <span className={cn("text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap", STATUS_STYLE[lead.status])}>
                        {STATUS_LABEL[lead.status]}
                      </span>
                      {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                    </div>
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-border p-4 space-y-4 bg-surface/40">
                    <div className="flex justify-end gap-2">
                      {editingId === lead.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(lead.id)}
                            disabled={savingEditId === lead.id}
                            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                          >
                            <Check size={13} /> Сохранить
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditDraft(null); }}
                            className="flex items-center gap-1 text-xs text-text-muted hover:text-primary"
                          >
                            <X size={13} /> Отмена
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(lead)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-primary"
                        >
                          <Pencil size={13} /> Редактировать
                        </button>
                      )}
                      <button
                        onClick={() => handleArchiveToggle(lead)}
                        disabled={savingId === lead.id}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-primary disabled:opacity-50"
                      >
                        {lead.archivedAt ? <><ArchiveRestore size={13} /> Вернуть из архива</> : <><Archive size={13} /> Архивировать</>}
                      </button>
                    </div>

                    {editingId === lead.id && editDraft ? (
                      <div className="grid sm:grid-cols-2 gap-3 text-sm bg-white border border-border rounded-lg p-3">
                        <input
                          value={editDraft.fullName}
                          onChange={(e) => setEditDraft({ ...editDraft, fullName: e.target.value })}
                          placeholder="Имя"
                          className="input-field text-sm"
                        />
                        <input
                          value={editDraft.phone}
                          onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })}
                          placeholder="Телефон"
                          className="input-field text-sm"
                        />
                        <input
                          value={editDraft.email}
                          onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                          placeholder="Email"
                          className="input-field text-sm"
                        />
                        <input
                          value={editDraft.city}
                          onChange={(e) => setEditDraft({ ...editDraft, city: e.target.value })}
                          placeholder="Город"
                          className="input-field text-sm"
                        />
                        <input
                          value={editDraft.preferredTime}
                          onChange={(e) => setEditDraft({ ...editDraft, preferredTime: e.target.value })}
                          placeholder="Удобное время"
                          className="input-field text-sm"
                        />
                        <input
                          value={editDraft.comment}
                          onChange={(e) => setEditDraft({ ...editDraft, comment: e.target.value })}
                          placeholder="Комментарий"
                          className="input-field text-sm sm:col-span-2"
                        />
                      </div>
                    ) : (
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="relative">
                          <span className="text-text-muted">Телефон: </span>
                          <button
                            type="button"
                            onClick={() => setPhoneMenuId(phoneMenuId === lead.id ? null : lead.id)}
                            className="text-primary hover:underline font-medium"
                          >
                            +7{lead.phone}
                          </button>
                          {phoneMenuId === lead.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setPhoneMenuId(null)} />
                              <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-border overflow-hidden min-w-[180px]">
                                <a
                                  href={`tel:+7${digitsOnly(lead.phone)}`}
                                  onClick={() => setPhoneMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface/60"
                                >
                                  <Phone size={14} /> Позвонить
                                </a>
                                <a
                                  href={`https://wa.me/7${digitsOnly(lead.phone)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setPhoneMenuId(null)}
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
                        {lead.preferredTime && <p><span className="text-text-muted">Время: </span>{lead.preferredTime}</p>}
                        {lead.comment && <p><span className="text-text-muted">Комментарий: </span>{lead.comment}</p>}
                      </div>

                      {items.length > 0 && (
                        <div>
                          <p className="text-text-muted mb-1.5 flex items-center gap-1.5">
                            Состав заказа:
                            {lead.source === "CUSTOM_ORDER" && items[0]?.productId && (
                              <Link
                                href={`/products/${items[0].productId}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                              >
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
                                        <Link
                                          href={`/products/${it.productId}`}
                                          target="_blank"
                                          className="inline-flex items-center gap-1 text-primary hover:underline"
                                        >
                                          {it.productName} <ExternalLink size={12} />
                                        </Link>
                                      ) : (
                                        it.productName
                                      )}
                                    </td>
                                    <td className="px-2 py-1.5 text-center text-text-muted">{it.quantity}</td>
                                    <td className="px-2 py-1.5 text-right text-text-muted">{it.price ? formatPrice(it.price) : "—"}</td>
                                    <td className="px-2 py-1.5 text-right text-text font-medium">
                                      {it.price && it.quantity ? formatPrice(it.price * it.quantity) : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                    )}

                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Статус:</span>
                        <select
                          value={lead.status}
                          disabled={savingId === lead.id}
                          onChange={(e) => handleLeadUpdate(lead.id, { status: e.target.value as LeadStatus })}
                          className="input-field text-sm w-auto py-1.5"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Ответственный:</span>
                        <select
                          value={lead.assignedToId ?? ""}
                          disabled={savingId === lead.id}
                          onChange={(e) => handleLeadUpdate(lead.id, { assignedToId: e.target.value || null })}
                          className="input-field text-sm w-auto py-1.5"
                        >
                          <option value="">Не назначено</option>
                          {assignableUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
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
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(lead.id, note.id); }}
                                    className="input-field text-sm flex-1 py-1"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveNote(lead.id, note.id)}
                                    disabled={savingNoteId === note.id || !noteEditText.trim()}
                                    className="text-primary disabled:opacity-50"
                                  >
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
                                      <button
                                        onClick={() => handleDeleteNote(lead.id, note.id)}
                                        disabled={savingNoteId === note.id}
                                        className="text-text-muted hover:text-red-600 disabled:opacity-50"
                                      >
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
                          value={noteDrafts[lead.id] ?? ""}
                          onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(lead.id); }}
                          placeholder="Добавить заметку..."
                          className="input-field text-sm flex-1"
                        />
                        <button
                          onClick={() => handleAddNote(lead.id)}
                          disabled={postingNoteId === lead.id || !(noteDrafts[lead.id] ?? "").trim()}
                          className="btn-primary px-3 disabled:opacity-50 flex items-center gap-1.5 text-sm"
                        >
                          <MessageSquarePlus size={14} /> Добавить
                        </button>
                      </div>
                    </div>

                    {lead.activities.length > 0 && (
                      <div>
                        <p className="text-xs text-text-muted mb-2 font-semibold">История изменений</p>
                        <div className="space-y-1">
                          {lead.activities.map((a) => (
                            <p key={a.id} className="text-xs text-text-muted">
                              {a.field === "status" ? "Статус" : "Ответственный"}:{" "}
                              <span className="text-text">{a.oldValue ?? "—"} → {a.newValue ?? "—"}</span>
                              {" · "}{a.user.name}, {formatDate(a.createdAt)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => navigate({ page: String(page - 1) }, false)}
            className="p-2 rounded-lg border border-border text-text-muted hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-text-muted">Стр. {page} из {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => navigate({ page: String(page + 1) }, false)}
            className="p-2 rounded-lg border border-border text-text-muted hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
