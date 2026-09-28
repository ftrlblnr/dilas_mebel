"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export default function SearchBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(() => {
      fetch("/api/products")
        .then((r) => r.json())
        .then((all: Product[]) => {
          const lower = query.toLowerCase();
          setResults(
            all
              .filter(
                (p) =>
                  p.name.toLowerCase().includes(lower) ||
                  p.description.toLowerCase().includes(lower) ||
                  p.tags.some((t) => t.toLowerCase().includes(lower))
              )
              .slice(0, 5)
          );
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  return (
    <div className="border-t border-border bg-white shadow-lg">
      <div className="container-content py-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-3 border-2 border-primary rounded-lg px-4 py-2.5">
            <Search size={18} className="text-primary flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск мебели..."
              className="flex-1 text-sm outline-none text-text placeholder-text-muted"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-text-muted hover:text-text">
                <X size={16} />
              </button>
            )}
          </div>
        </form>
        {results.length > 0 && (
          <div className="mt-2 bg-white border border-border rounded-lg overflow-hidden shadow-card">
            {results.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors border-b border-surface last:border-0"
              >
                <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{p.name}</p>
                  <p className="text-xs text-text-muted">{formatPrice(p.salePrice ?? p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
