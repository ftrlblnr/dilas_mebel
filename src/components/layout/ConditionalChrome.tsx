"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import SelectionDrawer from "./SelectionDrawer";
import FeedbackWidget from "./FeedbackWidget";
import type { NavCategory } from "@/lib/categories-server";

export default function ConditionalChrome({
  categories,
  children,
}: {
  categories: NavCategory[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMiniApp = pathname?.startsWith("/miniapp");
  const isPublicQuote = pathname?.startsWith("/q/");
  const isCrm = pathname?.startsWith("/crm");
  const isAdmin = pathname?.startsWith("/admin");

  if (isMiniApp || isPublicQuote || isCrm || isAdmin) return <>{children}</>;

  return (
    <>
      <Header categories={categories} />
      <main className="pt-[70px] min-h-screen">{children}</main>
      <Footer categories={categories} />
      <SelectionDrawer />
      <FeedbackWidget />
    </>
  );
}
