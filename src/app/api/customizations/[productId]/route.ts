import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readCustomizations, writeCustomizations } from "@/lib/customizations-server";
import { getProductById } from "@/lib/products-server";
import type { CustomCriterion } from "@/types";

const ADMIN_PASSWORD = "dilas2024";

function authorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${ADMIN_PASSWORD}`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const all = readCustomizations();
  return NextResponse.json(all[productId] ?? []);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  const criteria = (await req.json()) as CustomCriterion[];
  const all = readCustomizations();
  all[productId] = criteria;
  writeCustomizations(all);

  revalidatePath(`/products/${productId}`);
  const product = getProductById(productId);
  if (product?.slug && product.slug !== productId) revalidatePath(`/products/${product.slug}`);
  return NextResponse.json(criteria);
}
