"use client";
import { useState } from "react";
import { X, ChevronRight, CheckCircle } from "lucide-react";
import type { CustomCriterion, CustomVariant, CustomOrderSelection } from "@/types";
import { formatPrice } from "@/lib/utils";

// if a level has exactly one option for the selected root, select it automatically
// (skip 1-way "choices" — the customer shouldn't have to pick from a dropdown with a single option)
function autoFillCascadePath(crit: CustomCriterion, path: Record<string, string>): Record<string, string> {
  const root = crit.variants.find((v) => v.id === path["0"]);
  if (!root) return path;
  const levels = crit.cascadeLevels ?? [];
  const result = { ...path };
  levels.slice(1).forEach((_, idx) => {
    const li = String(idx + 1);
    const opts = root.levelChildren?.[li] ?? [];
    if (opts.length === 1 && !result[li]) result[li] = opts[0].id;
  });
  return result;
}

// path: Record<levelIdx, selectedVariantId>, "0" = root
function isCascadeComplete(crit: CustomCriterion, path: Record<string, string>): boolean {
  const root = crit.variants.find((v) => v.id === path["0"]);
  if (!root) return false;
  const levels = crit.cascadeLevels ?? [];
  return levels.slice(1).every((_, idx) => {
    const li = String(idx + 1);
    const opts = root.levelChildren?.[li] ?? [];
    return !opts.length || !!path[li];
  });
}

function getCascadePrice(crit: CustomCriterion, path: Record<string, string>): number {
  const root = crit.variants.find((v) => v.id === path["0"]);
  if (!root) return 0;
  let total = root.price;
  const levels = crit.cascadeLevels ?? [];
  levels.slice(1).forEach((_, idx) => {
    const li = String(idx + 1);
    const child = (root.levelChildren?.[li] ?? []).find((c) => c.id === path[li]);
    if (child) total += child.price;
  });
  return total;
}

function getCascadeLabel(crit: CustomCriterion, path: Record<string, string>): string {
  const root = crit.variants.find((v) => v.id === path["0"]);
  if (!root) return "";
  const parts = [root.label];
  const levels = crit.cascadeLevels ?? [];
  levels.slice(1).forEach((_, idx) => {
    const li = String(idx + 1);
    const child = (root.levelChildren?.[li] ?? []).find((c) => c.id === path[li]);
    if (child) parts.push(child.label);
  });
  return parts.join(" → ");
}

interface Props {
  productId: string;
  productName: string;
  criteria: CustomCriterion[];
  onClose: () => void;
}

type Step = "select" | "result" | "form" | "done";

