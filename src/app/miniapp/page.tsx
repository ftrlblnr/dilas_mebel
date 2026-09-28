import { auth } from "@/lib/auth";
import LeadsList from "@/components/miniapp/LeadsList";

export default async function MiniAppHomePage() {
  const session = await auth();
  return <LeadsList currentUserId={session?.user?.id ?? ""} currentUserRole={session?.user?.role} />;
}
