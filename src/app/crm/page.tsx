import { auth } from "@/lib/auth";
import { listAssignableUsers } from "@/lib/users-server";
import { listActiveStages } from "@/lib/stages-server";
import { listOrdersForKanban, listOrdersForTable, isAttention } from "@/lib/orders-board-server";
import { formatPrice } from "@/lib/utils";
import OrdersHeader from "@/components/crm/OrdersHeader";
import OrdersKanban from "@/components/crm/OrdersKanban";
import OrdersTable from "@/components/crm/OrdersTable";
import type { TableTab } from "@/lib/orders-board-server";

const PAGE_SIZE = 20;

export default async function CrmOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const actor = { id: session?.user?.id ?? "", role: session?.user?.role ?? ("MANAGER" as const) };

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const view = one(sp.view) === "table" ? "table" : "kanban";
  const search = one(sp.search);
  const managerId = one(sp.managerId);
  const attention = one(sp.attention) === "1";
  const tableTab = one(sp.tableTab) as TableTab | undefined;
  const page = Number(one(sp.page)) || 1;

  const backHref = (() => {
    const params = new URLSearchParams();
    params.set("view", view);
    if (search) params.set("search", search);
    if (managerId) params.set("managerId", managerId);
    if (attention) params.set("attention", "1");
    if (tableTab) params.set("tableTab", tableTab);
    if (page > 1) params.set("page", String(page));
    return `/crm?${params.toString()}`;
  })();

  const [assignableUsers, stages] = await Promise.all([listAssignableUsers(), listActiveStages()]);

  if (view === "table") {
    const { leads, total } = await listOrdersForTable({ managerId, search, tableTab, page, pageSize: PAGE_SIZE }, actor);
    return (
      <div>
        <OrdersHeader view="table" subtitle={`${total} заказ(ов)`} search={search} managerId={managerId} assignableUsers={assignableUsers} />
        <OrdersTable
          leads={leads}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          filters={{ managerId, tableTab, search }}
          assignableUsers={assignableUsers}
          backHref={backHref}
        />
      </div>
    );
  }

  const kanbanLeads = await listOrdersForKanban({ managerId, search, attention }, actor);
  const allActiveLeads = attention ? await listOrdersForKanban({ managerId, search }, actor) : kanbanLeads;
  const attentionCount = allActiveLeads.filter(isAttention).length;
  const totalSum = kanbanLeads.reduce((s, l) => s + (l.order?.amount ?? l.totalPrice), 0);

  return (
    <div>
      <OrdersHeader
        view="kanban"
        subtitle={`${kanbanLeads.length} активных · ${formatPrice(totalSum)} в работе`}
        search={search}
        attention={attention}
        managerId={managerId}
        assignableUsers={assignableUsers}
        attentionCount={attentionCount}
      />
      <OrdersKanban leads={kanbanLeads} stages={stages} backHref={backHref} />
    </div>
  );
}
