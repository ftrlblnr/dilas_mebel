import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { completeTask, reopenTask, deleteTask } from "@/lib/tasks-server";

const patchSchema = z.object({
  completed: z.boolean(),
  result: z.string().trim().max(2000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    const task = parsed.data.completed
      ? await completeTask(id, session.user.id, session.user.role, parsed.data.result)
      : await reopenTask(id, session.user.id, session.user.role);
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ message: "Задача не найдена" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  try {
    await deleteTask(id, session.user.id, session.user.role);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Задача не найдена" }, { status: 404 });
  }
}
