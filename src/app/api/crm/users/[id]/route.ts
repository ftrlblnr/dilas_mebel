import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { setUserActive, setUserRole, updateUserProfile } from "@/lib/users-server";

const patchSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(["ADMIN", "MANAGER"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  if (parsed.data.role !== undefined && parsed.data.role !== "ADMIN" && id === session.user.id) {
    return NextResponse.json({ message: "Нельзя снять права администратора с самого себя" }, { status: 400 });
  }

  try {
    const { active, role, ...profile } = parsed.data;
    if (active !== undefined) await setUserActive(id, active);
    if (role !== undefined) await setUserRole(id, role);
    if (Object.keys(profile).length > 0) await updateUserProfile(id, profile);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const isDuplicate = err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002";
    return NextResponse.json({ message: isDuplicate ? "Пользователь с таким email уже существует" : "Не удалось сохранить" }, { status: 400 });
  }
}
