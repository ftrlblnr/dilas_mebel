"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import ProductCard from "@/components/products/ProductCard";

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="container-content py-8">
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-primary">Главная</Link>
        <span>/</span>
        <span className="text-text font-semibold">Список желаний</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-text">Список желаний</h1>
          {items.length > 0 && (
            <p className="text-text-muted text-sm mt-1">{items.length} товар{items.length === 1 ? "" : items.length < 5 ? "а" : "ов"}</p>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="btn-secondary text-sm px-4 py-2"
          >
            Очистить список
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
            <Heart size={36} className="text-text-muted" />
          </div>
          <h2 className="font-display font-bold text-xl text-text mb-2">Список желаний пуст</h2>
          <p className="text-text-muted mb-8 max-w-sm">
            Добавляйте понравившиеся товары в список желаний, нажимая на иконку сердечка
          </p>
          <Link href="/products" className="btn-primary px-8 py-3">
            Смотреть товары
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
