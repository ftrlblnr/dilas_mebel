import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { listUsers, createManagerUser } from "@/lib/users-server";

const postSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  password: z.string().min(8),
});

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });

  const users = await listUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    const user = await createManagerUser(parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    const isDuplicate = err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002";
    const message = isDuplicate
      ? "Пользователь с таким email уже существует"
      : err instanceof Error
        ? err.message
        : "Не удалось создать менеджера";
    return NextResponse.json({ message }, { status: 400 });
  }
}
