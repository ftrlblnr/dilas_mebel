"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, ZoomIn, Sliders, ClipboardList, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Product, CustomCriterion } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useSelectionStore } from "@/store/selectionStore";
import { useWishlistStore } from "@/store/wishlistStore";
import ProductCard from "./ProductCard";
import BoughtTogether from "./BoughtTogether";
import CustomizationPanel from "./CustomizationPanel";
import AcceptanceRulesModal from "./AcceptanceRulesModal";

export default function ProductDetailClient({ product, related, bundle }: { product: Product; related: Product[]; bundle: Product[] }) {
  const [mainImg, setMainImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [customCriteria, setCustomCriteria] = useState<CustomCriterion[] | null>(null);
  const [cardSelections, setCardSelections] = useState<Record<string, boolean>>({});
  const [showCustomization, setShowCustomization] = useState(false);
  const [showAcceptance, setShowAcceptance] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("specs");
  const [lightbox, setLightbox] = useState(false);

  const lightboxPrev = useCallback(() => setMainImg(i => (i - 1 + product.images.length) % product.images.length), [product.images.length]);
  const lightboxNext = useCallback(() => setMainImg(i => (i + 1) % product.images.length), [product.images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, lightboxPrev, lightboxNext]);
  const { addItem, openDrawer } = useSelectionStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  useEffect(() => {
    fetch(`/api/customizations/${product.id}`)
      .then((r) => r.json())
      .then((data: CustomCriterion[]) => setCustomCriteria(data.length > 0 ? data : null))
      .catch(() => setCustomCriteria(null));
  }, [product.id]);

  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const cardCriteria = (customCriteria ?? []).filter(
    (c) => c.type === "checkbox" && c.showInCard
  );
  const cardExtraPrice = cardCriteria.reduce(
    (sum, c) => sum + (cardSelections[c.id] ? (c.variants[0]?.price ?? 0) : 0),
    0
  );
  const basePrice = product.salePrice ?? product.price;
  const displayPrice = basePrice + cardExtraPrice;

  const handleAdd = () => {
    const productToAdd = cardExtraPrice > 0
      ? {
          ...product,
          ...(product.salePrice !== undefined
            ? { salePrice: product.salePrice + cardExtraPrice }
            : { price: product.price + cardExtraPrice }),
        }
      : product;
    for (let i = 0; i < quantity; i++) addItem(productToAdd);
    setAdded(true);
    openDrawer();
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="container-content py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6 flex-wrap">
        <Link href="/" className="hover:text-primary">Главная</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary">Товары</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-primary capitalize">
          {product.category.replace(/-/g, " ")}
        </Link>
        <span>/</span>
        <span className="text-text font-semibold truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Image Gallery */}
        <div>
          <div
            className="relative aspect-square rounded-xl overflow-hidden bg-surface mb-3 group cursor-zoom-in"
            onClick={() => setLightbox(true)}
          >
            <img
              src={product.images[mainImg]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-accent text-text font-bold text-sm px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={20} className="text-text" />
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImg(i)}
                  className={cn(
                    "w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                    mainImg === i ? "border-primary shadow-md" : "border-border hover:border-primary-light"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-xs text-text-muted mb-1">SKU: {product.sku}</p>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mb-3 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6 p-4 bg-surface rounded-xl">
            <span className="font-display font-extrabold text-3xl text-primary">
              {formatPrice(displayPrice)}
            </span>
            {product.salePrice && (
              <>
                <span className="text-lg text-text-muted line-through">{formatPrice(product.price)}</span>
                <span className="bg-accent text-text text-sm font-bold px-2 py-0.5 rounded">-{discount}%</span>
              </>
            )}
          </div>

          <p className="text-sm text-green-600 font-semibold mb-6">
            {product.inStock ? "В наличии и под заказ" : "Под заказ"}
          </p>

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-text mb-2">Количество</p>
            <div className="flex items-center gap-0 border border-border rounded-lg w-fit overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2.5 hover:bg-surface transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="px-5 py-2.5 font-bold text-text border-x border-border text-base">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2.5 hover:bg-surface transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Card options (checkbox criteria with showInCard) */}
          {cardCriteria.length > 0 && (
            <div className="mb-6 space-y-3">
              {cardCriteria.map((c) => {
                const isYes = !!cardSelections[c.id];
                const outOfStock = c.variants[0]?.inStock === false;
                return (
                  <label key={c.id} className={cn("flex items-center justify-between", outOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}>
                    <p className="text-sm font-semibold text-text">
                      {c.name}
                      {outOfStock && <span className="ml-2 text-xs font-semibold text-red-500">Нет в наличии</span>}
                    </p>
                    <button
                      role="switch"
                      aria-checked={isYes}
                      disabled={outOfStock}
                      onClick={() => !outOfStock && setCardSelections((p) => ({ ...p, [c.id]: !p[c.id] }))}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
                        isYes && !outOfStock ? "bg-primary" : "bg-gray-200"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                        isYes && !outOfStock ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                  </label>
                );
              })}
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleAdd}
              className={cn(
                "btn-primary py-4 text-base flex items-center justify-center gap-2 flex-1",
                added && "bg-green-600"
              )}
            >
              {added ? "✓ Добавлено в список!" : "Добавить в список"}
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className={cn(
                "px-4 py-4 rounded-lg border-2 transition-all flex items-center justify-center",
                wishlisted
                  ? "border-red-400 bg-red-50 text-red-500"
                  : "border-border hover:border-red-300 text-text-muted hover:text-red-400"
              )}
              aria-label="Добавить в избранное"
            >
              <Heart size={20} className={wishlisted ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>

          {customCriteria && (
            <button
              onClick={() => setShowCustomization(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3.5 rounded-lg hover:bg-primary hover:text-white transition-all"
            >
              <Sliders size={18} />
              Индивидуальный заказ
            </button>
          )}

          {/* Правила приёмки */}
          <button
            onClick={() => setShowAcceptance(true)}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-500 text-sm py-2.5 rounded-lg hover:border-slate-400 hover:text-slate-700 transition-all"
          >
            <ClipboardList size={15} />
            Правила приёмки мебели
          </button>

        </div>
      </div>

      {/* Описание / Характеристика — табы */}
      <div className="mb-16">
        {customCriteria && customCriteria.length > 0 ? (
          <>
            <div className="flex border-b border-border mb-6">
              {(["specs", "description"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-text-muted hover:text-text"
                  }`}
                >
                  {tab === "description" ? "Описание" : "Характеристика"}
                </button>
              ))}
            </div>
            {activeTab === "description" && (
              <div>
                <p className="text-sm text-text-muted whitespace-pre-line leading-relaxed">{product.description}</p>
                {product.material && <p className="text-sm text-text-muted mt-3"><strong className="text-text">Материал:</strong> {product.material}</p>}
                {product.style && <p className="text-sm text-text-muted mt-1"><strong className="text-text">Стиль:</strong> {product.style}</p>}
              </div>
            )}
            {activeTab === "specs" && (
              <div className="max-w-sm space-y-2">
                {customCriteria.map((c) => {
                  let defaultLabel: string;
                  if (c.type === "checkbox") {
                    defaultLabel = c.defaultValue === "yes" ? "Да" : "Нет";
                  } else if (c.type === "cascading") {
                    const root = c.variants.find((v) => v.id === c.cascadeDefault?.["0"]);
                    if (!root) {
                      defaultLabel = "—";
                    } else {
                      const parts = [root.label];
                      (c.cascadeLevels ?? []).slice(1).forEach((_, idx) => {
                        const li = String(idx + 1);
                        const child = (root.levelChildren?.[li] ?? []).find((ch) => ch.id === c.cascadeDefault?.[li]);
                        if (child) parts.push(child.label);
                      });
                      defaultLabel = parts.join(" → ");
                    }
                  } else {
                    defaultLabel = c.variants.find((v) => v.id === c.defaultValue)?.label ?? "—";
                  }
                  return (
                    <div key={c.id} className="flex items-baseline gap-1.5">
                      <span className="text-sm text-text-muted shrink-0">{c.name}</span>
                      <span className="flex-1 border-b border-dotted border-gray-300 mb-0.5" />
                      <span className="text-sm text-text font-medium shrink-0">{defaultLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div>
            <h2 className="font-display font-bold text-lg text-text mb-4">Описание</h2>
            <p className="text-sm text-text-muted whitespace-pre-line leading-relaxed">{product.description}</p>
            {product.material && <p className="text-sm text-text-muted mt-3"><strong className="text-text">Материал:</strong> {product.material}</p>}
            {product.style && <p className="text-sm text-text-muted mt-1"><strong className="text-text">Стиль:</strong> {product.style}</p>}
          </div>
        )}
      </div>

      {/* Bought Together */}
      <BoughtTogether current={product} bundle={bundle} />

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xl text-text mb-6">Похожие товары</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {showCustomization && customCriteria && (
        <CustomizationPanel
          productId={product.id}
          productName={product.name}
          criteria={customCriteria}
          onClose={() => setShowCustomization(false)}
        />
      )}

      {showAcceptance && (
        <AcceptanceRulesModal onClose={() => setShowAcceptance(false)} />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Закрыть */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            onClick={() => setLightbox(false)}
            aria-label="Закрыть"
          >
            <X size={28} />
          </button>

          {/* Счётчик */}
          {product.images.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
              {mainImg + 1} / {product.images.length}
            </div>
          )}

          {/* Стрелка влево */}
          {product.images.length > 1 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
              aria-label="Предыдущее"
            >
              <ChevronLeft size={40} />
            </button>
          )}

          {/* Изображение */}
          <img
            src={product.images[mainImg]}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Стрелка вправо */}
          {product.images.length > 1 && (
            <button
              className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
              aria-label="Следующее"
            >
              <ChevronRight size={40} />
            </button>
          )}

          {/* Миниатюры */}
          {product.images.length > 1 && (
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImg(i)}
                  className={cn(
                    "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                    mainImg === i ? "border-white" : "border-white/30 hover:border-white/60"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

