"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import type { CustomCriterion, CustomVariant, CustomizationMap, Product } from "@/types";
import { formatPrice } from "@/lib/utils";

const ADMIN_PASSWORD = "dilas2024";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function deepCloneVariant(v: CustomVariant): CustomVariant {
  const cloned: CustomVariant = { ...v, id: uid() };
  if (v.levelChildren) {
    cloned.levelChildren = {};
    for (const [k, children] of Object.entries(v.levelChildren)) {
      cloned.levelChildren[k] = children.map((c) => ({ ...c, id: uid() }));
    }
  }
  return cloned;
}

function deepCloneWithNewIds(criteria: CustomCriterion[]): CustomCriterion[] {
  return criteria.map((c) => ({ ...c, id: uid(), variants: c.variants.map(deepCloneVariant) }));
}

interface Props {
  productId: string;
  productName: string;
  allProducts: Product[];
  onClose: () => void;
}

export default function CustomizationModal({ productId, productName, allProducts, onClose }: Props) {
  const [criteria, setCriteria] = useState<CustomCriterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCritName, setNewCritName] = useState("");
  const [newCritType, setNewCritType] = useState<"select" | "checkbox" | "checkbox-group" | "cascading">("select");
  const [newCritCheckboxPrice, setNewCritCheckboxPrice] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState<Record<string, { label: string; price: string }>>({});

  const [editingCrit, setEditingCrit] = useState<{ id: string; name: string } | null>(null);
  const [editingVariant, setEditingVariant] = useState<{ critId: string; varId: string; label: string; price: string } | null>(null);
  const [editingCheckboxPrice, setEditingCheckboxPrice] = useState<{ id: string; price: string } | null>(null);
  const [cascadeExpanded, setCascadeExpanded] = useState<Record<string, boolean>>({});
  const [editingCascadeRoot, setEditingCascadeRoot] = useState<{ critId: string; rootId: string; label: string; price: string } | null>(null);
  const [editingCascadeChild, setEditingCascadeChild] = useState<{ critId: string; rootId: string; levelIdx: string; childId: string; label: string; price: string } | null>(null);
  const [newRootInput, setNewRootInput] = useState<Record<string, { label: string; price: string }>>({});
  const [newChildInput, setNewChildInput] = useState<Record<string, { label: string; price: string }>>({});
  const [localCascadeLevels, setLocalCascadeLevels] = useState<Record<string, string[]>>({});

  const [allCustomizations, setAllCustomizations] = useState<CustomizationMap>({});
  const [copySourceId, setCopySourceId] = useState("");
  const [copying, setCopying] = useState(false);

  const critInputRef = useRef<HTMLInputElement>(null);
  const variantLabelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/customizations/${productId}`).then((r) => r.json()),
      fetch("/api/customizations").then((r) => r.json()),
    ]).then(([data, all]: [CustomCriterion[], CustomizationMap]) => {
      setCriteria(data);
      setAllCustomizations(all);
      setLoading(false);
    });
  }, [productId]);

  useEffect(() => { if (editingCrit) critInputRef.current?.focus(); }, [editingCrit]);
  useEffect(() => { if (editingVariant) variantLabelRef.current?.focus(); }, [editingVariant]);

  const productsWithParams = allProducts.filter(
    (p) => p.id !== productId && allCustomizations[p.id]?.length > 0
  );

  async function save(updated: CustomCriterion[]) {
    setSaving(true);
    await fetch(`/api/customizations/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_PASSWORD}` },
      body: JSON.stringify(updated),
    });
    setCriteria(updated);
    setSaving(false);
  }

  function addCriterion() {
    const name = newCritName.trim();
    if (!name) return;
    const id = uid();
    if (newCritType === "checkbox") {
      const price = parseFloat(newCritCheckboxPrice);
      save([...criteria, { id, name, type: "checkbox", variants: [{ id: uid(), label: "Да", price: isNaN(price) ? 0 : price }] }]);
      setNewCritCheckboxPrice("");
    } else {
      setExpanded(id);
      const newCrit: CustomCriterion = { id, name, type: newCritType, variants: [] };
      if (newCritType === "cascading") newCrit.cascadeLevels = ["Уровень 1", "Уровень 2"];
      save([...criteria, newCrit]);
    }
    setNewCritName("");
  }

  function deleteCriterion(id: string) {
    save(criteria.filter((c) => c.id !== id));
  }

  function saveCritName() {
    if (!editingCrit) return;
    const name = editingCrit.name.trim();
    if (!name) { setEditingCrit(null); return; }
    save(criteria.map((c) => c.id === editingCrit.id ? { ...c, name } : c));
    setEditingCrit(null);
  }

  function saveCheckboxPrice() {
    if (!editingCheckboxPrice) return;
    const price = parseFloat(editingCheckboxPrice.price);
    save(criteria.map((c) =>
      c.id === editingCheckboxPrice.id
        ? { ...c, variants: [{ ...c.variants[0], price: isNaN(price) ? 0 : price }] }
        : c
    ));
    setEditingCheckboxPrice(null);
  }

  function addVariant(criterionId: string) {
    const v = newVariant[criterionId];
    if (!v?.label.trim() || !v?.price) return;
    const price = parseFloat(v.price);
    if (isNaN(price) || price < 0) return;
    save(criteria.map((c) =>
      c.id === criterionId
        ? { ...c, variants: [...c.variants, { id: uid(), label: v.label.trim(), price }] }
        : c
    ));
    setNewVariant((prev) => ({ ...prev, [criterionId]: { label: "", price: "" } }));
  }

  function deleteVariant(criterionId: string, variantId: string) {
    save(criteria.map((c) =>
      c.id === criterionId ? { ...c, variants: c.variants.filter((v: CustomVariant) => v.id !== variantId) } : c
    ));
  }

  function saveVariant() {
    if (!editingVariant) return;
    const label = editingVariant.label.trim();
    const price = parseFloat(editingVariant.price);
    if (!label) { setEditingVariant(null); return; }
    save(criteria.map((c) =>
      c.id === editingVariant.critId
        ? { ...c, variants: c.variants.map((v: CustomVariant) => v.id === editingVariant.varId ? { ...v, label, price: isNaN(price) ? v.price : price } : v) }
        : c
    ));
    setEditingVariant(null);
  }

  function toggleVariantStock(criterionId: string, variantId: string) {
    save(criteria.map((c) =>
      c.id === criterionId
        ? { ...c, variants: c.variants.map((v) => v.id === variantId ? { ...v, inStock: v.inStock === false ? true : false } : v) }
        : c
    ));
  }

  function toggleCheckboxStock(criterionId: string) {
    save(criteria.map((c) =>
      c.id === criterionId && c.variants[0]
        ? { ...c, variants: [{ ...c.variants[0], inStock: c.variants[0].inStock === false ? true : false }] }
        : c
    ));
  }

  function toggleCascadeRootStock(critId: string, rootId: string) {
    save(criteria.map((c) => c.id !== critId ? c : {
      ...c,
      variants: c.variants.map((v) => v.id === rootId ? { ...v, inStock: v.inStock === false ? true : false } : v),
    }));
  }

  function toggleCascadeChildStock(critId: string, rootId: string, levelIdx: string, childId: string) {
    save(criteria.map((c) => c.id !== critId ? c : {
      ...c,
      variants: c.variants.map((v) => v.id !== rootId ? v : {
        ...v,
        levelChildren: {
          ...v.levelChildren,
          [levelIdx]: (v.levelChildren?.[levelIdx] ?? []).map((ch) =>
            ch.id === childId ? { ...ch, inStock: ch.inStock === false ? true : false } : ch
          ),
        },
      }),
    }));
  }

  function getEffectiveLevels(crit: CustomCriterion): string[] {
    return localCascadeLevels[crit.id] ?? crit.cascadeLevels ?? ["Уровень 1", "Уровень 2"];
  }

  function saveCascadeLevels(critId: string) {
    const levels = localCascadeLevels[critId];
    if (!levels) return;
    save(criteria.map((c) => (c.id === critId ? { ...c, cascadeLevels: levels } : c)));
    setLocalCascadeLevels((p) => { const n = { ...p }; delete n[critId]; return n; });
  }

  function handleAddCascadeRoot(critId: string) {
    const input = newRootInput[critId];
    if (!input?.label.trim()) return;
    const node: CustomVariant = { id: uid(), label: input.label.trim(), price: parseFloat(input.price) || 0 };
    save(criteria.map((c) => c.id !== critId ? c : { ...c, variants: [...c.variants, node] }));
    setNewRootInput((p) => ({ ...p, [critId]: { label: "", price: "" } }));
  }

  function saveEditCascadeRoot() {
    if (!editingCascadeRoot) return;
    const { critId, rootId, label, price } = editingCascadeRoot;
    if (!label.trim()) { setEditingCascadeRoot(null); return; }
    save(criteria.map((c) => c.id !== critId ? c : {
      ...c,
      variants: c.variants.map((v) => v.id === rootId ? { ...v, label: label.trim(), price: parseFloat(price) || 0 } : v),
    }));
    setEditingCascadeRoot(null);
  }

  function deleteCascadeRoot(critId: string, rootId: string) {
    save(criteria.map((c) => c.id !== critId ? c : { ...c, variants: c.variants.filter((v) => v.id !== rootId) }));
  }

  function handleAddCascadeChild(critId: string, rootId: string, levelIdx: string, inputKey: string) {
    const input = newChildInput[inputKey];
    if (!input?.label.trim()) return;
    const child: CustomVariant = { id: uid(), label: input.label.trim(), price: parseFloat(input.price) || 0 };
    save(criteria.map((c) => c.id !== critId ? c : {
      ...c,
      variants: c.variants.map((v) => v.id !== rootId ? v : {
        ...v,
        levelChildren: { ...v.levelChildren, [levelIdx]: [...(v.levelChildren?.[levelIdx] ?? []), child] },
      }),
    }));
    setNewChildInput((p) => ({ ...p, [inputKey]: { label: "", price: "" } }));
  }

  function saveEditCascadeChild() {
    if (!editingCascadeChild) return;
    const { critId, rootId, levelIdx, childId, label, price } = editingCascadeChild;
    if (!label.trim()) { setEditingCascadeChild(null); return; }
    save(criteria.map((c) => c.id !== critId ? c : {
      ...c,
      variants: c.variants.map((v) => v.id !== rootId ? v : {
        ...v,
        levelChildren: {
          ...v.levelChildren,
          [levelIdx]: (v.levelChildren?.[levelIdx] ?? []).map((ch) =>
            ch.id === childId ? { ...ch, label: label.trim(), price: parseFloat(price) || 0 } : ch
          ),
        },
      }),
    }));
    setEditingCascadeChild(null);
  }

  function deleteCascadeChild(critId: string, rootId: string, levelIdx: string, childId: string) {
    save(criteria.map((c) => c.id !== critId ? c : {
      ...c,
      variants: c.variants.map((v) => v.id !== rootId ? v : {
        ...v,
        levelChildren: {
          ...v.levelChildren,
          [levelIdx]: (v.levelChildren?.[levelIdx] ?? []).filter((ch) => ch.id !== childId),
        },
      }),
    }));
  }

  async function handleCopy() {
    if (!copySourceId) return;
    const source = allCustomizations[copySourceId];
    if (!source?.length) return;
    if (criteria.length > 0 && !confirm("Текущие параметры будут заменены. Продолжить?")) return;
    setCopying(true);
    await save(deepCloneWithNewIds(source));
    setCopySourceId("");
    setCopying(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-display font-bold text-base text-text">Параметры под заказ</h3>
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-xs">{productName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Copy from product */}
        {productsWithParams.length > 0 && (
          <div className="px-5 py-3 border-b border-border bg-surface flex items-center gap-2 flex-wrap">
            <Copy size={14} className="text-text-muted flex-shrink-0" />
            <span className="text-xs text-text-muted font-semibold">Скопировать параметры из:</span>
            <select
              value={copySourceId}
              onChange={(e) => setCopySourceId(e.target.value)}
              className="input-field text-sm py-1 flex-1 min-w-0"
            >
              <option value="">— выберите товар —</option>
              {productsWithParams.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({allCustomizations[p.id].length} пар.)
                </option>
              ))}
            </select>
            <button
              onClick={handleCopy}
              disabled={!copySourceId || copying}
              className="btn-primary py-1 px-3 text-sm flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
            >
              <Copy size={13} />
              {copying ? "Копирование..." : "Скопировать"}
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {loading ? (
            <p className="text-center text-text-muted text-sm py-8">Загрузка...</p>
          ) : criteria.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-6">Нет параметров. Добавьте первый.</p>
          ) : (
            criteria.map((crit) => (
              <div key={crit.id} className="border border-border rounded-xl overflow-hidden">
                {/* Criterion header */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-surface">
                  {editingCrit?.id === crit.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        ref={critInputRef}
                        value={editingCrit.name}
                        onChange={(e) => setEditingCrit({ ...editingCrit, name: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveCritName(); if (e.key === "Escape") setEditingCrit(null); }}
                        onBlur={saveCritName}
                        className="input-field text-sm py-1 flex-1"
                      />
                      <button onClick={saveCritName} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-2 flex-1 text-left group"
                      onClick={() => crit.type !== "checkbox" && setExpanded(expanded === crit.id ? null : crit.id)}
                    >
                      <span
                        className="font-semibold text-sm text-text group-hover:text-primary transition-colors cursor-text"
                        onClick={(e) => { e.stopPropagation(); setEditingCrit({ id: crit.id, name: crit.name }); }}
                        title="Нажмите для редактирования"
                      >
                        {crit.name}
                      </span>
                      {crit.type === "checkbox" ? (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Да/Нет</span>
                      ) : crit.type === "checkbox-group" ? (
                        <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-semibold">Группа Да/Нет</span>
                      ) : crit.type === "cascading" ? (
                        <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold">Каскадный</span>
                      ) : null}
                      {crit.type !== "checkbox" && crit.type !== "cascading" && (
                        <span className="text-xs text-text-muted">({crit.variants.length} вар.)</span>
                      )}
                      {crit.type === "cascading" && (
                        <span className="text-xs text-text-muted">({crit.variants.length} корн.)</span>
                      )}
                      {crit.type !== "checkbox" && (expanded === crit.id
                        ? <ChevronUp size={14} className="ml-auto text-text-muted" />
                        : <ChevronDown size={14} className="ml-auto text-text-muted" />
                      )}
                    </button>
                  )}

                  {/* showInCard toggle */}
                  {crit.type === "checkbox" && editingCrit?.id !== crit.id && (() => {
                    const activeCount = criteria.filter((c) => c.type === "checkbox" && c.showInCard).length;
                    const canEnable = crit.showInCard || activeCount < 3;
                    return (
                      <button
                        onClick={() => canEnable && save(criteria.map((c) => c.id === crit.id ? { ...c, showInCard: !c.showInCard } : c))}
                        title={!canEnable ? "Максимум 3 критерия в карточке" : "Показывать в карточке товара"}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors flex-shrink-0 ${
                          crit.showInCard
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : canEnable
                              ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        {crit.showInCard ? "В карточке ✓" : "В карточке"}
                      </button>
                    );
                  })()}

                  {/* Default value toggle for checkbox */}
                  {crit.type === "checkbox" && editingCrit?.id !== crit.id && (
                    <button
                      onClick={() => save(criteria.map((c) => c.id === crit.id ? { ...c, defaultValue: c.defaultValue === "yes" ? "" : "yes" } : c))}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors flex-shrink-0 ${
                        crit.defaultValue === "yes"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      По умолч.: {crit.defaultValue === "yes" ? "Да" : "Нет"}
                    </button>
                  )}

                  {/* Stock toggle for checkbox */}
                  {crit.type === "checkbox" && editingCrit?.id !== crit.id && (
                    <button
                      onClick={() => toggleCheckboxStock(crit.id)}
                      title="Наличие варианта «Да»"
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors flex-shrink-0 ${
                        crit.variants[0]?.inStock === false
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {crit.variants[0]?.inStock === false ? "Нет в наличии" : "В наличии"}
                    </button>
                  )}

                  {/* Checkbox price inline edit */}
                  {crit.type === "checkbox" && editingCrit?.id !== crit.id && (
                    editingCheckboxPrice?.id === crit.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingCheckboxPrice.price}
                          onChange={(e) => setEditingCheckboxPrice({ ...editingCheckboxPrice, price: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") saveCheckboxPrice(); if (e.key === "Escape") setEditingCheckboxPrice(null); }}
                          onBlur={saveCheckboxPrice}
                          className="input-field text-xs py-0.5 w-24"
                          min="0"
                          autoFocus
                        />
                        <button onClick={saveCheckboxPrice} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={12} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingCheckboxPrice({ id: crit.id, price: String(crit.variants[0]?.price ?? 0) })}
                        className="text-xs font-semibold text-primary hover:underline mr-1"
                        title="Нажмите для редактирования цены"
                      >
                        Да: {formatPrice(crit.variants[0]?.price ?? 0)}
                      </button>
                    )
                  )}

                  <button onClick={() => deleteCriterion(crit.id)} className="p-1 text-text-muted hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Cascading flat editor */}
                {crit.type === "cascading" && expanded === crit.id && (() => {
                  const levels = getEffectiveLevels(crit);
                  const selectedDefaultRoot = crit.variants.find((v) => v.id === crit.cascadeDefault?.["0"]);
                  return (
                    <div className="p-3 space-y-3">
                      {/* Level names */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-text-muted font-semibold flex-shrink-0">Уровни:</span>
                        {levels.map((level, i) => (
                          <input
                            key={i}
                            value={level}
                            onChange={(e) => {
                              const nl = [...levels]; nl[i] = e.target.value;
                              setLocalCascadeLevels((p) => ({ ...p, [crit.id]: nl }));
                            }}
                            onBlur={() => saveCascadeLevels(crit.id)}
                            onKeyDown={(e) => e.key === "Enter" && saveCascadeLevels(crit.id)}
                            className="input-field text-xs py-0.5 w-24"
                          />
                        ))}
                        {levels.length < 5 && (
                          <button
                            onClick={() => save(criteria.map((c) => c.id === crit.id ? { ...c, cascadeLevels: [...levels, `Уровень ${levels.length + 1}`] } : c))}
                            className="text-xs text-primary hover:underline"
                          >+ уровень</button>
                        )}
                        {levels.length > 1 && (
                          <button
                            onClick={() => save(criteria.map((c) => c.id === crit.id ? { ...c, cascadeLevels: levels.slice(0, -1) } : c))}
                            className="text-xs text-red-400 hover:underline"
                          >− уровень</button>
                        )}
                      </div>

                      {/* Default selection */}
                      {crit.variants.length > 0 && (
                        <div className="pb-2 border-b border-border">
                          <p className="text-xs text-text-muted font-semibold mb-1.5">По умолчанию:</p>
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={crit.cascadeDefault?.["0"] ?? ""}
                              onChange={(e) => save(criteria.map((c) => c.id === crit.id ? {
                                ...c, cascadeDefault: { "0": e.target.value }
                              } : c))}
                              className="input-field text-xs py-1"
                            >
                              <option value="">— {levels[0] ?? "Уровень 1"} —</option>
                              {crit.variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                            </select>
                            {selectedDefaultRoot && levels.slice(1).map((levelName, idx) => {
                              const li = String(idx + 1);
                              const opts = selectedDefaultRoot.levelChildren?.[li] ?? [];
                              if (!opts.length) return null;
                              return (
                                <select
                                  key={li}
                                  value={crit.cascadeDefault?.[li] ?? ""}
                                  onChange={(e) => save(criteria.map((c) => c.id === crit.id ? {
                                    ...c, cascadeDefault: { ...c.cascadeDefault, [li]: e.target.value }
                                  } : c))}
                                  className="input-field text-xs py-1"
                                >
                                  <option value="">— {levelName} —</option>
                                  {opts.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                                </select>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Root variants */}
                      {crit.variants.map((root) => {
                        const isExp = !!cascadeExpanded[root.id];
                        const isEditRoot = editingCascadeRoot?.critId === crit.id && editingCascadeRoot.rootId === root.id;
                        return (
                          <div key={root.id} className="border border-border rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 px-2 py-2 bg-surface">
                              <button onClick={() => setCascadeExpanded((p) => ({ ...p, [root.id]: !p[root.id] }))} className="text-text-muted hover:text-text flex-shrink-0">
                                {isExp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                              {isEditRoot ? (
                                <>
                                  <input autoFocus value={editingCascadeRoot.label}
                                    onChange={(e) => setEditingCascadeRoot({ ...editingCascadeRoot, label: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === "Enter") saveEditCascadeRoot(); if (e.key === "Escape") setEditingCascadeRoot(null); }}
                                    onBlur={saveEditCascadeRoot} className="input-field text-sm py-0.5 flex-1" />
                                  <input type="number" placeholder="₸" value={editingCascadeRoot.price}
                                    onChange={(e) => setEditingCascadeRoot({ ...editingCascadeRoot, price: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === "Enter") saveEditCascadeRoot(); if (e.key === "Escape") setEditingCascadeRoot(null); }}
                                    onBlur={saveEditCascadeRoot} className="input-field text-xs py-0.5 w-20" min="0" />
                                  <button onClick={saveEditCascadeRoot} className="p-1 text-green-600 flex-shrink-0"><Check size={12} /></button>
                                </>
                              ) : (
                                <>
                                  <button className="flex-1 text-left text-sm font-semibold text-text hover:text-primary transition-colors"
                                    onClick={() => setEditingCascadeRoot({ critId: crit.id, rootId: root.id, label: root.label, price: String(root.price) })}>
                                    {root.label}
                                  </button>
                                  {root.price > 0 && <span className="text-xs font-semibold text-primary flex-shrink-0">{formatPrice(root.price)}</span>}
                                  <button
                                    onClick={() => toggleCascadeRootStock(crit.id, root.id)}
                                    title="Наличие"
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 transition-colors ${
                                      root.inStock === false ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
                                    }`}
                                  >
                                    {root.inStock === false ? "Нет" : "Есть"}
                                  </button>
                                  <button onClick={() => deleteCascadeRoot(crit.id, root.id)} className="p-0.5 text-text-muted hover:text-red-500 flex-shrink-0"><Trash2 size={13} /></button>
                                </>
                              )}
                            </div>

                            {isExp && (
                              <div className="p-2 space-y-3">
                                {levels.slice(1).map((levelName, idx) => {
                                  const li = String(idx + 1);
                                  const children = root.levelChildren?.[li] ?? [];
                                  const ck = `${crit.id}|${root.id}|${li}`;
                                  return (
                                    <div key={li}>
                                      <p className="text-xs font-semibold text-text-muted mb-1">{levelName}</p>
                                      <div className="space-y-1">
                                        {children.map((child) => {
                                          const isEditChild = editingCascadeChild?.critId === crit.id && editingCascadeChild.rootId === root.id && editingCascadeChild.levelIdx === li && editingCascadeChild.childId === child.id;
                                          return (
                                            <div key={child.id} className="flex items-center gap-1.5 bg-surface rounded-lg px-2 py-1.5">
                                              {isEditChild ? (
                                                <>
                                                  <input autoFocus value={editingCascadeChild.label}
                                                    onChange={(e) => setEditingCascadeChild({ ...editingCascadeChild, label: e.target.value })}
                                                    onKeyDown={(e) => { if (e.key === "Enter") saveEditCascadeChild(); if (e.key === "Escape") setEditingCascadeChild(null); }}
                                                    onBlur={saveEditCascadeChild} className="input-field text-xs py-0.5 flex-1" />
                                                  <input type="number" placeholder="₸" value={editingCascadeChild.price}
                                                    onChange={(e) => setEditingCascadeChild({ ...editingCascadeChild, price: e.target.value })}
                                                    onKeyDown={(e) => { if (e.key === "Enter") saveEditCascadeChild(); if (e.key === "Escape") setEditingCascadeChild(null); }}
                                                    onBlur={saveEditCascadeChild} className="input-field text-xs py-0.5 w-20" min="0" />
                                                  <button onClick={saveEditCascadeChild} className="p-1 text-green-600 flex-shrink-0"><Check size={12} /></button>
                                                </>
                                              ) : (
                                                <>
                                                  <button className="flex-1 text-left text-xs text-text hover:text-primary transition-colors"
                                                    onClick={() => setEditingCascadeChild({ critId: crit.id, rootId: root.id, levelIdx: li, childId: child.id, label: child.label, price: String(child.price) })}>
                                                    {child.label}
                                                  </button>
                                                  {child.price > 0 && <span className="text-xs font-semibold text-primary flex-shrink-0">{formatPrice(child.price)}</span>}
                                                  <button
                                                    onClick={() => toggleCascadeChildStock(crit.id, root.id, li, child.id)}
                                                    title="Наличие"
                                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 transition-colors ${
                                                      child.inStock === false ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
                                                    }`}
                                                  >
                                                    {child.inStock === false ? "Нет" : "Есть"}
                                                  </button>
                                                  <button onClick={() => deleteCascadeChild(crit.id, root.id, li, child.id)} className="p-0.5 text-text-muted hover:text-red-500 flex-shrink-0"><Trash2 size={12} /></button>
                                                </>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div className="flex gap-1.5 mt-1">
                                        <input type="text" placeholder={levelName}
                                          value={newChildInput[ck]?.label ?? ""}
                                          onChange={(e) => setNewChildInput((p) => ({ ...p, [ck]: { ...p[ck], label: e.target.value } }))}
                                          className="input-field text-xs py-1 flex-1"
                                          onKeyDown={(e) => e.key === "Enter" && handleAddCascadeChild(crit.id, root.id, li, ck)} />
                                        <input type="number" placeholder="₸"
                                          value={newChildInput[ck]?.price ?? ""}
                                          onChange={(e) => setNewChildInput((p) => ({ ...p, [ck]: { ...p[ck], price: e.target.value } }))}
                                          className="input-field text-xs py-1 w-16" min="0"
                                          onKeyDown={(e) => e.key === "Enter" && handleAddCascadeChild(crit.id, root.id, li, ck)} />
                                        <button onClick={() => handleAddCascadeChild(crit.id, root.id, li, ck)} className="btn-primary py-1 px-2 text-xs flex-shrink-0"><Plus size={11} /></button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add root */}
                      <div className="flex gap-1.5 pt-1 border-t border-border">
                        <input type="text" placeholder={levels[0] ?? "Уровень 1"}
                          value={newRootInput[crit.id]?.label ?? ""}
                          onChange={(e) => setNewRootInput((p) => ({ ...p, [crit.id]: { ...p[crit.id], label: e.target.value } }))}
                          className="input-field text-sm py-1.5 flex-1"
                          onKeyDown={(e) => e.key === "Enter" && handleAddCascadeRoot(crit.id)} />
                        <input type="number" placeholder="₸"
                          value={newRootInput[crit.id]?.price ?? ""}
                          onChange={(e) => setNewRootInput((p) => ({ ...p, [crit.id]: { ...p[crit.id], price: e.target.value } }))}
                          className="input-field text-sm py-1.5 w-24" min="0"
                          onKeyDown={(e) => e.key === "Enter" && handleAddCascadeRoot(crit.id)} />
                        <button onClick={() => handleAddCascadeRoot(crit.id)} className="btn-primary py-1.5 px-3 text-sm"><Plus size={14} /></button>
                      </div>
                    </div>
                  );
                })()}

                {/* Variants (non-cascading) */}
                {crit.type !== "checkbox" && crit.type !== "cascading" && expanded === crit.id && (
                  <div className="p-3 space-y-1.5">
                    {/* Default value selector */}
                    {crit.variants.length > 0 && (
                      <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border">
                        <span className="text-xs text-text-muted font-semibold flex-shrink-0">По умолчанию:</span>
                        <select
                          value={crit.defaultValue ?? ""}
                          onChange={(e) => save(criteria.map((c) => c.id === crit.id ? { ...c, defaultValue: e.target.value } : c))}
                          className="input-field text-xs py-1 flex-1"
                        >
                          <option value="">— не выбрано —</option>
                          {crit.variants.map((v) => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {crit.variants.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
                        {editingVariant?.critId === crit.id && editingVariant.varId === v.id ? (
                          <>
                            <input
                              ref={variantLabelRef}
                              value={editingVariant.label}
                              onChange={(e) => setEditingVariant({ ...editingVariant, label: e.target.value })}
                              onKeyDown={(e) => { if (e.key === "Enter") saveVariant(); if (e.key === "Escape") setEditingVariant(null); }}
                              onBlur={saveVariant}
                              className="input-field text-sm py-1 flex-1"
                              placeholder="Название варианта"
                            />
                            <input
                              type="number"
                              value={editingVariant.price}
                              onChange={(e) => setEditingVariant({ ...editingVariant, price: e.target.value })}
                              onKeyDown={(e) => { if (e.key === "Enter") saveVariant(); if (e.key === "Escape") setEditingVariant(null); }}
                              onBlur={saveVariant}
                              className="input-field text-sm py-1 w-28"
                              min="0"
                              placeholder="Цена ₸"
                            />
                            <button onClick={saveVariant} className="p-1 text-green-600 hover:bg-green-50 rounded flex-shrink-0"><Check size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button
                              className="flex-1 text-left text-sm text-text hover:text-primary transition-colors truncate"
                              onClick={() => setEditingVariant({ critId: crit.id, varId: v.id, label: v.label, price: String(v.price) })}
                              title="Нажмите для редактирования"
                            >
                              {v.label}
                            </button>
                            <button
                              className="text-sm font-semibold text-primary hover:underline flex-shrink-0"
                              onClick={() => setEditingVariant({ critId: crit.id, varId: v.id, label: v.label, price: String(v.price) })}
                              title="Нажмите для редактирования"
                            >
                              {formatPrice(v.price)}
                            </button>
                            <button
                              onClick={() => toggleVariantStock(crit.id, v.id)}
                              title="Наличие варианта"
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 transition-colors ${
                                v.inStock === false ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
                              }`}
                            >
                              {v.inStock === false ? "Нет" : "Есть"}
                            </button>
                            <button onClick={() => deleteVariant(crit.id, v.id)} className="text-text-muted hover:text-red-500 transition-colors flex-shrink-0">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Add variant */}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Вариант (напр. 60 см)"
                        value={newVariant[crit.id]?.label ?? ""}
                        onChange={(e) => setNewVariant((p) => ({ ...p, [crit.id]: { ...p[crit.id], label: e.target.value } }))}
                        className="input-field text-sm flex-1 py-1.5"
                        onKeyDown={(e) => e.key === "Enter" && addVariant(crit.id)}
                      />
                      <input
                        type="number"
                        placeholder="Цена ₸"
                        value={newVariant[crit.id]?.price ?? ""}
                        onChange={(e) => setNewVariant((p) => ({ ...p, [crit.id]: { ...p[crit.id], price: e.target.value } }))}
                        className="input-field text-sm w-28 py-1.5"
                        min="0"
                        onKeyDown={(e) => e.key === "Enter" && addVariant(crit.id)}
                      />
                      <button onClick={() => addVariant(crit.id)} className="btn-primary py-1.5 px-3 text-sm">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add criterion */}
        <div className="p-5 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Добавить параметр</p>
            {criteria.some((c) => c.type === "checkbox") && (
              <p className="text-xs text-text-muted">
                В карточке: <span className="font-semibold text-text">{criteria.filter((c) => c.type === "checkbox" && c.showInCard).length}/3</span>
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["select", "checkbox", "checkbox-group", "cascading"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setNewCritType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  newCritType === t ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/40"
                }`}
              >
                {t === "select" ? "Список" : t === "checkbox" ? "Да / Нет" : t === "checkbox-group" ? "Группа Да/Нет" : "Каскадный"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={newCritType === "checkbox" ? "Название (напр. Подъёмный механизм)" : "Название (напр. Высота изголовья)"}
              value={newCritName}
              onChange={(e) => setNewCritName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCriterion()}
              className="input-field text-sm flex-1"
            />
            {newCritType === "checkbox" && (
              <input
                type="number"
                placeholder="Доплата ₸"
                value={newCritCheckboxPrice}
                onChange={(e) => setNewCritCheckboxPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCriterion()}
                className="input-field text-sm w-32"
                min="0"
              />
            )}
            <button
              onClick={addCriterion}
              disabled={saving || !newCritName.trim()}
              className="btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={15} /> Добавить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
