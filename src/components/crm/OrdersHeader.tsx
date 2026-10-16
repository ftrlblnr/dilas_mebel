"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  view: "kanban" | "table";
  subtitle: string;
  search?: string;
  attention?: boolean;
  managerId?: string;
  assignableUsers: { id: string; name: string }[];
  attentionCount?: number;
}

export default function OrdersHeader({ view, subtitle, search, attention, managerId, assignableUsers, attentionCount }: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(search ?? "");

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    params.set("view", view);
    if (search) params.set("search", search);
    if (attention) params.set("attention", "1");
    if (managerId) params.set("managerId", managerId);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`/crm?${params.toString()}`);
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h1 className="font-display font-bold text-xl text-text">Заказы покупателей</h1>
        <div role="group" aria-label="Вид" className="flex items-center gap-1 bg-surface rounded-lg p-1">
          <button
            onClick={() => navigate({ view: "kanban" })}
            className={cn("text-xs font-semibold px-3 py-1.5 rounded-md transition-colors", view === "kanban" ? "bg-white shadow-sm text-primary" : "text-text-muted")}
          >
            Канбан
          </button>
          <button
            onClick={() => navigate({ view: "table" })}
            className={cn("text-xs font-semibold px-3 py-1.5 rounded-md transition-colors", view === "table" ? "bg-white shadow-sm text-primary" : "text-text-muted")}
          >
            Таблица
          </button>
        </div>
      </div>
      <p className="text-xs text-text-muted mb-3">{subtitle}</p>

      <div className="flex gap-2 flex-wrap items-center mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") navigate({ search: searchInput || undefined }); }}
            placeholder="Номер, клиент или телефон"
            className="input-field pl-9 text-sm"
          />
        </div>
        <button onClick={() => navigate({ search: searchInput || undefined })} className="btn-primary px-4 py-2 text-sm">
          Найти
        </button>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => navigate({ managerId: undefined, attention: undefined })}
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
            !managerId && !attention ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/40"
          )}
        >
          Все
        </button>
        {view === "kanban" && (
          <button
            onClick={() => navigate({ attention: attention ? undefined : "1", managerId: undefined })}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
              attention ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/40"
            )}
          >
            Требуют внимания{attentionCount !== undefined ? ` · ${attentionCount}` : ""}
          </button>
        )}
        {assignableUsers.map((u) => (
          <button
            key={u.id}
            onClick={() => navigate({ managerId: managerId === u.id ? undefined : u.id, attention: undefined })}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
              managerId === u.id ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/40"
            )}
          >
            {u.name}
          </button>
        ))}
      </div>
    </div>
  );
}
