"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Save, CheckCircle2, FolderTree } from "lucide-react";
import type { NavCategory, NavSubcategory } from "@/lib/categories-server";

const ADMIN_PASSWORD = "dilas2024";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function newCategory(): NavCategory {
  return { id: crypto.randomUUID(), label: "", labelEn: "", slug: "", subcategories: [] };
}

function newSubcategory(): NavSubcategory {
  return { id: crypto.randomUUID(), label: "", slug: "" };
}

function move<T>(arr: T[], idx: number, dir: -1 | 1): T[] {
  const target = idx + dir;
  if (target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[idx], next[target]] = [next[target], next[idx]];
  return next;
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("[]");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: NavCategory[]) => {
        setCategories(data);
        setSavedSnapshot(JSON.stringify(data));
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty = JSON.stringify(categories) !== savedSnapshot;

  const updateCategory = (id: string, patch: Partial<NavCategory>) => {
    setCategories((cats) => cats.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const updateSubcategory = (catId: string, subId: string, patch: Partial<NavSubcategory>) => {
    setCategories((cats) =>
      cats.map((c) =>
        c.id !== catId
          ? c
          : { ...c, subcategories: c.subcategories.map((s) => (s.id === subId ? { ...s, ...patch } : s)) }
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = categories.map((c) => ({ ...c, labelEn: c.label }));
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_PASSWORD}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения");
      setCategories(data);
      setSavedSnapshot(JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-text-muted text-sm">Загрузка...</div>;
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Save bar */}
      <div className="flex items-center gap-4 sticky top-0 z-10 bg-surface/95 backdrop-blur py-2 -mx-1 px-1">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 btn-primary py-2.5 px-6 text-sm disabled:opacity-60"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Сохранить изменения
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
            <CheckCircle2 size={16} /> Сохранено
          </span>
        )}
        {dirty && !saving && !saved && (
          <span className="text-amber-600 text-xs font-semibold">Есть несохранённые изменения</span>
        )}
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>

      {categories.map((cat, idx) => (
        <div key={cat.id} className="card overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50 flex items-start gap-3">
            <div className="flex flex-col gap-0.5 pt-1">
              <button
                onClick={() => setCategories((cats) => move(cats, idx, -1))}
                disabled={idx === 0}
                className="text-text-muted hover:text-primary disabled:opacity-30"
                title="Переместить выше"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => setCategories((cats) => move(cats, idx, 1))}
                disabled={idx === categories.length - 1}
                className="text-text-muted hover:text-primary disabled:opacity-30"
                title="Переместить ниже"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Название раздела</label>
                <input
                  className="input-field"
                  placeholder="Гостиная"
                  value={cat.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    const autoSlug = !cat.slug || cat.slug === slugify(cat.label);
                    updateCategory(cat.id, { label, ...(autoSlug ? { slug: slugify(label) } : {}) });
                  }}
                />
              </div>
              <div>
                <label className="label">Slug (используется в ссылках и товарах)</label>
                <input
                  className="input-field font-mono text-sm"
                  placeholder="living-room"
                  value={cat.slug}
                  onChange={(e) => updateCategory(cat.id, { slug: slugify(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={!!cat.isSale}
                  onChange={(e) => updateCategory(cat.id, { isSale: e.target.checked })}
                />
                Раздел «Распродажа»
              </label>
              <button
                onClick={() => {
                  if (!confirm(`Удалить раздел «${cat.label || "без названия"}» вместе с подразделами?`)) return;
                  setCategories((cats) => cats.filter((c) => c.id !== cat.id));
                }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 size={13} /> Удалить раздел
              </button>
            </div>
          </div>

          {/* Subcategories */}
          <div className="p-4 space-y-2">
            {cat.subcategories.map((sub, subIdx) => (
              <div key={sub.id} className="flex items-center gap-2 pl-4">
                <div className="flex flex-col gap-0">
                  <button
                    onClick={() =>
                      updateCategory(cat.id, { subcategories: move(cat.subcategories, subIdx, -1) })
                    }
                    disabled={subIdx === 0}
                    className="text-text-muted hover:text-primary disabled:opacity-30"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={() =>
                      updateCategory(cat.id, { subcategories: move(cat.subcategories, subIdx, 1) })
                    }
                    disabled={subIdx === cat.subcategories.length - 1}
                    className="text-text-muted hover:text-primary disabled:opacity-30"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
                <input
                  className="input-field text-sm py-1.5 flex-1"
                  placeholder="Название подраздела"
                  value={sub.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    const autoSlug = !sub.isAll && (!sub.slug || sub.slug === slugify(sub.label));
                    updateSubcategory(cat.id, sub.id, { label, ...(autoSlug ? { slug: slugify(label) } : {}) });
                  }}
                />
                <input
                  className="input-field text-sm py-1.5 flex-1 font-mono disabled:opacity-50"
                  placeholder="slug"
                  value={sub.isAll ? cat.slug : sub.slug}
                  disabled={sub.isAll}
                  onChange={(e) => updateSubcategory(cat.id, sub.id, { slug: slugify(e.target.value) })}
                />
                <label className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={!!sub.isAll}
                    onChange={(e) => updateSubcategory(cat.id, sub.id, { isAll: e.target.checked })}
                  />
                  «Смотреть всё»
                </label>
                <button
                  onClick={() =>
                    updateCategory(cat.id, { subcategories: cat.subcategories.filter((s) => s.id !== sub.id) })
                  }
                  className="text-text-muted hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateCategory(cat.id, { subcategories: [...cat.subcategories, newSubcategory()] })}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline pl-4 pt-1"
            >
              <Plus size={13} /> Добавить подраздел
            </button>
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <div className="card p-10 text-center">
          <FolderTree size={36} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Нет разделов</p>
        </div>
      )}

      <button
        onClick={() => setCategories((cats) => [...cats, newCategory()])}
        className="flex items-center gap-1.5 btn-secondary py-2.5 px-5 text-sm"
      >
        <Plus size={15} /> Добавить раздел
      </button>
    </div>
  );
}
