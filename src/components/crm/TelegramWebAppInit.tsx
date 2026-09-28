"use client";
import { useEffect } from "react";
import { getTelegramWebApp } from "@/lib/telegram-webapp";

export default function TelegramWebAppInit() {
  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
  }, []);

  return null;
}
