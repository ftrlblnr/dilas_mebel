import type { Metadata } from "next";
import "./globals.css";
import ConditionalChrome from "@/components/layout/ConditionalChrome";
import ToastProvider from "@/components/providers/ToastProvider";
import { readCategories } from "@/lib/categories-server";

export const metadata: Metadata = {
  title: {
    default: "Dilas Мебель — Качественная мебель",
    template: "%s | Dilas Мебель",
  },
  description: "Лучший мебельный магазин в Казахстане. Диваны, кровати, обеденные столы и многое другое. Бесплатная доставка от 150 000 ₸.",
  keywords: ["мебель", "диван", "кровать", "Астана", "Алматы", "Казахстан"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg",    type: "image/svg+xml" },
    ],
    apple: "/apple-icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Dilas Мебель",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = readCategories();
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <ToastProvider>
          <ConditionalChrome categories={categories}>{children}</ConditionalChrome>
        </ToastProvider>
      </body>
    </html>
  );
}
