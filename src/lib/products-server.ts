import "server-only";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Product } from "@/types";

const DB_PATH = join(process.cwd(), "data", "products.json");

export function readProducts(): Product[] {
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as Product[];
}

export function writeProducts(products: Product[]): void {
  writeFileSync(DB_PATH, JSON.stringify(products, null, 2), "utf-8");
}

export function getProductById(id: string): Product | undefined {
  const products = readProducts();
  return products.find((p) => p.id === id) ?? products.find((p) => p.slug === id);
}

export function getFeaturedProducts(): Product[] {
  return readProducts().filter((p) => p.featured);
}

export function getSaleProducts(): Product[] {
  return readProducts().filter((p) => p.salePrice);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return readProducts().filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}
