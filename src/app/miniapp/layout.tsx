import Script from "next/script";
import TelegramApp from "@/components/miniapp/TelegramApp";
import "./miniapp.css";

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramApp />
      {children}
    </>
  );
}
