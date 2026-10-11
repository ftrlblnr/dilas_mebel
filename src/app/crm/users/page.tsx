import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/users-server";
import { getCrmSettings } from "@/lib/crm-settings-server";
import UsersManager from "@/components/crm/UsersManager";

export default async function CrmUsersPage() {
  const session = await requireAdmin();
  const [users, settings] = await Promise.all([listUsers(), getCrmSettings()]);
  return <UsersManager users={users} currentUserId={session.user.id} managerDiscountLimitPercent={settings.managerDiscountLimitPercent} />;
}
