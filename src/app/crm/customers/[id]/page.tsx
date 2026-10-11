import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCustomerById } from "@/lib/customers-server";
import { listLeads } from "@/lib/leads-server";
import CustomerDetail from "@/components/crm/CustomerDetail";

export default async function CrmCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const { leads } = await listLeads(
    { customerId: id, includeArchived: true, all: true },
    session?.user?.id ? { id: session.user.id, role: session.user.role ?? "MANAGER" } : undefined
  );

  return <CustomerDetail customer={customer} leads={leads} />;
}
