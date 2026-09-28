import { getSaleProducts } from "@/lib/products-server";
import ProductCard from "@/components/products/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Товары со скидкой" };

export default function SalePage() {
  const saleProducts = getSaleProducts();

  return (
    <div>
      <div className="bg-primary py-12">
        <div className="container-content text-center text-white">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-2 text-white">
            Летние скидки
          </h1>
          <p className="text-blue-200 text-base">Скидки до 30% — время ограничено!</p>
        </div>
      </div>
      <div className="container-content py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {saleProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
