"use client";
import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import type { Product } from "@/types";
import type { NavCategory } from "@/lib/categories-server";

type FormProduct = Omit<Product, "id" | "createdAt">;

const EMPTY: FormProduct = {
  sku: "",
  name: "",
  slug: "",
  category: "living-room",
  subcategory: "",
  description: "",
  price: 0,
  salePrice: undefined,
  images: [""],
  dimensions: { width: 0, depth: 0, height: 0, weight: 0 },
  material: "",
  style: "",
  inStock: true,
  tags: [],
  featured: false,
  isNew: false,
  isPopular: false,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ё/g, "e").replace(/[а-яА-ЯёЁ]/g, (c) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",
        к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",
        ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",
        ю:"yu",я:"ya",
      };
      return map[c.toLowerCase()] ?? c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProductFormModal({
  product,
  onSave,
  onClose,
}: {
  product: Product | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const isNew = !product;
  const [form, setForm] = useState<FormProduct>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<number | null>(null);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingIndexRef = useRef<number>(-1);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (product) {
      const { id: _id, createdAt: _c, ...rest } = product;
      setForm({ ...EMPTY, ...rest });
    } else {
      setForm(EMPTY);
    }
  }, [product]);

  const set = <K extends keyof FormProduct>(key: K, value: FormProduct[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const idx = uploadingIndexRef.current;
    setUploading(idx);
    e.target.value = "";
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { url } = await res.json();
      setForm((f) => {
        const imgs = [...f.images];
        imgs[idx] = url;
        return { ...f, images: imgs };
      });
    } catch (err) {
      setError(`Ошибка загрузки: ${err}`);
    } finally {
      setUploading(null);
    }
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: isNew ? slugify(name) : f.slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        images: form.images.filter(Boolean),
        tags: typeof form.tags === "string"
          ? (form.tags as unknown as string).split(",").map((t) => t.trim()).filter(Boolean)
          : form.tags,
        dimensions: form.dimensions
          ? {
              width: Number(form.dimensions.width),
              depth: Number(form.dimensions.depth),
              height: Number(form.dimensions.height),
              weight: Number(form.dimensions.weight),
            }
          : undefined,
      };

      const url = isNew ? "/api/products" : `/api/products/${product!.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      onSave();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const tagsString = Array.isArray(form.tags) ? form.tags.join(", ") : (form.tags as unknown as string);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-lg text-text">
            {isNew ? "Добавить товар" : "Редактировать товар"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic info */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Основное</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Название</label>
                <input className="input-field" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
              </div>
              <div>
                <label className="label">SKU</label>
                <input className="input-field" value={form.sku} onChange={(e) => set("sku", e.target.value)} required />
              </div>
              <div>
                <label className="label">Slug (URL)</label>
                <input
                  className="input-field"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value.replace(/\//g, "-").replace(/\s+/g, "-"))}
                  required
                />
                <p className="text-xs text-text-muted mt-1">Только латиница, цифры и дефисы. Пример: <span className="font-mono">krovat-tokio</span></p>
              </div>
              <div>
                <label className="label">Категория</label>
                <select className="input-field" value={form.category} onChange={(e) => { set("category", e.target.value); set("subcategory", ""); }}>
                  {categories.filter((c) => !c.isSale).map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Подкатегория</label>
                <select className="input-field" value={form.subcategory ?? ""} onChange={(e) => set("subcategory", e.target.value)}>
                  <option value="">— не выбрана —</option>
                  {(categories.find((c) => c.slug === form.category)?.subcategories ?? [])
                    .filter((s) => !s.isAll)
                    .map((s) => (
                      <option key={s.slug} value={s.slug}>{s.label}</option>
                    ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Описание</label>
                <textarea className="input-field min-h-[80px] resize-y" value={form.description} onChange={(e) => set("description", e.target.value)} required />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Цены</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Цена ₸</label>
                <input type="number" className="input-field" value={form.price} onChange={(e) => set("price", +e.target.value)} min={0} required />
              </div>
              <div>
                <label className="label">Цена со скидкой ₸ <span className="text-text-muted font-normal">(необязательно)</span></label>
                <input type="number" className="input-field" value={form.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value ? +e.target.value : undefined)} min={0} />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Изображения</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileUpload}
            />
            {form.images.map((url, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="input-field flex-1"
                  placeholder="https://... или загрузите файл →"
                  value={url}
                  onChange={(e) => {
                    const imgs = [...form.images];
                    imgs[i] = e.target.value;
                    set("images", imgs);
                  }}
                />
                <button
                  type="button"
                  title="Загрузить файл"
                  disabled={uploading !== null}
                  onClick={() => { uploadingIndexRef.current = i; fileInputRef.current?.click(); }}
                  className="p-2 rounded-lg border border-border text-text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-40"
                >
                  {uploading === i ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                </button>
                {url && <img src={url} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                <button
                  type="button"
                  onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                  className="p-1.5 text-text-muted hover:text-red-500"
                  disabled={form.images.length === 1}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set("images", [...form.images, ""])} className="flex items-center gap-1.5 text-sm text-primary font-semibold">
              <Plus size={15} /> Добавить изображение
            </button>
          </section>

          {/* Details */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Детали</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Материал</label>
                <input className="input-field" value={form.material ?? ""} onChange={(e) => set("material", e.target.value)} />
              </div>
              <div>
                <label className="label">Стиль</label>
                <input className="input-field" value={form.style ?? ""} onChange={(e) => set("style", e.target.value)} />
              </div>
              <div>
                <label className="label">Теги <span className="text-text-muted font-normal">(через запятую)</span></label>
                <input className="input-field" value={tagsString} onChange={(e) => set("tags", e.target.value as unknown as string[])} />
              </div>
            </div>

          </section>

          {/* Flags */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Флаги</h3>
            <div className="flex flex-wrap gap-6">
              {([["inStock", "В наличии"], ["featured", "Рекомендуемый"], ["isNew", "Новинка"], ["isPopular", "Популярное"]] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-text">{label}</span>
                </label>
              ))}
            </div>
          </section>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-2">{error}</p>}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5">
              Отмена
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-60">
              {saving ? "Сохранение..." : isNew ? "Создать" : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
