import Script from "next/script";
import { auth } from "@/lib/auth";
import TelegramWebAppInit from "@/components/crm/TelegramWebAppInit";
import Sidebar from "@/components/crm/Sidebar";

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
    <div className="flex min-h-screen bg-surface">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramWebAppInit />
      <Sidebar name={session.user.name ?? "Вы"} isAdmin={isAdmin} />
      <main className="flex-1 container-content py-8 min-w-0">{children}</main>
    </div>
  );
}
