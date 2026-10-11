import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { addScheduleRow } from "@/lib/orders-server";

const postSchema = z.object({
  dueDate: z.string().min(1),
  amount: z.number().min(0),
  note: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    const row = await addScheduleRow(
      id,
      { dueDate: new Date(parsed.data.dueDate), amount: parsed.data.amount, note: parsed.data.note },
      { id: session.user.id, role: session.user.role ?? "MANAGER" }
    );
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось добавить строку графика" }, { status: 400 });
  }
}
