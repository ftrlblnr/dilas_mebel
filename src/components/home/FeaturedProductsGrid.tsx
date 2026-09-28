"use client";
import { StaggerList, StaggerItem } from "@/components/ui/AnimateIn";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";

export default function FeaturedProductsGrid({ products }: { products: Product[] }) {
  return (
    <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {products.map((p) => (
        <StaggerItem key={p.id}>
          <ProductCard product={p} />
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