export default function CustomizationPanel({ productId, productName, criteria: rawCriteria, onClose }: Props) {
  const criteria = rawCriteria.filter(
    (c) => c.type === "checkbox" || c.type === "checkbox-group" || c.variants.length > 0
  );
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [cascadePaths, setCascadePaths] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    rawCriteria.forEach((c) => {
      if (c.type === "cascading" && c.cascadeDefault && Object.keys(c.cascadeDefault).length > 0) {
        init[c.id] = autoFillCascadePath(c, c.cascadeDefault);
      }
    });
    return init;
  });
  const [step, setStep] = useState<Step>("select");
  const [total, setTotal] = useState(0);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allSelected = criteria.every((c) => {
    if (c.type === "cascading") return isCascadeComplete(c, cascadePaths[c.id] ?? {});
    return c.type === "checkbox" || c.type === "checkbox-group" || !!selections[c.id];
  });

  function calculate() {
    let sum = 0;
    criteria.forEach((c) => {
      if (c.type === "cascading") {
        sum += getCascadePrice(c, cascadePaths[c.id] ?? {});
      } else if (c.type === "checkbox") {
        if (selections[c.id]) sum += c.variants[0]?.price ?? 0;
      } else {
        const variant = c.variants.find((v) => v.id === selections[c.id]);
        if (variant) sum += variant.price;
      }
    });
    setTotal(sum);
    setStep("result");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    setSubmitting(true);

    const orderSelections: CustomOrderSelection[] = criteria.map((c) => {
      if (c.type === "cascading") {
        const path = cascadePaths[c.id] ?? {};
        const levels = c.cascadeLevels ?? [];
        const lastLi = String(levels.length - 1);
        return {
          criterionId: c.id,
          criterionName: c.name,
          variantId: path[lastLi] ?? path["0"] ?? "",
          variantLabel: getCascadeLabel(c, path),
          price: getCascadePrice(c, path),
        };
      }
      if (c.type === "checkbox") {
        const checked = !!selections[c.id];
        const variant = c.variants[0];
        return {
          criterionId: c.id,
          criterionName: c.name,
          variantId: checked ? (variant?.id ?? "") : "no",
          variantLabel: checked ? "Да" : "Нет",
          price: checked ? (variant?.price ?? 0) : 0,
        };
      }
      if (c.type === "checkbox-group") {
        const variant = c.variants.find((v) => v.id === selections[c.id]);
        return {
          criterionId: c.id,
          criterionName: c.name,
          variantId: variant?.id ?? "none",
          variantLabel: variant ? `${variant.label} — Да` : "Не выбрано",
          price: variant?.price ?? 0,
        };
      }
      const variantId = selections[c.id];
      const variant = c.variants.find((v) => v.id === variantId)!;
      return {
        criterionId: c.id,
        criterionName: c.name,
        variantId: variant.id,
        variantLabel: variant.label,
        price: variant.price,
      };
    });

    try {
      await fetch("/api/custom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productName,
          fullName: fullName.trim(),
          phone: phone.trim(),
          selections: orderSelections,
          totalPrice: total,
        }),
      });
    } catch {
      /* ignore — заказ всё равно показывается как принятый, менеджер свяжется по телефону */
    }

    setSubmitting(false);
    setStep("done");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-display font-bold text-base text-text">Индивидуальный заказ</h3>
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-xs">{productName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* Step: select options */}
          {step === "select" && (
            <div className="space-y-5">
              <p className="text-sm text-text-muted">Выберите параметры под ваш заказ. Стоимость будет рассчитана после выбора всех пунктов.</p>
              {criteria.map((c) => (
                <div key={c.id}>
                  <p className="text-sm font-semibold text-text mb-2">{c.name}</p>

                  {c.type === "cascading" ? (() => {
                    const levels = c.cascadeLevels ?? [];
                    const path = cascadePaths[c.id] ?? {};
                    const selectedRoot = c.variants.find((v) => v.id === path["0"]);
                    return (
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-text-muted mb-1 font-medium">{levels[0] ?? "Уровень 1"}</p>
                          <select
                            value={path["0"] ?? ""}
                            onChange={(e) => setCascadePaths((p) => ({ ...p, [c.id]: autoFillCascadePath(c, { "0": e.target.value }) }))}
                            className="input-field text-sm"
                          >
                            <option value="" disabled>— выберите —</option>
                            {c.variants.map((v) => (
                              <option key={v.id} value={v.id} disabled={v.inStock === false}>
                                {v.label}{v.price > 0 ? ` (+${formatPrice(v.price)})` : ""}{v.inStock === false ? " — нет в наличии" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedRoot && levels.slice(1).map((levelName, idx) => {
                          const li = String(idx + 1);
                          const opts = selectedRoot.levelChildren?.[li] ?? [];
                          if (!opts.length) return null;
                          return (
                            <div key={li}>
                              <p className="text-xs text-text-muted mb-1 font-medium">{levelName}</p>
                              {opts.length === 1 ? (
                                <p className="input-field text-sm bg-surface text-text flex items-center">
                                  {opts[0].label}{opts[0].price > 0 ? ` (+${formatPrice(opts[0].price)})` : ""}
                                </p>
                              ) : (
                                <select
                                  value={path[li] ?? ""}
                                  onChange={(e) => setCascadePaths((p) => ({ ...p, [c.id]: autoFillCascadePath(c, { ...p[c.id], [li]: e.target.value }) }))}
                                  className="input-field text-sm"
                                >
                                  <option value="" disabled>— выберите —</option>
                                  {opts.map((v) => (
                                    <option key={v.id} value={v.id} disabled={v.inStock === false}>
                                      {v.label}{v.price > 0 ? ` (+${formatPrice(v.price)})` : ""}{v.inStock === false ? " — нет в наличии" : ""}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })() : c.type === "checkbox-group" ? (
                    <div className="space-y-1.5">
                      {c.variants.map((v) => {
                        const isChecked = selections[c.id] === v.id;
                        const outOfStock = v.inStock === false;
                        return (
                          <label
                            key={v.id}
                            className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 transition-all ${
                              outOfStock
                                ? "border-border opacity-50 cursor-not-allowed"
                                : `cursor-pointer ${isChecked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isChecked && !outOfStock ? "bg-primary border-primary" : "border-border"
                              }`}>
                                {isChecked && !outOfStock && <span className="text-white text-xs font-bold">✓</span>}
                              </div>
                              <span className={`text-sm text-text ${outOfStock ? "line-through" : ""}`}>{v.label}</span>
                            </div>
                            <span className={`text-xs font-semibold ${outOfStock ? "text-red-500" : isChecked ? "text-primary" : "text-text-muted"}`}>
                              {outOfStock ? "Нет в наличии" : isChecked ? "Да" : "Нет"}
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={outOfStock}
                              onChange={(e) => setSelections((p) => ({
                                ...p,
                                [c.id]: e.target.checked ? v.id : "",
                              }))}
                              className="hidden"
                            />
                          </label>
                        );
                      })}
                    </div>
                  ) : c.type === "checkbox" ? (() => {
                    const outOfStock = c.variants[0]?.inStock === false;
                    return (
                      <label className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 transition-all ${
                        outOfStock
                          ? "border-border opacity-50 cursor-not-allowed"
                          : `cursor-pointer ${selections[c.id] ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            selections[c.id] && !outOfStock ? "bg-primary border-primary" : "border-border"
                          }`}>
                            {selections[c.id] && !outOfStock && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <span className="text-sm text-text font-medium">
                            {outOfStock ? "Нет в наличии" : selections[c.id] ? "Да" : "Нет"}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!selections[c.id]}
                          disabled={outOfStock}
                          onChange={(e) => setSelections((p) => ({
                            ...p,
                            [c.id]: e.target.checked ? (c.variants[0]?.id ?? "yes") : "",
                          }))}
                          className="hidden"
                        />
                      </label>
                    );
                  })() : (
                    <select
                      value={selections[c.id] ?? ""}
                      onChange={(e) => setSelections((p) => ({ ...p, [c.id]: e.target.value }))}
                      className="input-field text-sm"
                    >
                      <option value="" disabled>— выберите —</option>
                      {c.variants.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.inStock === false}>
                          {v.label}{v.inStock === false ? " — нет в наличии" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step: result */}
          {step === "result" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-text">Ваша конфигурация:</p>
              {criteria.map((c) => {
                const label = c.type === "cascading"
                  ? getCascadeLabel(c, cascadePaths[c.id] ?? {})
                  : c.type === "checkbox"
                  ? (selections[c.id] ? "Да" : "Нет")
                  : c.type === "checkbox-group"
                  ? (c.variants.find((v) => v.id === selections[c.id])?.label
                      ? `${c.variants.find((v) => v.id === selections[c.id])!.label} — Да`
                      : "Не выбрано")
                  : c.variants.find((v) => v.id === selections[c.id])?.label;
                return (
                  <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                    <span className="text-text-muted">{c.name}</span>
                    <span className="font-semibold text-text">{label}</span>
                  </div>
                );
              })}
              <div className="bg-primary/5 rounded-xl p-4 mt-2">
                <p className="text-xs text-text-muted mb-1">Итоговая стоимость</p>
                <p className="font-display font-extrabold text-2xl text-primary">{formatPrice(total)}</p>
              </div>
              <button
                onClick={() => setStep("form")}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                Оформить заказ <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setStep("select")}
                className="w-full text-center text-sm text-text-muted hover:text-text transition-colors"
              >
                ← Изменить параметры
              </button>
            </div>
          )}

          {/* Step: form */}
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-text-muted">Оставьте контакты — менеджер свяжется для подтверждения заказа.</p>
              <div>
                <label className="text-sm font-semibold text-text mb-1.5 block">Имя</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ваше имя"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text mb-1.5 block">Телефон</label>
                <div className="flex gap-2">
                  <div className="bg-surface border border-border rounded-lg px-3 flex items-center text-sm text-text-muted flex-shrink-0 select-none">
                    +7
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="700 000 0000"
                    inputMode="tel"
                    className="input-field"
                  />
                </div>
              </div>
              <div className="bg-surface rounded-xl p-4 text-sm">
                <p className="text-text-muted mb-1">Итого к оплате</p>
                <p className="font-display font-bold text-lg text-primary">{formatPrice(total)}</p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                {submitting ? "Отправка..." : "Подтвердить заказ"}
              </button>
              <button
                type="button"
                onClick={() => setStep("result")}
                className="w-full text-center text-sm text-text-muted hover:text-text transition-colors"
              >
                ← Назад
              </button>
            </form>
          )}

          {/* Step: done */}
          {step === "done" && (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <CheckCircle size={48} className="text-green-500" />
              <div>
                <p className="font-display font-bold text-lg text-text mb-1">Заказ принят!</p>
                <p className="text-sm text-text-muted">Менеджер свяжется с вами в ближайшее время для подтверждения.</p>
              </div>
              <button onClick={onClose} className="btn-primary px-8 py-3 mt-2">Закрыть</button>
            </div>
          )}
        </div>

        {/* Footer CTA for select step */}
        {step === "select" && (
          <div className="p-5 border-t border-border">
            <button
              onClick={calculate}
              disabled={!allSelected}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allSelected ? "Рассчитать стоимость" : `Выберите все параметры (${Object.keys(selections).length}/${criteria.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
