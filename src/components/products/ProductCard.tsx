"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useSelectionStore } from "@/store/selectionStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const { addItem } = useSelectionStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
    >
    <Link href={`/products/${product.slug || product.id}`} className="group card block overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {product.isNew && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm w-fit">
              Новинка
            </span>
          )}
          {product.isPopular && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm w-fit">
              Популярное
            </span>
          )}
          {discount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm w-fit">
              -{discount}%
            </span>
          )}
        </div>
        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          aria-label="Добавить в избранное"
        >
          <Heart size={16} className={cn(wishlisted ? "text-red-500 fill-red-500" : "text-text-muted")} />
        </button>
        {/* Add button */}
        <button
          onClick={handleAdd}
          className={cn(
            "absolute bottom-3 left-3 right-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5",
            added
              ? "bg-green-600 text-white opacity-100"
              : "bg-primary text-white opacity-0 group-hover:opacity-100"
          )}
        >
          <ShoppingBag size={14} />
          {added ? "Добавлено ✓" : "Добавить в список"}
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-text text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-[10px] text-green-600 font-medium mb-1">
          {product.inStock ? "В наличии и под заказ" : "Под заказ"}
        </p>
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-base text-primary">
            {formatPrice(product.salePrice ?? product.price)}
          </span>
          {product.salePrice && (
            <span className="text-xs text-text-muted line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
    </motion.div>
  );
}
