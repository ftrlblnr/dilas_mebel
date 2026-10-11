import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateOrder, setAgreementStatus, setTransferStatus } from "@/lib/orders-server";

const patchSchema = z.object({
  amount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountReason: z.string().trim().max(500).nullable().optional(),
  agreementStatus: z.enum(["DRAFT", "ACCEPTED", "CANCELED"]).optional(),
  transferStatus: z.enum(["NOT_TRANSFERRED", "TRANSFERRED", "CONFIRMED_RECEIVED"]).optional(),
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
  const { amount, discountPercent, discountReason, agreementStatus, transferStatus } = parsed.data;

  try {
    let order;
    if (amount !== undefined || discountPercent !== undefined || discountReason !== undefined) {
      order = await updateOrder(id, { amount, discountPercent, discountReason }, actor);
    }
    if (agreementStatus !== undefined) {
      order = await setAgreementStatus(id, agreementStatus, actor);
    }
    if (transferStatus !== undefined) {
      order = await setTransferStatus(id, transferStatus, actor);
    }
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось обновить заказ" }, { status: 400 });
  }
}
