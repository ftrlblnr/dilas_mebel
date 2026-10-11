import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveDiscount } from "@/lib/orders-server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  try {
    const order = await approveDiscount(id, { id: session.user.id, role: session.user.role ?? "MANAGER" });
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось согласовать скидку" }, { status: 403 });
  }
}
