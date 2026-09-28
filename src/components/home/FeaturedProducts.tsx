import { getFeaturedProducts } from "@/lib/products-server";
import Link from "next/link";
import { AnimateIn } from "@/components/ui/AnimateIn";
import FeaturedProductsGrid from "./FeaturedProductsGrid";

export default function FeaturedProducts() {
  const products = getFeaturedProducts();

  return (
    <section className="section-padding bg-white">
      <div className="container-content">
        <AnimateIn className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-text">
              Лучшие товары
            </h2>
            <p className="text-text-muted text-sm mt-1">Выбор покупателей</p>
          </div>
          <Link href="/products" className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors hidden md:block">
            Смотреть все →
          </Link>
        </AnimateIn>
        <FeaturedProductsGrid products={products} />
        <div className="text-center mt-8 md:hidden">
          <Link href="/products" className="btn-secondary inline-block px-8">
            Смотреть все
          </Link>
        </div>
      </div>
    </section>
  );
}
