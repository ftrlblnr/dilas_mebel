"use client";
import { useState, useEffect } from "react";
import { X, Search, Link2, RefreshCw } from "lucide-react";
import type { Product, BundleEntry } from "@/types";
import { formatPrice, cn } from "@/lib/utils";

const ADMIN_PASSWORD = "dilas2024";

interface Props {
  product: Product;
  allProducts: Product[];
  onClose: () => void;
}

export default function BundleModal({ product, allProducts, onClose }: Props) {
  const [bundle, setBundle] = useState<BundleEntry>({ manual: [], auto: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/bundle/${product.id}`)
      .then((r) => r.json())
      .then((data: BundleEntry) => { setBundle(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [product.id]);

  const toggleManual = (id: string) => {
    setBundle((prev) => ({
      ...prev,
      manual: prev.manual.includes(id)
        ? prev.manual.filter((x) => x !== id)
        : [...prev.manual, id],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/bundle/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ manual: bundle.manual }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await fetch("/api/bundle/recalculate", {
        method: "POST",
        headers: { Authorization: `Bearer ${ADMIN_PASSWORD}` },
      });
      const res = await fetch(`/api/bundle/${product.id}`);
      setBundle(await res.json());
    } finally {
      setRecalculating(false);
    }
  };

  const candidates = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      (search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-base text-text">Покупают вместе</h2>
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-xs">{product.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              title="Пересчитать авто-рекомендации по истории заказов"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              <RefreshCw size={13} className={recalculating ? "animate-spin" : ""} />
              Пересчитать авто
            </button>
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">Загрузка...</div>
        ) : (
          <>
            {/* Auto recommendations */}
            {bundle.auto.length > 0 && (
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <RefreshCw size={11} /> Авто (из заказов)
                </p>
                <div className="flex flex-wrap gap-2">
                  {bundle.auto.map((id) => {
                    const p = allProducts.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <span key={id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                        <img src={p.images[0]} alt="" className="w-4 h-4 object-cover rounded" />
                        {p.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manual selection */}
            <div className="px-5 pt-3 pb-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link2 size={11} /> Ручные связки ({bundle.manual.length} выбрано)
              </p>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск товара..."
                  className="input-field pl-8 py-2 text-sm"
                />
              </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto px-5 pb-2">
              <div className="space-y-1.5">
                {candidates.map((p) => {
                  const isSelected = bundle.manual.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleManual(p.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                        isSelected
                          ? "border-primary bg-blue-50"
                          : "border-border hover:border-primary/40 hover:bg-surface"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 text-xs font-bold transition-colors",
                        isSelected ? "bg-primary border-primary text-white" : "border-border"
                      )}>
                        {isSelected && "✓"}
                      </div>
                      <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text truncate">{p.name}</p>
                        <p className="text-xs text-text-muted">{p.sku}</p>
                      </div>
                      <span className="text-sm font-bold text-primary flex-shrink-0">
                        {formatPrice(p.salePrice ?? p.price)}
                      </span>
                    </button>
                  );
                })}
                {candidates.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-6">Товары не найдены</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border flex items-center justify-between gap-3">
              <p className="text-sm text-text-muted">{bundle.manual.length} товаров выбрано вручную</p>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors">
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary px-5 py-2 text-sm"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
