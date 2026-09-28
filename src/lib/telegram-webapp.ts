"use client";
import { useEffect } from "react";

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramMainButton {
  text: string;
  isVisible: boolean;
  isActive: boolean;
  setText: (text: string) => void;
  onClick: (fn: () => void) => void;
  offClick: (fn: () => void) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
}

export interface TelegramBackButton {
  isVisible: boolean;
  onClick: (fn: () => void) => void;
  offClick: (fn: () => void) => void;
  show: () => void;
  hide: () => void;
}

export interface TelegramHapticFeedback {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notificationOccurred: (type: "error" | "success" | "warning") => void;
  selectionChanged: () => void;
}

export interface TelegramWebAppApi {
  ready: () => void;
  expand: () => void;
  initData: string;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  MainButton: TelegramMainButton;
  BackButton: TelegramBackButton;
  HapticFeedback: TelegramHapticFeedback;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebAppApi };
  }
}

export function getTelegramWebApp(): TelegramWebAppApi | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

/** Fire-and-forget: links this device's Telegram account to the signed-in CRM user, if opened inside Telegram. */
export function linkTelegramAccountFromWebApp() {
  const initData = getTelegramWebApp()?.initData;
  if (!initData) return;
  fetch("/api/crm/me/telegram-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  }).catch(() => {});
}

export function useTelegramBackButton(onBack?: () => void) {
  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp || !onBack) return;
    webApp.BackButton.onClick(onBack);
    webApp.BackButton.show();
    return () => {
      webApp.BackButton.offClick(onBack);
      webApp.BackButton.hide();
    };
  }, [onBack]);
}

export function useTelegramMainButton(opts: {
  text: string;
  onClick: () => void;
  visible?: boolean;
  disabled?: boolean;
}) {
  const { text, onClick, visible = true, disabled = false } = opts;
  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    const btn = webApp.MainButton;
    btn.setText(text);
    if (disabled) btn.disable();
    else btn.enable();
    if (visible) btn.show();
    else btn.hide();
    btn.onClick(onClick);
    return () => {
      btn.offClick(onClick);
      btn.hide();
    };
  }, [text, onClick, visible, disabled]);
}

export function hapticImpact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
  getTelegramWebApp()?.HapticFeedback.impactOccurred(style);
}

export function hapticNotification(type: "error" | "success" | "warning") {
  getTelegramWebApp()?.HapticFeedback.notificationOccurred(type);
}

export function openExternalLink(url: string) {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
