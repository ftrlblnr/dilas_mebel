import { auth } from "@/lib/auth";
import { listLeads } from "@/lib/leads-server";
import MessagesPrototype, { type RealLead } from "@/components/crm/MessagesPrototype";

export default async function CrmMessagesPage() {
  const session = await auth();
  const actor = { id: session!.user!.id!, role: session!.user!.role ?? "MANAGER" } as const;
  const { leads } = await listLeads({ pageSize: 50 }, actor);

  const realLeads: RealLead[] = leads.map((l) => {
    // l.order.payments is already pre-filtered to status: "CONFIRMED" by listLeads
    const netReceipts = l.order?.payments.reduce((sum, p) => sum + p.amount - p.refunds.reduce((s, r) => s + r.amount, 0), 0) ?? 0;
    return {
      id: l.id,
      refNumber: l.refNumber,
      fullName: l.fullName,
      phone: l.phone,
      stageKey: l.stage.key,
      stageName: l.stage.name,
      stageColor: l.stage.color,
      assignedToName: l.assignedTo?.name ?? null,
      orderAmount: l.order?.amount ?? null,
      orderRemaining: l.order ? l.order.amount - netReceipts : null,
    };
  });

  return <MessagesPrototype currentUserName={session?.user?.name ?? "Вы"} realLeads={realLeads} />;
}
