import { NextRequest, NextResponse } from "next/server";
import { generateRefNumber } from "@/lib/utils";
import { createLead } from "@/lib/leads-server";
import type { CustomOrderSelection } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, productName, fullName, phone, selections, totalPrice } = body as {
      productId?: string;
      productName?: string;
      fullName?: string;
      phone?: string;
      selections?: CustomOrderSelection[];
      totalPrice?: number;
    };

    if (!fullName || !phone || !productName) {
      return NextResponse.json({ message: "Заполните все поля" }, { status: 400 });
    }

    const refNumber = generateRefNumber();
    const selectionsArray = Array.isArray(selections) ? selections : [];

    // Заявка считается успешной только после надёжной записи — ошибка ниже
    // поднимается до внешнего catch и клиент получает 500, а не ложный успех.
    await createLead({
      source: "CUSTOM_ORDER",
      refNumber,
      fullName,
      phone,
      totalPrice: Math.round(totalPrice ?? 0),
      items: selectionsArray.map((s) => ({
        productId,
        productName,
        criterionName: s.criterionName,
        variantLabel: s.variantLabel,
        price: s.price,
      })),
    });

    return NextResponse.json({ success: true, refNumber }, { status: 200 });
  } catch (err) {
    console.error("Custom order API error:", err);
    return NextResponse.json({ message: "Произошла ошибка сервера" }, { status: 500 });
  }
}
