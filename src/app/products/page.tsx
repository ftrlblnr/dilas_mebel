import { Suspense } from "react";
import ProductListingContent from "@/components/products/ProductListingContent";
import { readProducts } from "@/lib/products-server";
import { readCategories } from "@/lib/categories-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Все товары",
  description: "Каталог мебели Dilas — диваны, кровати, обеденные столы и многое другое.",
};

export default function ProductsPage() {
  const products = readProducts();
  const categories = readCategories();
  return (
    <Suspense fallback={<div className="container-content py-20 text-center text-text-muted">Загрузка...</div>}>
      <ProductListingContent products={products} categories={categories} />
    </Suspense>
  );
}
