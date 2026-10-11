import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createRefund } from "@/lib/orders-server";

const postSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().trim().min(1).max(500),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    const refund = await createRefund(id, parsed.data, { id: session.user.id, role: session.user.role ?? "MANAGER" });
    return NextResponse.json(refund);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось оформить возврат" }, { status: 400 });
  }
}
