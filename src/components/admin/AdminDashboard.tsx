"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Package, ClipboardList, Edit, Trash2, Plus, LogOut, Settings2, ImagePlay, Link2, Video, Save, CheckCircle2, LayoutGrid, Upload, X as XIcon, FolderTree } from "lucide-react";
import type { GalleryLayout } from "@/lib/settings-server";
import { formatPrice, cn } from "@/lib/utils";
import ProductFormModal from "@/components/admin/ProductFormModal";
import CustomizationModal from "@/components/admin/CustomizationModal";
import BundleModal from "@/components/admin/BundleModal";
import SlideFormModal from "@/components/admin/SlideFormModal";
import type { HeroSlide } from "@/components/admin/SlideFormModal";
import CategoriesManager from "@/components/admin/CategoriesManager";
import type { Product, CustomOrder } from "@/types";

interface CallbackRecord {
  refNumber: string;
  timestamp: string;
  fullName: string;
  phone: string;
  city: string;
  email: string;
  preferredTime: string;
  itemsCount: number;
  estimatedTotal: number;
  itemsSummary: string;
}

const TIME_SHORT: Record<string, string> = {
  morning: "Утром",
  afternoon: "Днём",
  evening: "Вечером",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "callbacks" | "custom-orders" | "slides" | "gallery" | "settings">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [callbacks, setCallbacks] = useState<CallbackRecord[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);

  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [bundlingProduct, setBundlingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Settings
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [ytSaving, setYtSaving] = useState(false);
  const [ytSaved, setYtSaved] = useState(false);

  useEffect(() => {
    if (activeTab === "settings") {
      fetch("/api/settings").then((r) => r.json()).then((d) => setYoutubeUrl(d.youtubeUrl ?? ""));
    }
  }, [activeTab]);

  // Gallery
  const [galleryLayout, setGalleryLayout] = useState<GalleryLayout>("grid-2rows");
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [galleryUploading, setGalleryUploading] = useState<number | null>(null);
  const [gallerySaving, setGallerySaving] = useState(false);
  const [gallerySaved, setGallerySaved] = useState(false);

  useEffect(() => {
    if (activeTab === "gallery") {
      fetch("/api/settings").then((r) => r.json()).then((d) => {
        if (d.gallery) {
          setGalleryLayout(d.gallery.layout ?? "grid-2rows");
          setGalleryPhotos(d.gallery.photos ?? [null, null, null, null, null, null]);
        }
      });
    }
  }, [activeTab]);

  const handleGalleryUpload = async (slot: number, file: File) => {
    setGalleryUploading(slot);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
          body: fd,
      });
      const data = await res.json();
      if (data.url) {
        setGalleryPhotos((prev) => {
          const next = [...prev];
          next[slot] = data.url;
          return next;
        });
      }
    } finally {
      setGalleryUploading(null);
    }
  };

  const handleGallerySave = async () => {
    setGallerySaving(true);
    setGallerySaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gallery: { layout: galleryLayout, photos: galleryPhotos } }),
      });
      setGallerySaved(true);
      setTimeout(() => setGallerySaved(false), 3000);
    } finally {
      setGallerySaving(false);
    }
  };

  const handleSaveYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    setYtSaving(true);
    setYtSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
      });
      setYtSaved(true);
      setTimeout(() => setYtSaved(false), 3000);
    } finally {
      setYtSaving(false);
    }
  };

  // Slides
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null | undefined>(undefined);
  const [deleteSlide, setDeleteSlide] = useState<HeroSlide | null>(null);
  const [deletingSlide, setDeletingSlide] = useState(false);

  const fetchSlides = useCallback(async () => {
    const res = await fetch("/api/slides");
    setSlides(await res.json());
  }, []);

  useEffect(() => {
    if (activeTab === "slides") fetchSlides();
  }, [activeTab, fetchSlides]);

  const handleDeleteSlide = async () => {
    if (!deleteSlide) return;
    setDeletingSlide(true);
    try {
      await fetch(`/api/slides/${deleteSlide.id}`, {
        method: "DELETE",
        });
      setDeleteSlide(null);
      fetchSlides();
    } finally {
      setDeletingSlide(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      setProducts(await res.json());
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "products") fetchProducts();
  }, [activeTab, fetchProducts]);

  useEffect(() => {
    if (activeTab === "callbacks") {
      try {
        const stored = localStorage.getItem("dilas-callbacks");
        if (stored) setCallbacks(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "custom-orders") {
      try {
        const stored = localStorage.getItem("dilas-custom-orders");
        if (stored) setCustomOrders(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, [activeTab]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
        });
      setDeleteTarget(null);
      fetchProducts();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-primary font-display font-extrabold text-sm">D</span>
          </div>
          <div>
            <span className="font-display font-bold text-base">DILAS</span>
            <span className="text-blue-200 text-xs ml-2">Панель управления</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-200 text-sm hover:text-white transition-colors">Перейти на сайт</Link>
          <button onClick={() => signOut({ callbackUrl: "/crm/login" })} className="flex items-center gap-1.5 text-blue-200 text-sm hover:text-white transition-colors">
            <LogOut size={14} /> Выйти
          </button>
        </div>
      </header>

      <div className="container-content py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: "products" as const, label: "Товары", icon: Package, count: products.length },
            { id: "categories" as const, label: "Разделы", icon: FolderTree, count: null },
            { id: "slides" as const, label: "Слайды", icon: ImagePlay, count: slides.length },
            { id: "gallery" as const, label: "Галерея", icon: LayoutGrid, count: null },
            { id: "callbacks" as const, label: "Заявки", icon: ClipboardList, count: callbacks.length },
            { id: "custom-orders" as const, label: "Инд. заказы", icon: Settings2, count: customOrders.length },
            { id: "settings" as const, label: "Настройки", icon: Video, count: null },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                activeTab === id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-text hover:bg-surface border border-border"
              )}
            >
              <Icon size={16} />
              {label}
              {count !== null && (
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", activeTab === id ? "bg-white/20 text-white" : "bg-surface text-text-muted")}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Products */}
        {activeTab === "products" && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-text">
                Все товары {!loadingProducts && `(${products.length})`}
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="flex items-center gap-1.5 btn-primary py-2 px-4 text-sm"
              >
                <Plus size={15} /> Добавить товар
              </button>
            </div>
            {loadingProducts ? (
              <div className="p-10 text-center text-text-muted text-sm">Загрузка...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Фото</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Название</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Категория</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Цена</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Со скидкой</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Наличие</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3">
                          <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-text">{product.name}</p>
                          <p className="text-text-muted text-xs">{product.sku}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="bg-surface border border-border text-text-muted text-xs px-2 py-0.5 rounded-full">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-text">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          {product.salePrice ? (
                            <span className="text-accent font-semibold">{formatPrice(product.salePrice)}</span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "text-xs font-semibold px-2 py-1 rounded-full",
                            product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                          )}>
                            {product.inStock ? "Есть" : "Нет"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              title="Параметры под заказ"
                              onClick={() => setCustomizingProduct(product)}
                              className="p-1.5 text-text-muted hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                            >
                              <Settings2 size={14} />
                            </button>
                            <button
                              title="Покупают вместе"
                              onClick={() => setBundlingProduct(product)}
                              className="p-1.5 text-text-muted hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                            >
                              <Link2 size={14} />
                            </button>
                            <button
                              title="Редактировать"
                              onClick={() => setEditingProduct(product)}
                              className="p-1.5 text-text-muted hover:text-primary hover:bg-surface rounded transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              title="Удалить"
                              onClick={() => setDeleteTarget(product)}
                              className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {activeTab === "categories" && <CategoriesManager />}

        {/* Slides */}
        {activeTab === "slides" && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-text">
                Слайды главной страницы ({slides.length})
              </h2>
              <button
                onClick={() => setEditingSlide(null)}
                className="flex items-center gap-1.5 btn-primary py-2 px-4 text-sm"
              >
                <Plus size={15} /> Добавить слайд
              </button>
            </div>
            <div className="divide-y divide-border">
              {slides.map((slide, idx) => (
                <div key={slide.id} className="flex items-center gap-4 p-4">
                  <span className="text-text-muted text-sm font-bold w-5 text-center">{idx + 1}</span>
                  <img src={slide.image} alt={slide.headline} className="w-24 h-14 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text text-sm truncate">{slide.headline}</p>
                    <p className="text-text-muted text-xs truncate">{slide.subtext}</p>
                    <p className="text-xs text-primary mt-0.5">{slide.cta} → {slide.ctaLink}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      title="Редактировать"
                      onClick={() => setEditingSlide(slide)}
                      className="p-1.5 text-text-muted hover:text-primary hover:bg-surface rounded transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      title="Удалить"
                      onClick={() => setDeleteSlide(slide)}
                      className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {slides.length === 0 && (
                <div className="p-10 text-center">
                  <ImagePlay size={36} className="text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted text-sm">Нет слайдов</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Callbacks */}
        {activeTab === "callbacks" && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-display font-bold text-base text-text">
                Заявки на обратный звонок ({callbacks.length})
              </h2>
            </div>
            {callbacks.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList size={36} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-muted text-sm">Нет поданных заявок</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">№ заявки</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Дата</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Имя</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Телефон</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Город</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Товаров</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {callbacks.map((cb) => (
                      <tr key={cb.refNumber} className="hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3"><span className="font-bold text-primary text-xs">{cb.refNumber}</span></td>
                        <td className="px-4 py-3 text-text-muted text-xs">
                          {new Date(cb.timestamp).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-text">{cb.fullName}</p>
                          <p className="text-text-muted text-xs">{TIME_SHORT[cb.preferredTime] || cb.preferredTime}</p>
                        </td>
                        <td className="px-4 py-3 text-text hidden md:table-cell">{cb.phone}</td>
                        <td className="px-4 py-3 text-text-muted hidden md:table-cell">{cb.city}</td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span className="bg-surface border border-border text-text text-xs px-2 py-0.5 rounded-full">{cb.itemsCount}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          {cb.estimatedTotal > 0 ? formatPrice(cb.estimatedTotal) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Custom Orders */}
        {activeTab === "custom-orders" && (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-display font-bold text-base text-text">
                Индивидуальные заказы ({customOrders.length})
              </h2>
            </div>
            {customOrders.length === 0 ? (
              <div className="p-10 text-center">
                <Settings2 size={36} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-muted text-sm">Нет индивидуальных заказов</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {customOrders.map((order) => (
                  <div key={order.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-bold text-primary text-xs">{order.id}</span>
                        <p className="font-semibold text-text mt-0.5">{order.fullName}</p>
                        <p className="text-text-muted text-xs">{order.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-primary">{formatPrice(order.totalPrice)}</p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {new Date(order.timestamp).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted mb-2 font-semibold">{order.productName}</p>
                    <div className="flex flex-wrap gap-2">
                      {order.selections.map((s) => (
                        <span key={s.criterionId} className="text-xs bg-surface border border-border px-2 py-1 rounded-full text-text">
                          {s.criterionName}: <strong>{s.variantLabel}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gallery */}
        {activeTab === "gallery" && (
          <div className="max-w-4xl space-y-6">
            {/* Layout selector */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="font-display font-bold text-base text-text">Лейаут галереи</h2>
                <p className="text-text-muted text-xs mt-0.5">Выберите способ расстановки 6 фотографий</p>
              </div>
              <div className="p-5 flex gap-3 flex-wrap">
                {(
                  [
                    {
                      id: "grid-2rows" as const,
                      label: "Сетка 3×2",
                      desc: "6 фото: 3 колонки, 2 ряда",
                      preview: (
                        <div className="grid grid-cols-3 gap-1 h-14">
                          {Array.from({ length: 6 }, (_, i) => (
                            <div key={i} className="bg-primary/40 rounded" />
                          ))}
                        </div>
                      ),
                    },
                    {
                      id: "featured" as const,
                      label: "Акцент",
                      desc: "5 фото: 4 малых слева + 1 большое справа",
                      preview: (
                        <div className="grid grid-cols-2 gap-1 h-14">
                          <div className="grid grid-cols-2 gap-1">
                            {Array.from({ length: 4 }, (_, i) => (
                              <div key={i} className="bg-primary/40 rounded aspect-square" />
                            ))}
                          </div>
                          <div className="bg-primary/60 rounded" />
                        </div>
                      ),
                    },
                  ] as const
                ).map(({ id, label, desc, preview }) => (
                  <button
                    key={id}
                    onClick={() => setGalleryLayout(id)}
                    className={cn(
                      "flex-1 min-w-[140px] border-2 rounded-xl p-3 text-left transition-all",
                      galleryLayout === id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {preview}
                    <div className="mt-2">
                      <div className="text-sm font-semibold text-text">{label}</div>
                      <div className="text-xs text-text-muted">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo slots */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="font-display font-bold text-base text-text">Фотографии</h2>
                <p className="text-text-muted text-xs mt-0.5">Нажмите на ячейку, чтобы загрузить или заменить фото</p>
              </div>
              <div className="p-5">
                <GalleryAdminGrid
                  layout={galleryLayout}
                  photos={galleryPhotos}
                  uploading={galleryUploading}
                  onUpload={handleGalleryUpload}
                  onRemove={(slot) =>
                    setGalleryPhotos((prev) => {
                      const next = [...prev];
                      next[slot] = null;
                      return next;
                    })
                  }
                />
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleGallerySave}
                disabled={gallerySaving}
                className="flex items-center gap-2 btn-primary py-2.5 px-6 text-sm disabled:opacity-60"
              >
                {gallerySaving ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Сохранить галерею
              </button>
              {gallerySaved && (
                <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                  <CheckCircle2 size={16} /> Сохранено
                </span>
              )}
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="max-w-xl">
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video size={18} className="text-red-600" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-text">YouTube видео</h2>
                  <p className="text-text-muted text-xs mt-0.5">Отображается в нижней части главной страницы</p>
                </div>
              </div>
              <div className="p-5">
                <form onSubmit={handleSaveYoutube} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-text mb-1.5 block">
                      Ссылка на YouTube-видео
                    </label>
                    <input
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="input-field"
                    />
                    <p className="text-text-muted text-xs mt-1.5">
                      Поддерживаются форматы: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...
                    </p>
                  </div>

                  {youtubeUrl && (() => {
                    const m = youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
                    return m ? (
                      <div className="rounded-xl overflow-hidden border border-border">
                        <img
                          src={`https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`}
                          alt="Превью"
                          className="w-full object-cover"
                        />
                        <p className="text-xs text-text-muted px-3 py-2">ID видео: <code className="bg-surface px-1 rounded">{m[1]}</code></p>
                      </div>
                    ) : (
                      <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Ссылка не распознана. Проверьте формат.
                      </p>
                    );
                  })()}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={ytSaving}
                      className="flex items-center gap-2 btn-primary py-2.5 px-6 text-sm disabled:opacity-60"
                    >
                      {ytSaving ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Сохранить
                    </button>
                    {ytSaved && (
                      <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                        <CheckCircle2 size={16} /> Сохранено
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {youtubeUrl && (
              <p className="text-text-muted text-xs mt-3 text-center">
                После сохранения секция появится на{" "}
                <a href="/" target="_blank" className="text-primary hover:underline">главной странице</a>.
                При пустой ссылке секция скрыта.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Customization modal */}
      {customizingProduct && (
        <CustomizationModal
          productId={customizingProduct.id}
          productName={customizingProduct.name}
          allProducts={products}
          onClose={() => setCustomizingProduct(null)}
        />
      )}

      {/* Bundle modal */}
      {bundlingProduct && (
        <BundleModal
          product={bundlingProduct}
          allProducts={products}
          onClose={() => setBundlingProduct(null)}
        />
      )}

      {/* Slide modal */}
      {editingSlide !== undefined && (
        <SlideFormModal
          slide={editingSlide}
          onSave={() => { setEditingSlide(undefined); fetchSlides(); }}
          onClose={() => setEditingSlide(undefined)}
        />
      )}

      {/* Delete slide confirm */}
      {deleteSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold text-lg text-text mb-2">Удалить слайд?</h3>
            <p className="text-text-muted text-sm mb-6">
              «{deleteSlide.headline}» будет удалён без возможности восстановления.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteSlide(null)} className="btn-secondary px-5 py-2.5">Отмена</button>
              <button
                onClick={handleDeleteSlide}
                disabled={deletingSlide}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {deletingSlide ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create modal — editingProduct=null means new, editingProduct=Product means edit, undefined means closed */}
      {editingProduct !== undefined && (
        <ProductFormModal
          product={editingProduct}
          onSave={() => { setEditingProduct(undefined); fetchProducts(); }}
          onClose={() => setEditingProduct(undefined)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold text-lg text-text mb-2">Удалить товар?</h3>
            <p className="text-text-muted text-sm mb-6">
              «{deleteTarget.name}» будет удалён без возможности восстановления.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-5 py-2.5">
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gallery admin grid ────────────────────────────────────────────────────

interface GalleryAdminGridProps {
  layout: GalleryLayout;
  photos: (string | null)[];
  uploading: number | null;
  onUpload: (slot: number, file: File) => void;
  onRemove: (slot: number) => void;
}

function GalleryAdminGrid({ layout, photos, uploading, onUpload, onRemove }: GalleryAdminGridProps) {
  const cell = (slot: number, className: string) => {
    const photo = photos[slot];
    const isUploading = uploading === slot;
    return (
      <div key={slot} className={`${className} relative group rounded-xl overflow-hidden bg-surface border-2 border-dashed border-border`}>
        {photo ? (
          <>
            <img src={photo} alt={`Слот ${slot + 1}`} className="absolute inset-0 w-full h-full object-cover" />
            {/* overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <label className="cursor-pointer bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
                <Upload size={12} /> Заменить
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { onUpload(slot, f); e.target.value = ""; }
                  }}
                />
              </label>
              <button
                onClick={() => onRemove(slot)}
                className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <XIcon size={12} /> Удалить
              </button>
            </div>
            <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {slot + 1}
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors">
            {isUploading ? (
              <span className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <Upload size={20} className="text-text-muted mb-2" />
                <span className="text-text-muted text-xs font-medium">Фото {slot + 1}</span>
                <span className="text-text-muted/60 text-[10px] mt-0.5">Нажмите для загрузки</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { onUpload(slot, f); e.target.value = ""; }
              }}
            />
          </label>
        )}
      </div>
    );
  };

  if (layout === "featured") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="grid grid-cols-2 gap-2">
          {cell(0, "aspect-square")}
          {cell(1, "aspect-square")}
          {cell(2, "aspect-square")}
          {cell(3, "aspect-square")}
        </div>
        {cell(4, "aspect-square")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }, (_, i) => cell(i, "aspect-square"))}
    </div>
  );
}
