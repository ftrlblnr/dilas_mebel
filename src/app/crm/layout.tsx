import Link from "next/link";
import Script from "next/script";
import { LogOut, ClipboardList, Users, Settings, LayoutDashboard, CalendarCheck, MessageCircle } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import TelegramWebAppInit from "@/components/crm/TelegramWebAppInit";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramWebAppInit />
        {children}
      </>
    );
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-surface">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramWebAppInit />
      <header className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-primary font-display font-extrabold text-sm">D</span>
          </div>
          <div>
            <span className="font-display font-bold text-base">DILAS</span>
            <span className="text-blue-200 text-xs ml-2">CRM</span>
          </div>
          <nav className="flex items-center gap-1 ml-6">
            <Link href="/crm/today" className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <CalendarCheck size={15} /> Сегодня
            </Link>
            <Link href="/crm" className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ClipboardList size={15} /> Заявки
            </Link>
            <Link href="/crm/dashboard" className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <LayoutDashboard size={15} /> Дашборд
            </Link>
            <Link href="/crm/messages" className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <MessageCircle size={15} /> Переписки
            </Link>
            {isAdmin && (
              <Link href="/crm/users" className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <Users size={15} /> Менеджеры
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/crm/account" className="flex items-center gap-1.5 text-blue-200 text-xs hover:text-white transition-colors">
            <Settings size={13} /> {session.user.name} · {isAdmin ? "админ" : "менеджер"}
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/crm/login" });
            }}
          >
            <button type="submit" className="flex items-center gap-1.5 text-blue-200 text-sm hover:text-white transition-colors">
              <LogOut size={14} /> Выйти
            </button>
          </form>
        </div>
      </header>
      <div className="container-content py-8">{children}</div>
    </div>
  );
}
