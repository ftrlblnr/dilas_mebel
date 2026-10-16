"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ClipboardList, MessageCircle, Users2, ListChecks, LayoutDashboard, Users, GitBranch, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof CalendarCheck;
}

const MAIN_ITEMS: NavItem[] = [
  { href: "/crm/today", label: "Сегодня", icon: CalendarCheck },
  { href: "/crm", label: "Заказы", icon: ClipboardList },
  { href: "/crm/messages", label: "Переписки", icon: MessageCircle },
  { href: "/crm/customers", label: "Клиенты", icon: Users2 },
  { href: "/crm/today", label: "Задачи", icon: ListChecks },
  { href: "/crm/dashboard", label: "Аналитика", icon: LayoutDashboard },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/crm/users", label: "Сотрудники", icon: Users },
  { href: "/crm/stages", label: "Этапы", icon: GitBranch },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function Sidebar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/crm" ? pathname === "/crm" : pathname?.startsWith(href);
  }

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
          active ? "bg-primary text-white" : "text-blue-100 hover:bg-white/10"
        )}
      >
        <Icon size={16} /> {item.label}
      </Link>
    );
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0E1B33] text-white flex flex-col min-h-screen px-3 py-4">
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-display font-extrabold text-sm">D</span>
        </div>
        <div>
          <span className="font-display font-bold text-sm block">DILAS</span>
          <span className="text-blue-200 text-xs">CRM</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1">{MAIN_ITEMS.map(renderItem)}</nav>

      {isAdmin && (
        <>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider px-3 mt-6 mb-1">Администратор</p>
          <nav className="flex flex-col gap-1">{ADMIN_ITEMS.map(renderItem)}</nav>
        </>
      )}

      <div className="mt-auto flex items-center gap-2 px-2 pt-4 border-t border-white/10">
        <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-xs text-blue-300">{isAdmin ? "Полный доступ" : "Менеджер"}</p>
        </div>
        <Link href="/crm/account" className="text-blue-300 hover:text-white p-1.5" title="Настройки">
          <Settings size={14} />
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/crm/login" })} className="text-blue-300 hover:text-white p-1.5" title="Выйти">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
