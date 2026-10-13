import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { readBundle, writeBundle } from "@/lib/bundle-server";
import { getProductById } from "@/lib/products-server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const bundle = readBundle();
  return NextResponse.json(bundle[productId] ?? { manual: [], auto: [] });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  const { manual } = (await req.json()) as { manual: string[] };

  const bundle = readBundle();
  bundle[productId] ??= { manual: [], auto: [] };
  bundle[productId].manual = manual;
  writeBundle(bundle);

  revalidatePath(`/products/${productId}`);
  const product = getProductById(productId);
  if (product?.slug && product.slug !== productId) revalidatePath(`/products/${product.slug}`);
  return NextResponse.json(bundle[productId]);
}
