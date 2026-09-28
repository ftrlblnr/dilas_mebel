import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  // Manual grouping instead of Intl.NumberFormat("kk-KZ", ...): Node's ICU and
  // the browser's ICU can pick different grouping-separator characters (e.g.
  // regular space vs narrow no-break space) for this locale, which causes a
  // React hydration text mismatch on every page load.
  const rounded = Math.round(price);
  const sign = rounded < 0 ? "-" : "";
  const grouped = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${grouped} ₸`;
}

export function generateRefNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `#DLS-${num}`;
}

/**
 * Нормализует номер телефона к 10 "национальным" цифрам без кода страны
 * (независимо от того, ввёл ли пользователь +7, 8 или голые 10 цифр), чтобы
 * ссылки вида tel:+7... / wa.me/7... не задваивали код страны.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    digits = digits.slice(1);
  }
  return digits.slice(-10);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
