"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Grid3X3, List, X, SearchX } from "lucide-react";
import type { NavCategory } from "@/lib/categories-server";
import ProductCard from "./ProductCard";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Product } from "@/types";

const SORT_OPTIONS = [
  { value: "featured", label: "Рекомендуемые" },
  { value: "price-asc", label: "Цена: по возрастанию" },
  { value: "price-desc", label: "Цена: по убыванию" },
  { value: "newest", label: "Новинки" },
];

export default function ProductListingContent({ products, categories }: { products: Product[]; categories: NavCategory[] }) {
  const params = useSearchParams();
  const categoryParam = params.get("category") || "";
  const filterParam = params.get("filter") || "";

  const [sort, setSort] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const categoryInfo = categories.find((c) => c.slug === categoryParam);

  const styles = [...new Set(products.map((p) => p.style).filter(Boolean))] as string[];

  const filtered = useMemo(() => {
    let list = [...products];

    if (categoryParam === "sale") {
      list = list.filter((p) => p.salePrice);
    } else if (categoryParam) {
      list = list.filter((p) => p.category === categoryParam || p.subcategory === categoryParam);
    }

    if (filterParam === "new") {
      list = list.filter((p) => p.isNew);
    }

    list = list.filter(
      (p) => (p.salePrice ?? p.price) >= priceRange[0] && (p.salePrice ?? p.price) <= priceRange[1]
    );

    if (selectedStyles.length > 0) {
      list = list.filter((p) => p.style && selectedStyles.includes(p.style));
    }

    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case "price-desc":
        list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case "newest":
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return list;
  }, [categoryParam, filterParam, sort, priceRange, selectedStyles, inStockOnly]);

  return (
    <div className="container-content py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary transition-colors">Товары</Link>
        {categoryInfo && (
          <>
            <span>/</span>
            <span className="text-text font-semibold">{categoryInfo.labelEn}</span>
          </>
        )}
      </nav>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside
          className={cn(
            "w-64 flex-shrink-0 hidden lg:block",
            filtersOpen && "fixed inset-0 z-50 bg-white p-6 lg:relative lg:p-0 overflow-y-auto"
          )}
        >
          {filtersOpen && (
            <button
              className="lg:hidden flex items-center gap-2 mb-4 text-text-muted"
              onClick={() => setFiltersOpen(false)}
            >
              <X size={20} /> Закрыть
            </button>
          )}

          <div className="card p-5 space-y-6">
            <div>
              <h3 className="font-display font-bold text-sm text-text mb-3 uppercase tracking-wide">Цена ₸</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={5000}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>0 ₸</span>
                  <span>{priceRange[1].toLocaleString()} ₸</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-sm text-text mb-3 uppercase tracking-wide">Стиль</h3>
              <div className="space-y-2">
                {styles.map((style) => (
                  <label key={style} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStyles.includes(style)}
                      onChange={() =>
                        setSelectedStyles((prev) =>
                          prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
                        )
                      }
                      className="accent-primary"
                    />
                    <span className="text-sm text-text-muted">{style}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={() => setInStockOnly(!inStockOnly)}
                className="accent-primary"
              />
              <span className="text-sm font-semibold text-text">Только в наличии</span>
            </label>

            <button
              onClick={() => { setPriceRange([0, 500000]); setSelectedStyles([]); setInStockOnly(false); }}
              className="text-xs text-primary hover:text-primary-dark font-semibold"
            >
              Сбросить фильтры
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-xl md:text-2xl text-text">
                {categoryInfo ? categoryInfo.labelEn : "Все товары"}
              </h1>
              <p className="text-text-muted text-sm">{filtered.length} товаров</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden btn-secondary py-2 px-3 flex items-center gap-1.5 text-xs"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal size={15} /> Фильтр
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input-field py-2 text-xs w-auto"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="hidden md:flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn("p-2", viewMode === "grid" ? "bg-primary text-white" : "text-text-muted hover:bg-surface")}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn("p-2", viewMode === "list" ? "bg-primary text-white" : "text-text-muted hover:bg-surface")}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4 mx-auto">
                <SearchX size={28} strokeWidth={1.5} className="text-text-muted" />
              </div>
              <p className="text-text-muted">Товары не найдены</p>
              <Link href="/products" className="btn-primary inline-block mt-4 px-6 py-2.5">Смотреть все</Link>
            </div>
          ) : (
            <div className={cn(
              "grid gap-6",
              viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
