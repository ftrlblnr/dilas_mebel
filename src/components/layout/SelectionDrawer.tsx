"use client";
import { X, Trash2, Plus, Minus, Sofa } from "lucide-react";
import Link from "next/link";
import { useSelectionStore } from "@/store/selectionStore";
import { formatPrice } from "@/lib/utils";

export default function SelectionDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity, getTotalItems, getTotalPrice } = useSelectionStore();

  if (!isDrawerOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={closeDrawer} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-lg text-text">Мой список</h2>
            <p className="text-xs text-text-muted">{getTotalItems()} товара</p>
          </div>
          <button onClick={closeDrawer} className="p-2 rounded-md hover:bg-surface transition-colors">
            <X size={20} className="text-text" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center">
                <Sofa size={32} strokeWidth={1.5} className="text-text-muted" />
              </div>
              <p className="text-text-muted text-sm">Вы ещё ничего не выбрали</p>
              <button onClick={closeDrawer} className="btn-primary text-xs px-5 py-2">
                Смотреть товары
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 bg-surface rounded-lg p-3">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text leading-tight mb-1 truncate">{item.product.name}</p>
                    <p className="text-sm font-bold text-primary mb-2">
                      {formatPrice(item.product.salePrice ?? item.product.price)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-border rounded-md">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-surface-alt transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-surface-alt transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">Примерная сумма</span>
              <span className="font-display font-bold text-lg text-text">{formatPrice(getTotalPrice())}</span>
            </div>
            <Link href="/callback" onClick={closeDrawer} className="btn-primary w-full text-center block py-3">
              Запросить обратный звонок
            </Link>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-text-muted">* Цена уточняется менеджером</p>
              <Link href="/selection" onClick={closeDrawer} className="text-xs text-text-muted hover:text-primary transition-colors">
                Полный список →
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
