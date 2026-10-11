import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { confirmPayment, rejectPayment } from "@/lib/orders-server";

const patchSchema = z.object({
  action: z.enum(["confirm", "reject"]),
  reason: z.string().trim().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  const actor = { id: session.user.id, role: session.user.role ?? ("MANAGER" as const) };
  try {
    const payment =
      parsed.data.action === "confirm"
        ? await confirmPayment(id, actor)
        : await rejectPayment(id, parsed.data.reason ?? "", actor);
    return NextResponse.json(payment);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось обновить платёж" }, { status: 403 });
  }
}
