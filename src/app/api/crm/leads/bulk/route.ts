import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { bulkUpdateLeads } from "@/lib/leads-server";

const patchSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(["NEW", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || (parsed.data.status === undefined && parsed.data.assignedToId === undefined)) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const { ids, ...data } = parsed.data;
  const count = await bulkUpdateLeads(ids, data, session.user.id, session.user.role ?? "MANAGER");
  return NextResponse.json({ count });
}
