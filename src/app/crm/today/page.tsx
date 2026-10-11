import { auth } from "@/lib/auth";
import { getLeadsWithoutOpenTask, getUnassignedNewLeads, getMyOverdueTasks, getPendingPayments } from "@/lib/today-server";
import Today from "@/components/crm/Today";

export default async function CrmTodayPage() {
  const session = await auth();
  const actor = { id: session?.user?.id ?? "", role: session?.user?.role ?? ("MANAGER" as const) };

  const [leadsWithoutTask, unassignedNew, overdueTasks, pendingPayments] = await Promise.all([
    getLeadsWithoutOpenTask(actor),
    getUnassignedNewLeads(),
    getMyOverdueTasks(actor.id),
    getPendingPayments(actor),
  ]);

  return (
    <Today
      leadsWithoutTask={leadsWithoutTask}
      unassignedNew={unassignedNew}
      overdueTasks={overdueTasks}
      pendingPayments={pendingPayments}
      isAdmin={actor.role === "ADMIN"}
    />
  );
}
