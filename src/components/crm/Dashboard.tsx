import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadStats } from "@/lib/leads-server";
import type { LeadStatus, LeadSource } from "@prisma/client";

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

const SOURCE_LABEL: Record<LeadSource, string> = {
  CALLBACK: "Заказ",
  QUICK_CALLBACK: "Обратный звонок",
  CUSTOM_ORDER: "Инд. заказ",
};

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={cn("card p-4", className)}>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="font-display font-bold text-2xl text-text">{value}</p>
    </div>
  );
}

export default function Dashboard({ stats }: { stats: LeadStats }) {
  return (
    <div>
      <h1 className="font-display font-bold text-xl text-text mb-6 flex items-center gap-2">
        <LayoutDashboard size={20} /> Дашборд
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Всего заявок" value={stats.total} />
        <StatCard label="Не назначено" value={stats.unassigned} />
        <StatCard label="Просрочено (2ч+)" value={stats.overdue} className={stats.overdue > 0 ? "ring-1 ring-red-300" : ""} />
        <StatCard label="В работе" value={stats.byStatus.IN_PROGRESS} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-text-muted mb-3 font-semibold">По статусам</p>
          <div className="space-y-2">
            {(Object.keys(stats.byStatus) as LeadStatus[]).map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_STYLE[s])}>{STATUS_LABEL[s]}</span>
                <span className="font-semibold text-text">{stats.byStatus[s]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-text-muted mb-3 font-semibold">По источникам</p>
          <div className="space-y-2">
            {(Object.keys(stats.bySource) as LeadSource[]).map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{SOURCE_LABEL[s]}</span>
                <span className="font-semibold text-text">{stats.bySource[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs text-text-muted mb-3 font-semibold">Нагрузка по менеджерам (новые + в работе)</p>
        {stats.managerLoad.length === 0 ? (
          <p className="text-xs text-text-muted">Нет активных менеджеров</p>
        ) : (
          <div className="space-y-2">
            {stats.managerLoad.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-text">{m.name}</span>
                <span className="font-semibold text-text">{m.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
