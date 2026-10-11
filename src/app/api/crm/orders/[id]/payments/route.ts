import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { submitPayment } from "@/lib/orders-server";

const postSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "OTHER"]),
  externalRef: z.string().trim().max(200).optional(),
  note: z.string().trim().max(500).optional(),
  payerName: z.string().trim().max(200).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    const payment = await submitPayment(id, parsed.data, { id: session.user.id, role: session.user.role ?? "MANAGER" });
    return NextResponse.json(payment);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось отправить платёж" }, { status: 400 });
  }
}
