import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAssignableUsers } from "@/lib/users-server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const users = await listAssignableUsers();
  return NextResponse.json(users);
}
