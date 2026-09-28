"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Plus, ArrowRight } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useSelectionStore } from "@/store/selectionStore";

export default function BoughtTogether({ current, bundle }: { current: Product; bundle: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(bundle.map((p) => p.id)));
  const [added, setAdded] = useState(false);
  const { addItem, openDrawer } = useSelectionStore();

  if (bundle.length === 0) return null;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedProducts = [current, ...bundle.filter((p) => selected.has(p.id))];
  const total = selectedProducts.reduce((sum, p) => sum + (p.salePrice ?? p.price), 0);

  const handleAddAll = () => {
    for (const p of selectedProducts) addItem(p);
    setAdded(true);
    openDrawer();
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mb-16">
      <h2 className="font-display font-bold text-xl text-text mb-6">Покупают вместе</h2>

      <div className="bg-surface rounded-2xl p-5 border border-border">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Current product — always selected */}
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 border-2 border-primary shadow-sm min-w-0">
            <img
              src={current.images[0]}
              alt={current.name}
              className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-text-muted mb-0.5">Текущий товар</p>
              <p className="font-semibold text-text text-sm leading-tight line-clamp-2">{current.name}</p>
              <p className="font-bold text-primary text-sm mt-1">{formatPrice(current.salePrice ?? current.price)}</p>
            </div>
          </div>

          {bundle.map((product) => (
            <div key={product.id} className="flex items-center gap-2">
              <Plus size={18} className="text-text-muted flex-shrink-0" />
              <button
                onClick={() => toggleSelect(product.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 border-2 transition-all text-left min-w-0",
                  selected.has(product.id)
                    ? "border-primary bg-white shadow-sm"
                    : "border-border bg-white/50 opacity-60"
                )}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div className={cn(
                    "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold transition-colors",
                    selected.has(product.id) ? "bg-primary text-white" : "bg-border text-transparent"
                  )}>
                    ✓
                  </div>
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/products/${product.slug || product.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-text text-sm leading-tight line-clamp-2 hover:text-primary transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="font-bold text-primary text-sm mt-1">{formatPrice(product.salePrice ?? product.price)}</p>
                </div>
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-text-muted">
              {selectedProducts.length} {selectedProducts.length === 1 ? "товар" : "товара"} в наборе
            </p>
            <p className="font-display font-extrabold text-2xl text-primary">{formatPrice(total)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddAll}
              disabled={selectedProducts.length === 1}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all",
                added
                  ? "bg-green-600 text-white"
                  : selectedProducts.length > 1
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-border text-text-muted cursor-not-allowed"
              )}
            >
              <ShoppingBag size={16} />
              {added ? "Добавлено ✓" : "Добавить набор в список"}
            </button>
            {bundle.length > 0 && (
              <Link
                href={`/products/${bundle[0].slug || bundle[0].id}`}
                className="flex items-center gap-1.5 px-4 py-3 rounded-lg border border-border text-text-muted text-sm hover:border-primary hover:text-primary transition-all"
              >
                Смотреть <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
