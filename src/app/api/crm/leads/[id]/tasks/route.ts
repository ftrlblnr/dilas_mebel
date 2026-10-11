import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getLeadById } from "@/lib/leads-server";
import { createTask, listTasksForLead } from "@/lib/tasks-server";

const postSchema = z.object({
  assignedToId: z.string().min(1),
  type: z.enum([
    "CALL",
    "MEETING",
    "PREPARE_OFFER",
    "SEND_OFFER",
    "GET_DECISION",
    "CHECK_PAYMENT",
    "RESUME_POSTPONED",
    "OTHER",
  ]),
  dueAt: z.string().min(1),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const lead = await getLeadById(id, { id: session.user.id, role: session.user.role ?? "MANAGER" });
  if (!lead) return NextResponse.json({ message: "Заявка не найдена" }, { status: 404 });

  const tasks = await listTasksForLead(id);
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const lead = await getLeadById(id, { id: session.user.id, role: session.user.role ?? "MANAGER" });
  if (!lead) return NextResponse.json({ message: "Заявка не найдена" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  const task = await createTask(id, { ...parsed.data, dueAt: new Date(parsed.data.dueAt) }, session.user.id);
  return NextResponse.json(task);
}
