import Link from "next/link";
import { LayoutDashboard, ListChecks } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { LeadStats } from "@/lib/leads-server";
import type { MyOpenTask } from "@/lib/tasks-server";
import type { LeadSource } from "@prisma/client";
import { SOURCE_LABEL, TASK_TYPE_LABEL, LOST_REASON_LABEL } from "@/lib/lead-labels";
import StagePill from "@/components/crm/StagePill";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function StatCard({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card p-4", className)}>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="font-display font-bold text-2xl text-text">{value}</p>
    </div>
  );
}

export default function Dashboard({
  stats,
  myTasks,
  averageWonOrderAmount,
  isAdmin,
}: {
  stats: LeadStats;
  myTasks: MyOpenTask[];
  averageWonOrderAmount: number | null;
  isAdmin: boolean;
}) {
  return (
    <div>
      <h1 className="font-display font-bold text-xl text-text mb-6 flex items-center gap-2">
        <LayoutDashboard size={20} /> Дашборд
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Всего заявок" value={stats.total} />
        <StatCard label="Не назначено" value={stats.unassigned} />
        <StatCard label="Просрочено (2ч+)" value={stats.overdue} className={stats.overdue > 0 ? "ring-1 ring-red-300" : ""} />
        <StatCard
          label="В работе"
          value={stats.byStage.filter((s) => s.key !== "NEW" && s.key !== "DONE" && s.key !== "CANCELED").reduce((sum, s) => sum + s.count, 0)}
        />
      </div>

      <div className={cn("grid grid-cols-2 gap-4 mb-6", isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <StatCard label="Конверсия" value={stats.conversionRate !== null ? `${Math.round(stats.conversionRate * 100)}%` : "—"} />
        <StatCard label="Средний чек" value={averageWonOrderAmount !== null ? formatPrice(averageWonOrderAmount) : "—"} />
        {isAdmin && (
          <StatCard
            label="Просроченные задачи"
            value={stats.overdueTasks}
            className={stats.overdueTasks > 0 ? "ring-1 ring-red-300" : ""}
          />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-text-muted mb-3 font-semibold">По этапам</p>
          <div className="space-y-2">
            {stats.byStage.map((s) => (
              <div key={s.stageId} className="flex items-center justify-between text-sm">
                <StagePill stage={s} />
                <span className="font-semibold text-text">{s.count}</span>
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

      {stats.lossReasons.length > 0 && (
        <div className="card p-4 mb-6">
          <p className="text-xs text-text-muted mb-3 font-semibold">Причины потерь</p>
          <div className="space-y-2">
            {stats.lossReasons.map((lr) => (
              <div key={lr.reason} className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{LOST_REASON_LABEL[lr.reason]}</span>
                <span className="font-semibold text-text">{lr.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4 mb-6">
        <p className="text-xs text-text-muted mb-3 font-semibold flex items-center gap-1.5">
          <ListChecks size={14} /> Мои открытые задачи
        </p>
        {myTasks.length === 0 ? (
          <p className="text-xs text-text-muted">Нет открытых задач</p>
        ) : (
          <div className="space-y-2">
            {myTasks.map((t) => (
              <Link
                key={t.id}
                href={`/crm/leads/${t.lead.id}`}
                className="flex items-center justify-between text-sm bg-white border border-border rounded-lg px-3 py-2 hover:border-primary/40"
              >
                <span className="text-text">{TASK_TYPE_LABEL[t.type]} — {t.lead.fullName}</span>
                <span className="text-xs text-text-muted whitespace-nowrap">до {formatDate(t.dueAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4">
        <p className="text-xs text-text-muted mb-3 font-semibold">Нагрузка по менеджерам (активные сделки)</p>
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
