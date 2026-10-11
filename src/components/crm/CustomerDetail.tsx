import Link from "next/link";
import { User, ArrowLeft } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/lead-labels";
import type { Customer } from "@prisma/client";
import type { LeadWithNotes } from "@/lib/leads-server";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CustomerDetail({ customer, leads }: { customer: Customer; leads: LeadWithNotes[] }) {
  return (
    <div>
      <Link href="/crm" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary mb-4">
        <ArrowLeft size={14} /> Назад к заявкам
      </Link>

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={18} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-text">{customer.fullName}</h1>
            <p className="text-xs text-text-muted">Клиент с {formatDate(customer.createdAt)}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <p><span className="text-text-muted">Телефон: </span>+7{customer.phone}</p>
          {customer.email && <p><span className="text-text-muted">Email: </span>{customer.email}</p>}
          {customer.city && <p><span className="text-text-muted">Город: </span>{customer.city}</p>}
        </div>
      </div>

      <div className="card p-5">
        <p className="text-xs text-text-muted mb-3 font-semibold">Заявки клиента ({leads.length})</p>
        {leads.length === 0 ? (
          <p className="text-sm text-text-muted">В вашей области видимости у этого клиента нет заявок</p>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/crm?search=${encodeURIComponent(lead.refNumber)}`}
                className="flex items-center justify-between gap-3 text-sm bg-white border border-border rounded-lg px-3 py-2 hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-primary text-xs">{lead.refNumber}</p>
                  <p className="text-xs text-text-muted">{formatDate(lead.createdAt)}</p>
                </div>
                {lead.totalPrice > 0 && <span className="font-semibold text-text">{formatPrice(lead.totalPrice)}</span>}
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", STATUS_STYLE[lead.status])}>
                  {STATUS_LABEL[lead.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
