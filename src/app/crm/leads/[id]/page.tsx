import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLeadById } from "@/lib/leads-server";
import { getOrderForLead } from "@/lib/orders-server";
import { getQuoteForLead } from "@/lib/quotes-server";
import { listAssignableUsers } from "@/lib/users-server";
import { listActiveStages } from "@/lib/stages-server";
import LeadDetail from "@/components/crm/LeadDetail";

export default async function CrmLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  const actor = { id: session?.user?.id ?? "", role: session?.user?.role ?? ("MANAGER" as const) };

  const [lead, order, quote, assignableUsers, allStages] = await Promise.all([
    getLeadById(id, actor),
    getOrderForLead(id, actor),
    getQuoteForLead(id, actor),
    listAssignableUsers(),
    listActiveStages(),
  ]);
  if (!lead) notFound();

  const backRaw = Array.isArray(sp.back) ? sp.back[0] : sp.back;
  const backHref = backRaw && backRaw.startsWith("/crm") ? backRaw : undefined;

  return (
    <LeadDetail
      lead={lead}
      order={order}
      quote={quote}
      allStages={allStages}
      assignableUsers={assignableUsers}
      currentUserId={actor.id}
      currentUserRole={session?.user?.role}
      backHref={backHref}
    />
  );
}
