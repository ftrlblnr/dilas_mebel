import { notFound } from "next/navigation";
import { getProductById, readProducts } from "@/lib/products-server";
import { getBundleProducts } from "@/lib/bundle-server";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import type { Metadata } from "next";

export const dynamicParams = true;

export async function generateStaticParams() {
  const products = readProducts();
  const params: { id: string }[] = [];
  for (const p of products) {
    params.push({ id: p.id });
    if (p.slug && p.slug !== p.id) params.push({ id: p.slug });
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const allProducts = readProducts();

  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const bundle = getBundleProducts(product.id, allProducts);

  return <ProductDetailClient product={product} related={related} bundle={bundle} />;
}
