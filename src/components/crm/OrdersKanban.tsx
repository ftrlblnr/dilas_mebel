"use client";
import { useRouter } from "next/navigation";
import { AlarmClock } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import type { BoardLead } from "@/lib/orders-board-server";
import type { Stage } from "@prisma/client";

function parseLeadItems(itemsJson: string): { productName?: string; criterionName?: string }[] {
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function ageText(createdAt: Date): string {
  const hours = Math.floor((Date.now() - createdAt.getTime()) / (60 * 60 * 1000));
  if (hours < 1) return "<1 ч";
  if (hours < 24) return `${hours} ч`;
  return `${Math.floor(hours / 24)} дн`;
}

function itemsSummary(lead: BoardLead): string {
  const items = parseLeadItems(lead.itemsJson);
  const names = items.map((i) => i.productName ?? i.criterionName).filter((n): n is string => !!n);
  return names.slice(0, 2).join(", ") || "—";
}

interface Props {
  leads: BoardLead[];
  stages: Stage[];
  backHref: string;
}

export default function OrdersKanban({ leads, stages, backHref }: Props) {
  const router = useRouter();
  const columns = stages.filter((s) => s.type !== "LOSE");

  const byStage = new Map<string, BoardLead[]>();
  for (const lead of leads) {
    const list = byStage.get(lead.stageId) ?? [];
    list.push(lead);
    byStage.set(lead.stageId, list);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((stage) => {
        const items = byStage.get(stage.id) ?? [];
        const sum = items.reduce((s, l) => s + (l.order?.amount ?? l.totalPrice), 0);
        return (
          <div key={stage.id} className="flex-shrink-0 w-[300px] flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
              <span className="text-sm font-bold text-text">{stage.name}</span>
              <span className="text-xs text-text-muted">{items.length}</span>
              <span className="text-xs text-text-muted ml-auto whitespace-nowrap">{formatPrice(sum)}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[80px]">
              {items.length === 0 && (
                <div className="card p-4 text-center text-xs text-text-muted">Нет заказов по фильтру</div>
              )}
              {items.map((lead) => {
                const task = lead.tasks[0];
                const overdue = !!task && task.dueAt.getTime() < Date.now();
                return (
                  <button
                    key={lead.id}
                    onClick={() => router.push(`/crm/leads/${lead.id}?back=${encodeURIComponent(backHref)}`)}
                    className="card p-3 text-left hover:border-primary/40 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary">{lead.refNumber}</span>
                      <span className="text-text-muted">{ageText(lead.createdAt)}</span>
                    </div>
                    <p className="font-semibold text-text text-sm truncate">{lead.fullName || `+7${lead.phone}`}</p>
                    <p className="text-xs text-text-muted truncate">{itemsSummary(lead)}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="font-semibold text-text text-sm">{formatPrice(lead.order?.amount ?? lead.totalPrice)}</span>
                      {lead.assignedTo && (
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {initials(lead.assignedTo.name)}
                        </span>
                      )}
                    </div>
                    {!lead.assignedToId ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg border border-dashed border-amber-300 bg-amber-50 text-amber-700 text-center mt-1">
                        Назначить менеджера
                      </span>
                    ) : task ? (
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-lg mt-1 inline-flex items-center gap-1",
                          overdue ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                        )}
                      >
                        {overdue && <AlarmClock size={11} />}
                        {new Date(task.dueAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
