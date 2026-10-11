"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronLeft, ChevronRight, Download, Search, AlarmClock, ShoppingBag, Settings2, Phone } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import type { LeadWithNotes } from "@/lib/leads-server";
import type { LeadSource } from "@prisma/client";
import { STATUS_LABEL, STATUS_STYLE, STATUS_OPTIONS, SOURCE_LABEL, OVERDUE_HOURS } from "@/lib/lead-labels";

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

const SOURCE_OPTIONS: LeadSource[] = ["CALLBACK", "QUICK_CALLBACK", "CUSTOM_ORDER"];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function overdueHours(createdAt: Date | string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (60 * 60 * 1000));
}

function rowTotals(lead: LeadWithNotes) {
  const amount = lead.order?.amount ?? lead.totalPrice;
  if (!lead.order) return { amount, paid: null as number | null, remaining: null as number | null };
  let paid = 0;
  for (const p of lead.order.payments) {
    paid += p.amount;
    for (const r of p.refunds) paid -= r.amount;
  }
  return { amount, paid, remaining: amount - paid };
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
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);

  function navigate(updates: Record<string, string | undefined>, resetPage = true) {
    const params = new URLSearchParams();
    const merged = { ...filters, page: resetPage ? undefined : String(page), ...updates };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/crm${params.toString() ? `?${params}` : ""}`);
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const anyFilterActive = !!(filters.status || filters.source || filters.assignedToId || filters.search || filters.dateFrom || filters.dateTo);

  function exportUrl() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/api/crm/leads/export${params.toString() ? `?${params}` : ""}`;
  }

  const pageTotals = leads.reduce(
    (acc, lead) => {
      const t = rowTotals(lead);
      acc.amount += t.amount;
      if (t.paid !== null) acc.paid += t.paid;
      return acc;
    },
    { amount: 0, paid: 0 }
  );
  const pageRemaining = pageTotals.amount - pageTotals.paid;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="font-display font-bold text-xl text-text">Заявки</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">Всего: {total}</span>
          <a href={exportUrl()} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
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

          <select value={filters.source ?? ""} onChange={(e) => navigate({ source: e.target.value || undefined })} className="input-field text-sm w-auto py-2">
            <option value="">Все источники</option>
            {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
          </select>

          <select value={filters.assignedToId ?? ""} onChange={(e) => navigate({ assignedToId: e.target.value || undefined })} className="input-field text-sm w-auto py-2">
            {currentUserRole === "ADMIN" && <option value="">Все ответственные</option>}
            <option value="unassigned">Не назначено</option>
            {currentUserId && <option value={currentUserId}>Мои заявки</option>}
            {currentUserRole === "ADMIN" &&
              assignableUsers.filter((u) => u.id !== currentUserId).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
          </select>

          <input type="date" value={filters.dateFrom ?? ""} onChange={(e) => navigate({ dateFrom: e.target.value || undefined })} className="input-field text-sm w-auto py-2" />
          <span className="text-text-muted text-xs">—</span>
          <input type="date" value={filters.dateTo ?? ""} onChange={(e) => navigate({ dateTo: e.target.value || undefined })} className="input-field text-sm w-auto py-2" />

          {anyFilterActive && (
            <button onClick={() => { setSearchInput(""); router.push("/crm"); }} className="text-xs text-text-muted hover:text-primary underline">
              Сбросить
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select value={filters.status ?? ""} onChange={(e) => navigate({ status: e.target.value || undefined })} className="input-field text-sm w-auto py-2">
            <option value="">Все статусы</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
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
            {STATUS_OPTIONS.filter((s) => s !== "LOST").map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)} className="input-field text-sm w-auto py-1.5">
            <option value="">Ответственный...</option>
            <option value="unassigned">Не назначено</option>
            {assignableUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button onClick={handleBulkApply} disabled={savingBulk || (!bulkStatus && !bulkAssignee)} className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50">
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
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input type="checkbox" checked={selectedIds.size === leads.length} onChange={toggleSelectAll} />
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">№</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Дата</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Источник</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Клиент</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Ответственный</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Сумма</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Оплачено</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Остаток</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => {
                const isOverdue = lead.status === "NEW" && overdueHours(lead.createdAt) >= OVERDUE_HOURS;
                const SourceIcon = SOURCE_ICON[lead.source];
                const { amount, paid, remaining } = rowTotals(lead);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/crm/leads/${lead.id}`)}
                    className={cn("cursor-pointer hover:bg-surface/60 transition-colors", lead.archivedAt && "opacity-60")}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleSelect(lead.id)} />
                    </td>
                    <td className="px-3 py-3 font-bold text-primary text-xs whitespace-nowrap">{lead.refNumber}</td>
                    <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1", SOURCE_STYLE[lead.source])}>
                        <SourceIcon size={11} /> {SOURCE_LABEL[lead.source]}
                      </span>
                    </td>
                    <td className="px-3 py-3 min-w-[160px]">
                      <p className="font-semibold text-text text-sm truncate">{lead.fullName}</p>
                      <p className="text-xs text-text-muted truncate">+7{lead.phone}</p>
                    </td>
                    <td className="px-3 py-3 text-text-muted text-xs whitespace-nowrap">
                      {lead.assignedTo ? lead.assignedTo.name : <span className="italic">не назначено</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-text whitespace-nowrap">{amount > 0 ? formatPrice(amount) : "—"}</td>
                    <td className="px-3 py-3 text-right text-text-muted whitespace-nowrap">{paid !== null ? formatPrice(paid) : "—"}</td>
                    <td
                      className={cn(
                        "px-3 py-3 text-right whitespace-nowrap font-medium",
                        remaining === null ? "text-text-muted" : remaining > 0 ? "text-amber-700" : remaining < 0 ? "text-red-600" : "text-green-700"
                      )}
                    >
                      {remaining !== null ? formatPrice(remaining) : "—"}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {isOverdue && <AlarmClock size={13} className="text-red-600" />}
                        <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", STATUS_STYLE[lead.status])}>{STATUS_LABEL[lead.status]}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-surface border-t border-border font-semibold text-text">
              <tr>
                <td colSpan={6} className="px-3 py-3 text-right text-xs text-text-muted uppercase tracking-wider">Итого на странице</td>
                <td className="px-3 py-3 text-right">{formatPrice(pageTotals.amount)}</td>
                <td className="px-3 py-3 text-right">{formatPrice(pageTotals.paid)}</td>
                <td className={cn("px-3 py-3 text-right", pageRemaining > 0 ? "text-amber-700" : pageRemaining < 0 ? "text-red-600" : "text-green-700")}>
                  {formatPrice(pageRemaining)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
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
