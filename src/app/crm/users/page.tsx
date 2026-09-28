import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/users-server";
import UsersManager from "@/components/crm/UsersManager";

export default async function CrmUsersPage() {
  const session = await requireAdmin();
  const users = await listUsers();
  return <UsersManager users={users} currentUserId={session.user.id} />;
}
