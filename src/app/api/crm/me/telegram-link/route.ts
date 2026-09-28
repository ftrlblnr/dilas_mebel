import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTelegramLinkStatus, linkTelegramAccount } from "@/lib/users-server";
import { verifyTelegramInitData } from "@/lib/telegram-verify";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const status = await getTelegramLinkStatus(session.user.id);
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const initData = body?.initData;
  if (typeof initData !== "string" || !initData) {
    return NextResponse.json({ message: "initData отсутствует" }, { status: 400 });
  }

  const verified = verifyTelegramInitData(initData, process.env.TELEGRAM_MANAGER_BOT_TOKEN!);
  if (!verified) return NextResponse.json({ message: "Недействительные данные Telegram" }, { status: 401 });

  await linkTelegramAccount(session.user.id, verified.chatId);
  return NextResponse.json({ linked: true });
}
