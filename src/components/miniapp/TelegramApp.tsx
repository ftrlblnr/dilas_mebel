"use client";
import { useEffect } from "react";
import { getTelegramWebApp, type TelegramThemeParams } from "@/lib/telegram-webapp";

const CSS_VAR_MAP: Record<keyof TelegramThemeParams, string> = {
  bg_color: "--tg-bg",
  text_color: "--tg-text",
  hint_color: "--tg-hint",
  link_color: "--tg-link",
  button_color: "--tg-button",
  button_text_color: "--tg-button-text",
  secondary_bg_color: "--tg-secondary-bg",
};

function applyTheme() {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  const root = document.documentElement;
  for (const key of Object.keys(CSS_VAR_MAP) as (keyof TelegramThemeParams)[]) {
    const value = webApp.themeParams[key];
    if (value) root.style.setProperty(CSS_VAR_MAP[key], value);
  }
}

export default function TelegramApp() {
  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
    applyTheme();
    webApp.setHeaderColor?.(webApp.themeParams.bg_color ?? "#ffffff");
    webApp.onEvent("themeChanged", applyTheme);
    return () => webApp.offEvent("themeChanged", applyTheme);
  }, []);

  return null;
}
