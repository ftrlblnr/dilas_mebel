import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createQuoteVersion } from "@/lib/quotes-server";

const itemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().trim().min(1),
  productImage: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  lineDiscountPercent: z.number().min(0).max(100).optional(),
  isManual: z.boolean().optional(),
  description: z.string().trim().max(500).optional(),
});

const postSchema = z.object({
  items: z.array(itemSchema).min(1),
  discountPercent: z.number().min(0).max(100).optional(),
  discountReason: z.string().trim().max(500).optional(),
  validUntil: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    const version = await createQuoteVersion(
      id,
      { ...parsed.data, validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined },
      { id: session.user.id, role: session.user.role ?? "MANAGER" }
    );
    return NextResponse.json(version);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось создать предложение" }, { status: 400 });
  }
}
