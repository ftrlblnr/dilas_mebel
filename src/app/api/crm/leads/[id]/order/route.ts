import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createOrder, getOrderForLead } from "@/lib/orders-server";

const postSchema = z.object({
  amount: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional(),
  discountReason: z.string().trim().max(500).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const order = await getOrderForLead(id, { id: session.user.id, role: session.user.role ?? "MANAGER" });
  return NextResponse.json(order);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    const order = await createOrder(id, parsed.data, { id: session.user.id, role: session.user.role ?? "MANAGER" });
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось создать заказ" }, { status: 400 });
  }
}
