import Link from "next/link";
import { CalendarCheck, AlarmClock, Inbox, ClipboardX, Wallet, PartyPopper } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/lead-labels";
import type { getLeadsWithoutOpenTask, getUnassignedNewLeads, getMyOverdueTasks, getPendingPayments } from "@/lib/today-server";

interface Props {
  leadsWithoutTask: Awaited<ReturnType<typeof getLeadsWithoutOpenTask>>;
  unassignedNew: Awaited<ReturnType<typeof getUnassignedNewLeads>>;
  overdueTasks: Awaited<ReturnType<typeof getMyOverdueTasks>>;
  pendingPayments: Awaited<ReturnType<typeof getPendingPayments>>;
  isAdmin: boolean;
}

function Section({
  icon,
  title,
  count,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  tone: "red" | "amber" | "blue" | "green";
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  const toneClass = {
    red: "border-red-200 bg-red-50",
    amber: "border-amber-200 bg-amber-50",
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
  }[tone];
  return (
    <div className={`card p-4 mb-4 border ${toneClass}`}>
      <p className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
        {icon} {title} <span className="text-text-muted font-normal">({count})</span>
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 text-sm bg-white border border-border rounded-lg px-3 py-2 hover:border-primary/40">
      <span className="font-medium text-text truncate">{title}</span>
      <span className="text-xs text-text-muted whitespace-nowrap">{sub}</span>
    </Link>
  );
}

export default function Today({ leadsWithoutTask, unassignedNew, overdueTasks, pendingPayments, isAdmin }: Props) {
  const nothingToDo = leadsWithoutTask.length === 0 && unassignedNew.length === 0 && overdueTasks.length === 0 && pendingPayments.length === 0;

  return (
    <div>
      <h1 className="font-display font-bold text-xl text-text mb-6 flex items-center gap-2">
        <CalendarCheck size={20} /> Сегодня
      </h1>

      {nothingToDo && (
        <div className="card p-10 text-center">
          <PartyPopper size={36} className="text-green-600 mx-auto mb-3" />
          <p className="text-text font-semibold text-sm">Всё разобрано</p>
          <p className="text-text-muted text-xs mt-1">Нет просроченных задач, неразобранных заявок и платежей на проверке</p>
        </div>
      )}

      <Section icon={<AlarmClock size={16} className="text-red-600" />} title="Просроченные задачи" count={overdueTasks.length} tone="red">
        {overdueTasks.map((t) => (
          <Row key={t.id} href={`/crm/leads/${t.lead.id}`} title={`${t.lead.refNumber} — ${t.lead.fullName}`} sub={`срок ${new Date(t.dueAt).toLocaleDateString("ru-RU")}`} />
        ))}
      </Section>

      <Section icon={<Inbox size={16} className="text-blue-600" />} title="Новые заявки без ответственного" count={unassignedNew.length} tone="blue">
        {unassignedNew.map((l) => (
          <Row key={l.id} href={`/crm/leads/${l.id}`} title={`${l.refNumber} — ${l.fullName}`} sub={new Date(l.createdAt).toLocaleDateString("ru-RU")} />
        ))}
      </Section>

      <Section icon={<ClipboardX size={16} className="text-amber-600" />} title="Заявки без следующего шага" count={leadsWithoutTask.length} tone="amber">
        {leadsWithoutTask.map((l) => (
          <Row key={l.id} href={`/crm/leads/${l.id}`} title={`${l.refNumber} — ${l.fullName}`} sub={STATUS_LABEL[l.status]} />
        ))}
      </Section>

      <Section icon={<Wallet size={16} className="text-green-700" />} title={isAdmin ? "Платежи на проверке" : "Мои платежи на проверке"} count={pendingPayments.length} tone="green">
        {pendingPayments.map((p) => (
          <Row key={p.id} href={`/crm/leads/${p.order.lead.id}`} title={`${p.order.lead.refNumber} — ${p.order.lead.fullName}`} sub={formatPrice(p.amount)} />
        ))}
      </Section>
    </div>
  );
}
