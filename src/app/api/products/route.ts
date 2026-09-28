import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readProducts, writeProducts } from "@/lib/products-server";
import type { Product } from "@/types";

const ADMIN_PASSWORD = "dilas2024";

function authorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${ADMIN_PASSWORD}`;
}

export async function GET() {
  const products = readProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Omit<Product, "id" | "createdAt">;
  const products = readProducts();

  // Слаг не должен содержать слэши — иначе Next.js [id] роут даст 404
  if (body.slug) body.slug = body.slug.replace(/\//g, "-");

  const maxId = products.reduce((m, p) => Math.max(m, Number(p.id)), 0);
  const newProduct: Product = {
    ...body,
    id: String(maxId + 1),
    createdAt: new Date().toISOString().split("T")[0],
  };

  writeProducts([...products, newProduct]);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/sale");

  return NextResponse.json(newProduct, { status: 201 });
}
