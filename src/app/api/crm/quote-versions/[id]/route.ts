import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateQuoteVersionItems, updateQuoteVersionDiscount, markSent } from "@/lib/quotes-server";

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

const patchSchema = z.object({
  items: z.array(itemSchema).min(1).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountReason: z.string().trim().max(500).nullable().optional(),
  action: z.enum(["send"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const actor = { id: session.user.id, role: session.user.role ?? ("MANAGER" as const) };
  const { items, discountPercent, discountReason, action } = parsed.data;

  try {
    let result;
    if (items !== undefined) {
      result = await updateQuoteVersionItems(id, items, actor);
    }
    if (discountPercent !== undefined) {
      result = await updateQuoteVersionDiscount(id, { discountPercent, discountReason }, actor);
    }
    if (action === "send") {
      result = await markSent(id, actor);
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось обновить предложение" }, { status: 400 });
  }
}
