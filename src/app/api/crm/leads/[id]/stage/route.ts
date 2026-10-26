import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getLeadById, advanceLeadStage, cancelLeadStage } from "@/lib/leads-server";
import { getOrderForLead, setAgreementStatus } from "@/lib/orders-server";
import { getQuoteForLead } from "@/lib/quotes-server";
import { getTransitionRule, canCancelStage } from "@/lib/stage-transitions";
import { getStageByKey } from "@/lib/stages-server";

const patchSchema = z.object({
  action: z.enum(["advance", "cancel"]),
  cancelReason: z.enum(["PRICE", "TIMELINE", "COMPETITOR", "CHANGED_MIND", "OTHER"]).optional(),
  cancelNote: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  const actorRole = session.user.role ?? "MANAGER";
  const actor = { id: session.user.id, role: actorRole };

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  const lead = await getLeadById(id, actor);
  if (!lead) return NextResponse.json({ message: "Заявка не найдена" }, { status: 404 });

  if (parsed.data.action === "cancel") {
    if (!canCancelStage(lead.stage.type, actorRole)) {
      return NextResponse.json({ message: "Эту заявку нельзя отменить" }, { status: 400 });
    }
    if (!parsed.data.cancelReason) {
      return NextResponse.json({ message: "Укажите причину отказа" }, { status: 400 });
    }
    const updated = await cancelLeadStage(id, actor.id, parsed.data.cancelReason, parsed.data.cancelNote ?? null);
    return NextResponse.json(updated);
  }

  const rule = getTransitionRule(lead.stage.key);
  if (!rule) return NextResponse.json({ message: "Этот этап финальный — переход недоступен" }, { status: 400 });
  if (!rule.allowedRoles.includes(actorRole)) {
    return NextResponse.json({ message: "У вас нет прав для этого действия" }, { status: 403 });
  }

  const [order, quote] = await Promise.all([getOrderForLead(id, actor), getQuoteForLead(id, actor)]);
  const guard = rule.guard({ lead, order, quote, actorRole });
  if (!guard.ok) return NextResponse.json({ message: guard.reason }, { status: 400 });

  const toStage = await getStageByKey(rule.toKey);
  if (!toStage) return NextResponse.json({ message: "Целевой этап не найден" }, { status: 500 });

  const updated = await advanceLeadStage(id, toStage.id, actor.id);

  // "Договорённость" no longer has a manual control in the UI — reaching "Ожидает
  // оплату" means terms were agreed, so reflect that on the order automatically.
  if (rule.toKey === "AWAITING_PAYMENT" && order) {
    await setAgreementStatus(order.id, "ACCEPTED", actor).catch((err) => console.error("setAgreementStatus failed:", err));
  }

  return NextResponse.json(updated);
}
