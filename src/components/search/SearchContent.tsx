"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { SearchX } from "lucide-react";
import type { Product } from "@/types";

export default function SearchContent() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    fetch("/api/products")
      .then((r) => r.json())
      .then((all: Product[]) => {
        const lower = q.toLowerCase();
        setResults(
          all.filter(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              p.description.toLowerCase().includes(lower) ||
              p.tags.some((t) => t.toLowerCase().includes(lower))
          )
        );
      });
  }, [q]);

  return (
    <div className="container-content py-8">
      <h1 className="font-display font-bold text-2xl text-text mb-2">
        {q ? `Поиск по «${q}»` : "Поиск"}
      </h1>
      <p className="text-text-muted text-sm mb-8">Найдено результатов: {results.length}</p>

      {results.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4 mx-auto">
            <SearchX size={28} strokeWidth={1.5} className="text-text-muted" />
          </div>
          <p className="font-semibold text-text mb-2">Ничего не найдено</p>
          <p className="text-text-muted text-sm mb-6">Попробуйте другое слово</p>
          <Link href="/products" className="btn-primary inline-block px-6 py-2.5">
            Все товары
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
