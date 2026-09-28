import { auth } from "@/lib/auth";
import { listLeads } from "@/lib/leads-server";
import { listAssignableUsers } from "@/lib/users-server";
import LeadsInboard from "@/components/crm/LeadsInboard";
import type { LeadSource, LeadStatus } from "@prisma/client";

const PAGE_SIZE = 20;

export default async function CrmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const session = await auth();

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = one(sp.status) as LeadStatus | undefined;
  const source = one(sp.source) as LeadSource | undefined;
  const assignedToId = one(sp.assignedToId);
  const search = one(sp.search);
  const dateFrom = one(sp.dateFrom);
  const dateTo = one(sp.dateTo);
  const page = Number(one(sp.page)) || 1;
  const includeArchived = one(sp.archived) === "1";

  const [{ leads, total }, assignableUsers] = await Promise.all([
    listLeads(
      {
        status,
        source,
        assignedToId,
        search,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(`${dateTo}T23:59:59`) : undefined,
        page,
        pageSize: PAGE_SIZE,
        includeArchived,
      },
      session?.user?.id ? { id: session.user.id, role: session.user.role ?? "MANAGER" } : undefined
    ),
    listAssignableUsers(),
  ]);

  return (
    <LeadsInboard
      leads={leads}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      assignableUsers={assignableUsers}
      currentUserId={session?.user?.id ?? ""}
      currentUserRole={session?.user?.role}
      filters={{ status, source, assignedToId, search, dateFrom, dateTo, archived: includeArchived ? "1" : undefined }}
    />
  );
}
