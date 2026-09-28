import { NextRequest, NextResponse } from "next/server";
import { sendManagerMessage } from "@/lib/telegram-manager";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number };
  };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_MANAGER_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const text = update?.message?.text;
  const chatId = update?.message?.chat?.id;

  if (text?.startsWith("/start") && chatId) {
    await sendManagerMessage(
      String(chatId),
      "Чтобы получать уведомления о заявках, откройте мини-приложение кнопкой меню и войдите под своим логином CRM — Telegram подключится автоматически."
    );
  }

  return NextResponse.json({ ok: true });
}
