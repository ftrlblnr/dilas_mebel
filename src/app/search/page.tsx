import { Suspense } from "react";
import SearchContent from "@/components/search/SearchContent";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Результаты поиска" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-content py-20 text-center text-text-muted">Поиск...</div>}>
      <SearchContent />
    </Suspense>
  );
}
