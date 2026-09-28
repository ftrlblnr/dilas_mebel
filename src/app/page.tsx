import HeroSplit from "@/components/home/HeroSplit";
import TrustBadges from "@/components/home/TrustBadges";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import GallerySection from "@/components/home/GallerySection";
import YoutubeSection from "@/components/home/YoutubeSection";
import { readSettings } from "@/lib/settings-server";
import { readCategories, type NavCategory } from "@/lib/categories-server";
import { readProducts, getSaleProducts } from "@/lib/products-server";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dilas Мебель — Сделайте дом уютным",
  description: "Мебельный магазин Dilas — диваны, кровати, обеденные столы. Бесплатная доставка от 150 000 ₸.",
};

function buildCategoryCounts(categories: NavCategory[], products: Product[]): Record<string, number> {
  const saleCount = getSaleProducts().length;
  const counts: Record<string, number> = {};
  for (const cat of categories) {
    counts[cat.slug] = cat.isSale
      ? saleCount
      : products.filter((p) => p.category === cat.slug || p.subcategory === cat.slug).length;
  }
  return counts;
}

export default function HomePage() {
  const settings = readSettings();
  const categories = readCategories();
  const products = readProducts();
  const counts = buildCategoryCounts(categories, products);

  return (
    <div>
      <HeroSplit categories={categories} counts={counts} />
      <TrustBadges />
      <FeaturedProducts />
      <GallerySection
        layout={settings.gallery?.layout ?? "grid-2rows"}
        photos={settings.gallery?.photos ?? [null, null, null, null, null, null]}
      />
      <YoutubeSection url={settings.youtubeUrl} />
    </div>
  );
}
