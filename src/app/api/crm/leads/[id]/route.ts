import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getLeadById, updateLead } from "@/lib/leads-server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const lead = await getLeadById(id, { id: session.user.id, role: session.user.role ?? "MANAGER" });
  if (!lead) return NextResponse.json({ message: "Заявка не найдена" }, { status: 404 });
  return NextResponse.json(lead);
}

const patchSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  archived: z.boolean().optional(),
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  comment: z.string().trim().nullable().optional(),
  preferredTime: z.string().trim().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  // Known validation errors thrown by updateLead() that should surface to the
  // user as-is — anything else (missing lead, scope mismatch, Prisma errors)
  // falls back to the generic 404 this endpoint always returned before.
  const KNOWN_VALIDATION_ERRORS = ["Назначать заявки может только администратор"];

  try {
    const lead = await updateLead(id, parsed.data, session.user.id, session.user.role ?? "MANAGER");
    return NextResponse.json(lead);
  } catch (err) {
    if (err instanceof Error && KNOWN_VALIDATION_ERRORS.includes(err.message)) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Заявка не найдена" }, { status: 404 });
  }
}
