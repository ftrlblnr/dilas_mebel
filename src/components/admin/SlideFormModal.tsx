"use client";
import { useState, useRef } from "react";
import { X, Upload, Link as LinkIcon, Loader2 } from "lucide-react";

export interface HeroSlide {
  id: number;
  image: string;
  headline: string;
  subtext: string;
  cta: string;
  ctaLink: string;
}

const ADMIN_PASSWORD = "dilas2024";

const EMPTY: Omit<HeroSlide, "id"> = {
  image: "",
  headline: "",
  subtext: "",
  cta: "",
  ctaLink: "/products",
};

interface Props {
  slide: HeroSlide | null;
  onSave: () => void;
  onClose: () => void;
}

export default function SlideFormModal({ slide, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<HeroSlide, "id">>(
    slide
      ? { image: slide.image, headline: slide.headline, subtext: slide.subtext, cta: slide.cta, ctaLink: slide.ctaLink }
      : { ...EMPTY }
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${ADMIN_PASSWORD}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      set("image", data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) { setError("Добавьте изображение"); return; }
    if (!form.headline) { setError("Введите заголовок"); return; }
    setSaving(true);
    setError("");
    try {
      const url = slide ? `/api/slides/${slide.id}` : "/api/slides";
      const res = await fetch(url, {
        method: slide ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_PASSWORD}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-base text-text">
            {slide ? "Редактировать слайд" : "Новый слайд"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">

          {/* Image upload area */}
          <div>
            <label className="label">Изображение <span className="text-red-500">*</span></label>

            {form.image ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-black mb-2">
                <img src={form.image} alt="preview" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => set("image", "")}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary bg-surface hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-sm">Загрузка...</span>
                  </>
                ) : (
                  <>
                    <Upload size={28} />
                    <span className="text-sm font-medium">Нажмите чтобы загрузить</span>
                    <span className="text-xs">JPG, PNG, WebP · до 10 МБ</span>
                  </>
                )}
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />

            {/* URL fallback */}
            {!form.image && (
              <div className="flex items-center gap-2 mt-2">
                <LinkIcon size={14} className="text-text-muted flex-shrink-0" />
                <input
                  className="input-field text-sm py-1.5"
                  placeholder="или вставьте URL изображения"
                  value={form.image}
                  onChange={(e) => set("image", e.target.value)}
                />
              </div>
            )}

            {form.image && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 disabled:opacity-60"
              >
                <Upload size={12} /> Заменить изображение
              </button>
            )}
          </div>

          <div>
            <label className="label">Заголовок <span className="text-red-500">*</span></label>
            <input
              className="input-field"
              placeholder="Летняя распродажа — до 30%"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Подзаголовок</label>
            <input
              className="input-field"
              placeholder="Специальные цены на избранные модели"
              value={form.subtext}
              onChange={(e) => set("subtext", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Текст кнопки</label>
              <input
                className="input-field"
                placeholder="В каталог"
                value={form.cta}
                onChange={(e) => set("cta", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Ссылка кнопки</label>
              <input
                className="input-field"
                placeholder="/products"
                value={form.ctaLink}
                onChange={(e) => set("ctaLink", e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5">
              Отмена
            </button>
            <button type="submit" disabled={saving || uploading} className="btn-primary px-5 py-2.5 disabled:opacity-60">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
