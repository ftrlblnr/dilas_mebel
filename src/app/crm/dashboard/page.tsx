import { auth } from "@/lib/auth";
import { getLeadStats } from "@/lib/leads-server";
import { listMyOpenTasks } from "@/lib/tasks-server";
import { getAverageWonOrderAmount } from "@/lib/orders-server";
import Dashboard from "@/components/crm/Dashboard";

export default async function CrmDashboardPage() {
  const session = await auth();
  const [stats, myTasks, averageWonOrderAmount] = await Promise.all([
    getLeadStats(),
    session?.user?.id ? listMyOpenTasks(session.user.id) : Promise.resolve([]),
    getAverageWonOrderAmount(),
  ]);
  return (
    <Dashboard
      stats={stats}
      myTasks={myTasks}
      averageWonOrderAmount={averageWonOrderAmount}
      isAdmin={session?.user?.role === "ADMIN"}
    />
  );
}
