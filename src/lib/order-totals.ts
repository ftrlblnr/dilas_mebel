// Pure calculation, no DB/IO — deliberately NOT "server-only" so client components
// (e.g. stage-transitions.ts's guards, used from LeadDetail.tsx) can import it too.
export function computeOrderTotals(order: { amount: number; payments: { status: string; amount: number; refunds: { amount: number }[] }[] }) {
  let netReceipts = 0;
  for (const p of order.payments) {
    if (p.status !== "CONFIRMED") continue;
    netReceipts += p.amount;
    for (const r of p.refunds) netReceipts -= r.amount;
  }
  return { netReceipts, remaining: order.amount - netReceipts };
}
