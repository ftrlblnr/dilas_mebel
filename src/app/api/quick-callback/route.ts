import { NextRequest, NextResponse } from "next/server";
import { generateRefNumber } from "@/lib/utils";
import { createLead } from "@/lib/leads-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json({ message: "Заполните все поля" }, { status: 400 });
    }

    const refNumber = generateRefNumber();

    // Заявка считается успешной только после надёжной записи — ошибка ниже
    // поднимается до внешнего catch и клиент получает 500, а не ложный успех.
    await createLead({ refNumber, source: "QUICK_CALLBACK", fullName: name, phone });

    return NextResponse.json({ success: true, refNumber }, { status: 200 });
  } catch (err) {
    console.error("Quick callback API error:", err);
    return NextResponse.json({ message: "Произошла ошибка сервера" }, { status: 500 });
  }
}
