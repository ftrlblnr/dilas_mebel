import LeadDetail from "@/components/miniapp/LeadDetail";

export default async function MiniAppLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeadDetail leadId={id} />;
}
