import { getLeadStats } from "@/lib/leads-server";
import Dashboard from "@/components/crm/Dashboard";

export default async function CrmDashboardPage() {
  const stats = await getLeadStats();
  return <Dashboard stats={stats} />;
}
