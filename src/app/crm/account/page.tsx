import { auth } from "@/lib/auth";
import { getTelegramLinkStatus } from "@/lib/users-server";
import AccountSettings from "@/components/crm/AccountSettings";

export default async function CrmAccountPage() {
  const session = await auth();
  const { linked } = session?.user?.id ? await getTelegramLinkStatus(session.user.id) : { linked: false };
  return (
    <AccountSettings
      name={session?.user?.name ?? ""}
      email={session?.user?.email ?? ""}
      telegramLinked={linked}
    />
  );
}
