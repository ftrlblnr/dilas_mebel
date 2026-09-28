import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readProducts, writeProducts } from "@/lib/products-server";
import type { Product } from "@/types";

const ADMIN_PASSWORD = "dilas2024";

function authorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${ADMIN_PASSWORD}`;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as Partial<Product>;
  if (body.slug) body.slug = body.slug.replace(/\//g, "-");
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldSlug = products[idx].slug;
  const updated = { ...products[idx], ...body, id };
  products[idx] = updated;
  writeProducts(products);

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/sale");
  revalidatePath(`/products/${id}`);
  // Карточка товара открывается по slug (см. ProductCard), а не по id —
  // без этого страница по старому/новому slug остаётся в кэше со старой ценой.
  if (oldSlug && oldSlug !== id) revalidatePath(`/products/${oldSlug}`);
  if (updated.slug && updated.slug !== id && updated.slug !== oldSlug) revalidatePath(`/products/${updated.slug}`);

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const products = readProducts();
  const target = products.find((p) => p.id === id);
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  writeProducts(filtered);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/sale");
  revalidatePath(`/products/${id}`);
  if (target?.slug && target.slug !== id) revalidatePath(`/products/${target.slug}`);

  return NextResponse.json({ ok: true });
}
