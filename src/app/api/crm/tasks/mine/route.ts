import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listMyOpenTasks } from "@/lib/tasks-server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const tasks = await listMyOpenTasks(session.user.id);
  return NextResponse.json(tasks);
}
