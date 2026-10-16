"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, AlarmClock } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import StagePill from "@/components/crm/StagePill";
import type { BoardLead, TableTab } from "@/lib/orders-board-server";

function rowTotals(lead: BoardLead) {
  const amount = lead.order?.amount ?? lead.totalPrice;
  if (!lead.order) return { amount, paid: null as number | null };
  let paid = 0;
  for (const p of lead.order.payments) {
    if (p.status !== "CONFIRMED") continue;
    paid += p.amount;
    for (const r of p.refunds) paid -= r.amount;
  }
  return { amount, paid };
}

interface Filters {
  managerId?: string;
  tableTab?: TableTab;
  search?: string;
}

interface Props {
  leads: BoardLead[];
  total: number;
  page: number;
  pageSize: number;
  filters: Filters;
  assignableUsers: { id: string; name: string }[];
  backHref: string;
}

const TABS: { key: TableTab; label: string }[] = [
  { key: "active", label: "Активные" },
  { key: "unassigned", label: "Без менеджера" },
  { key: "late", label: "Просрочено" },
  { key: "closed", label: "Закрытые" },
  { key: "all", label: "Все" },
];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function OrdersTable({ leads, total, page, pageSize, filters, backHref }: Props) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function navigate(updates: Record<string, string | undefined>, resetPage = true) {
    const params = new URLSearchParams();
    params.set("view", "table");
    const merged = { ...filters, page: resetPage ? undefined : String(page), ...updates };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/crm?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => navigate({ tableTab: t.key === "active" ? undefined : t.key })}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
              (filters.tableTab ?? "active") === t.key
                ? "bg-primary text-white border-primary"
                : "bg-white text-text-muted border-border hover:border-primary/40"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="card p-10 text-center text-sm text-text-muted">Заказов не найдено</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">№</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Клиент</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Этап</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Менеджер</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Сумма</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Оплачено</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Следующий шаг</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Создан</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => {
                const { amount, paid } = rowTotals(lead);
                const task = lead.tasks[0];
                const overdue = !!task && task.dueAt.getTime() < Date.now();
                return (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/crm/leads/${lead.id}?back=${encodeURIComponent(backHref)}`)}
                    className="cursor-pointer hover:bg-surface/60 transition-colors"
                  >
                    <td className="px-3 py-3 font-bold text-primary text-xs whitespace-nowrap">{lead.refNumber}</td>
                    <td className="px-3 py-3 min-w-[160px]">
                      <p className="font-semibold text-text text-sm truncate">{lead.fullName}</p>
                      <p className="text-xs text-text-muted truncate">+7{lead.phone}</p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StagePill stage={lead.stage} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                      {lead.assignedTo ? (
                        <span className="text-text-muted">{lead.assignedTo.name}</span>
                      ) : (
                        <span className="text-red-600 font-semibold">Не назначен</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-text whitespace-nowrap">{formatPrice(amount)}</td>
                    <td className="px-3 py-3 text-right text-text-muted whitespace-nowrap">{paid !== null ? formatPrice(paid) : "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {task ? (
                        <span className={cn("text-xs font-medium inline-flex items-center gap-1", overdue ? "text-red-600" : "text-text-muted")}>
                          {overdue && <AlarmClock size={12} />}
                          {formatDate(task.dueAt)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
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
