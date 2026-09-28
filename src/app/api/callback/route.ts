import { NextRequest, NextResponse } from "next/server";
import { generateRefNumber } from "@/lib/utils";
import { appendOrderHistory } from "@/lib/bundle-server";
import { createLead } from "@/lib/leads-server";
import { getProductById } from "@/lib/products-server";

interface OrderItem {
  product: { id: string; name: string; salePrice?: number; price: number };
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, email, city, preferredTime, comment, items } = body;

    if (!fullName || !phone || !city) {
      return NextResponse.json({ message: "Заполните обязательные поля" }, { status: 400 });
    }

    const refNumber = generateRefNumber();
    const itemsArray: OrderItem[] = Array.isArray(items) ? items : [];

    // Пересчитываем цену по актуальному каталогу на сервере — цена от клиента
    // не заслуживает доверия. Если товар не найден в каталоге (устаревший/
    // ручной productId), используем присланную клиентом цену как fallback,
    // чтобы не блокировать создание заявки.
    const resolvedItems = itemsArray.map((i) => {
      const catalogProduct = getProductById(i.product.id);
      const price = catalogProduct ? catalogProduct.salePrice ?? catalogProduct.price : i.product.salePrice ?? i.product.price;
      return { ...i, resolvedPrice: price };
    });

    const totalPrice = Math.round(
      resolvedItems.reduce((s, i) => s + i.resolvedPrice * i.quantity, 0)
    );

    // ── Order history ─────────────────────────────────────────────────────────
    if (itemsArray.length >= 2) {
      appendOrderHistory({
        id: refNumber,
        items: itemsArray.map((i) => i.product.id),
        timestamp: new Date().toISOString(),
      });
    }

    // ── Persist as CRM lead ─────────────────────────────────────────────────────
    // Заявка считается успешной только после надёжной записи — ошибка ниже
    // поднимается до внешнего catch и клиент получает 500, а не ложный успех.
    await createLead({
      refNumber,
      source: "CALLBACK",
      fullName,
      phone,
      email,
      city,
      comment,
      preferredTime,
      totalPrice,
      items: resolvedItems.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        price: i.resolvedPrice,
      })),
    });

    return NextResponse.json({ success: true, refNumber }, { status: 200 });
  } catch (err) {
    console.error("Callback API error:", err);
    return NextResponse.json({ message: "Произошла ошибка сервера" }, { status: 500 });
  }
}
