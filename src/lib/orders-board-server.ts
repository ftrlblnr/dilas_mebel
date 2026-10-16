import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { LeadActor } from "@/lib/leads-server";
import { leadScopeCondition } from "@/lib/leads-server";

const ORDER_BOARD_INCLUDE = {
  stage: true,
  assignedTo: { select: { id: true, name: true } },
  customer: { select: { fullName: true, phone: true } },
  order: {
    select: {
      amount: true,
      payments: { select: { status: true, amount: true, refunds: { select: { amount: true } } } },
    },
  },
  tasks: {
    where: { completedAt: null },
    orderBy: { dueAt: "asc" as const },
    take: 1,
    select: { dueAt: true, type: true },
  },
};

export type BoardLead = Prisma.LeadGetPayload<{ include: typeof ORDER_BOARD_INCLUDE }>;

export function rowTotals(lead: BoardLead) {
  const amount = lead.order?.amount ?? lead.totalPrice;
  if (!lead.order) return { amount, paid: null as number | null, remaining: null as number | null };
  let paid = 0;
  for (const p of lead.order.payments) {
    if (p.status !== "CONFIRMED") continue;
    paid += p.amount;
    for (const r of p.refunds) paid -= r.amount;
  }
  return { amount, paid, remaining: amount - paid };
}

export function isAttention(lead: BoardLead): boolean {
  if (!lead.assignedToId) return true;
  const task = lead.tasks[0];
  return !!task && task.dueAt.getTime() < Date.now();
}

export interface BoardFilter {
  managerId?: string;
  search?: string;
}

function buildBoardWhere(filter: BoardFilter, actor: LeadActor, extra?: Prisma.LeadWhereInput): Prisma.LeadWhereInput {
  const conditions: Prisma.LeadWhereInput[] = [{ archivedAt: null }];
  if (extra) conditions.push(extra);
  if (filter.managerId) conditions.push({ assignedToId: filter.managerId });
  if (filter.search?.trim()) {
    const term = filter.search.trim();
    conditions.push({ OR: [{ fullName: { contains: term } }, { phone: { contains: term } }, { refNumber: { contains: term } }] });
  }
  const scope = leadScopeCondition(actor);
  if (scope) conditions.push(scope);
  return { AND: conditions };
}

export interface KanbanFilter extends BoardFilter {
  attention?: boolean;
}

export async function listOrdersForKanban(filter: KanbanFilter, actor: LeadActor): Promise<BoardLead[]> {
  const where = buildBoardWhere(filter, actor, { stage: { type: { not: "LOSE" } } });
  const leads = await prisma.lead.findMany({ where, include: ORDER_BOARD_INCLUDE, orderBy: { createdAt: "desc" } });
  return filter.attention ? leads.filter(isAttention) : leads;
}

export type TableTab = "active" | "unassigned" | "late" | "closed" | "all";

export interface TableFilter extends BoardFilter {
  tableTab?: TableTab;
  page?: number;
  pageSize?: number;
}

export interface TableResult {
  leads: BoardLead[];
  total: number;
}

export async function listOrdersForTable(filter: TableFilter, actor: LeadActor): Promise<TableResult> {
  let extra: Prisma.LeadWhereInput | undefined;
  switch (filter.tableTab) {
    case "unassigned":
      extra = { assignedToId: null };
      break;
    case "late":
      extra = { tasks: { some: { completedAt: null, dueAt: { lt: new Date() } } } };
      break;
    case "closed":
      extra = { stage: { type: { in: ["WIN", "LOSE"] } } };
      break;
    case "all":
      extra = undefined;
      break;
    default:
      extra = { stage: { type: "WORK" } };
  }
  const where = buildBoardWhere(filter, actor, extra);
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = filter.pageSize ?? 20;
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: ORDER_BOARD_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ]);
  return { leads, total };
}
