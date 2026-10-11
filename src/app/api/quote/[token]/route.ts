import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVersionByPublicToken, recordPublicView, acceptPublicly, computeQuoteVersionTotal, isQuoteVersionExpired } from "@/lib/quotes-server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const version = await getVersionByPublicToken(token);
  if (!version) return NextResponse.json({ message: "Предложение не найдено" }, { status: 404 });

  await recordPublicView(token);

  return NextResponse.json({
    refNumber: version.quote.lead.refNumber,
    managerName: version.quote.createdBy.name,
    status: version.status,
    validUntil: version.validUntil,
    expired: isQuoteVersionExpired(version),
    total: computeQuoteVersionTotal(version),
    items: version.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineDiscountPercent: i.lineDiscountPercent,
      description: i.description,
    })),
  });
}

const postSchema = z.object({ action: z.literal("accept") });

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    await acceptPublicly(token);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось принять предложение" }, { status: 400 });
  }
}
