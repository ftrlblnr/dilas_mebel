import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCrmSettings, updateCrmSettings } from "@/lib/crm-settings-server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const settings = await getCrmSettings();
  return NextResponse.json(settings);
}

const patchSchema = z.object({
  managerDiscountLimitPercent: z.number().min(0).max(100),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  try {
    const settings = await updateCrmSettings(parsed.data.managerDiscountLimitPercent, session.user.role);
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Не удалось сохранить настройки" }, { status: 403 });
  }
}
