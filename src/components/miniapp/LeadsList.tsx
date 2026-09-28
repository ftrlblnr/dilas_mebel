"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Phone, ShoppingBag, Settings2, ChevronRight, Inbox, X } from "lucide-react";
import type { LeadStatus, LeadSource } from "@prisma/client";
import { STATUS_LABEL, STATUS_OPTIONS } from "@/lib/lead-labels";

const SOURCE_ICON: Record<LeadSource, typeof Phone> = {
  CALLBACK: ShoppingBag,
  QUICK_CALLBACK: Phone,
  CUSTOM_ORDER: Settings2,
};
import type { MiniLead, AssignableUser } from "@/lib/miniapp-types";
import { linkTelegramAccountFromWebApp } from "@/lib/telegram-webapp";

const PAGE_SIZE = 20;

function formatLeadTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function SkeletonRow() {
  return (
    <div className="ma-skeleton-row">
      <div className="ma-skeleton-block" style={{ width: 44, height: 44, borderRadius: 999 }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="ma-skeleton-block" style={{ width: "60%", height: 13 }} />
        <div className="ma-skeleton-block" style={{ width: "40%", height: 11 }} />
      </div>
    </div>
  );
}

export default function LeadsList({ currentUserId, currentUserRole }: { currentUserId: string; currentUserRole?: string }) {
  const [status, setStatus] = useState<LeadStatus | "ALL">("ALL");
  const [assignee, setAssignee] = useState<string>("ALL");
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<MiniLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLeads = useCallback(
    async (targetPage: number, replace: boolean) => {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (status !== "ALL") params.set("status", status);
      if (assignee !== "ALL") params.set("assignedToId", assignee);
      if (search.trim()) params.set("search", search.trim());
      if (replace) setLoading(true);
      else setLoadingMore(true);
      const res = await fetch(`/api/crm/leads?${params.toString()}`);
      const data = await res.json();
      setLeads((prev) => (replace ? data.leads : [...prev, ...data.leads]));
      setTotal(data.total);
      setLoading(false);
      setLoadingMore(false);
    },
    [status, assignee, search]
  );

  useEffect(() => {
    fetchLeads(1, true);
  }, [fetchLeads]);

  useEffect(() => {
    linkTelegramAccountFromWebApp();
    fetch("/api/crm/users/assignable")
      .then((r) => r.json())
      .then(setUsers);
  }, []);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 400);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }

  const currentPage = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));
  const hasMore = leads.length < total;

  return (
    <div className="ma-screen">
      <div className="ma-appbar">
        <span className="ma-appbar-title">Заявки</span>
        {!loading && <span className="ma-appbar-count">{total}</span>}
      </div>

      <div className="ma-topbar">
        <div className="ma-search-wrap">
          <Search size={16} className="ma-search-icon" />
          <input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Имя, телефон, номер заявки"
            className="ma-search-input"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch} className="ma-search-clear" aria-label="Очистить">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="ma-chips">
          <button
            className={`ma-chip ${status === "ALL" ? "ma-chip-active" : ""}`}
            onClick={() => setStatus("ALL")}
          >
            Все
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`ma-chip ${status === s ? "ma-chip-active" : ""}`}
              onClick={() => setStatus(s)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="ma-chips">
          {currentUserRole === "ADMIN" && (
            <button
              className={`ma-chip ${assignee === "ALL" ? "ma-chip-active" : ""}`}
              onClick={() => setAssignee("ALL")}
            >
              Все ответственные
            </button>
          )}
          {currentUserId && (
            <button
              className={`ma-chip ${assignee === currentUserId ? "ma-chip-active" : ""}`}
              onClick={() => setAssignee(currentUserId)}
            >
              Мои
            </button>
          )}
          <button
            className={`ma-chip ${assignee === "unassigned" ? "ma-chip-active" : ""}`}
            onClick={() => setAssignee("unassigned")}
          >
            Не назначено
          </button>
          {currentUserRole === "ADMIN" &&
            users.filter((u) => u.id !== currentUserId).map((u) => (
              <button
                key={u.id}
                className={`ma-chip ${assignee === u.id ? "ma-chip-active" : ""}`}
                onClick={() => setAssignee(u.id)}
              >
                {u.name}
              </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="ma-list">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="ma-empty">
          <div className="ma-empty-icon">
            <Inbox size={24} />
          </div>
          <p className="ma-text text-sm font-semibold">Заявок не найдено</p>
          <p className="ma-hint text-xs">Попробуйте изменить фильтр или запрос поиска</p>
        </div>
      ) : (
        <div className="ma-list">
          {leads.map((lead) => {
            const SourceIcon = SOURCE_ICON[lead.source];
            return (
              <Link key={lead.id} href={`/miniapp/leads/${lead.id}`} className="ma-row">
                <div className="ma-avatar ma-avatar-md">{initials(lead.fullName)}</div>
                <div className="ma-row-body">
                  <div className="flex items-center justify-between gap-2">
                    <span className="ma-row-title truncate">{lead.fullName}</span>
                    <span className={`ma-badge ma-badge-${lead.status} flex-shrink-0`}>{STATUS_LABEL[lead.status]}</span>
                  </div>
                  <div className="ma-row-sub flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className={`ma-badge ma-badge-source-${lead.source}`}>
                        <SourceIcon size={10} />
                      </span>
                      +7{lead.phone}
                    </span>
                    <span>{formatLeadTime(lead.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="ma-row-chevron" />
              </Link>
            );
          })}
          {hasMore && (
            <button
              className="ma-button-ghost mt-1"
              disabled={loadingMore}
              onClick={() => fetchLeads(currentPage + 1, false)}
            >
              {loadingMore ? "Загрузка..." : "Показать ещё"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
