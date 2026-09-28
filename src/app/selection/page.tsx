"use client";
import { Trash2, Plus, Minus, ArrowRight, Sofa } from "lucide-react";
import Link from "next/link";
import { useSelectionStore } from "@/store/selectionStore";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export default function SelectionPage() {
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice } = useSelectionStore();

  if (items.length === 0) {
    return (
      <div className="container-content py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mb-6 mx-auto">
          <Sofa size={40} strokeWidth={1.25} className="text-text-muted" />
        </div>
        <h1 className="font-display font-bold text-2xl text-text mb-3">Ваш список пуст</h1>
        <p className="text-text-muted mb-8">Просматривайте товары и добавляйте понравившиеся в список</p>
        <Link href="/products" className="btn-primary inline-block px-8 py-3">
          Смотреть товары
        </Link>
      </div>
    );
  }

  return (
    <div className="container-content py-8">
      <h1 className="font-display font-bold text-2xl md:text-3xl text-text mb-8">Мой список</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="card p-4 flex gap-4">
              <Link href={`/products/${item.product.id}`}>
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.id}`}>
                  <h3 className="font-semibold text-text hover:text-primary transition-colors mb-1 truncate">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-base font-bold text-primary mb-3">
                  {formatPrice(item.product.salePrice ?? item.product.price)}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-2 hover:bg-surface transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 text-sm font-bold border-x border-border py-1.5">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-2 hover:bg-surface transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} /> Удалить
                  </button>
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden md:block">
                <p className="font-bold text-text">
                  {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-28">
            <h2 className="font-display font-bold text-lg text-text mb-5">Детали заказа</h2>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Количество товаров</span>
                <span className="font-semibold text-text">{getTotalItems()} шт.</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-3">
                <span className="text-text-muted">Примерная сумма</span>
                <span className="font-display font-bold text-xl text-primary">{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
            <Link
              href="/callback"
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              Запросить обратный звонок <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-text-muted text-center mt-3">
              * Точная цена будет подтверждена менеджером
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
