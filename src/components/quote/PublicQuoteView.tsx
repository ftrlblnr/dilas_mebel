"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, MessageCircle, Mail, PackageX } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { COMPANY_WHATSAPP_URL, COMPANY_EMAIL } from "@/lib/constants";

interface PublicQuoteItem {
  productId: string | null;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  lineDiscountPercent: number;
  description: string | null;
}

interface PublicQuoteData {
  refNumber: string;
  managerName: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "EXPIRED" | "SUPERSEDED";
  validUntil: string | null;
  expired: boolean;
  total: number;
  items: PublicQuoteItem[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PublicQuoteView({ token }: { token: string }) {
  const [data, setData] = useState<PublicQuoteData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetch(`/api/quote/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setData(d);
        if (d.status === "ACCEPTED") setAccepted(true);
      })
      .catch(() => setNotFound(true));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/quote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok) setAccepted(true);
    } finally {
      setAccepting(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center">
          <PackageX size={40} className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">Предложение не найдено</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    );
  }

  const isSuperseded = data.status === "SUPERSEDED";
  const canAccept = !data.expired && !isSuperseded && !accepted && (data.status === "SENT" || data.status === "VIEWED");

  return (
    <div className="min-h-dvh bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#0D1F4A] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <h1 className="font-bold text-lg text-gray-900">Предложение {data.refNumber}</h1>
          <p className="text-sm text-gray-500">Ваш менеджер: {data.managerName}</p>
        </div>

        {(data.expired || isSuperseded) && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-3 mb-4 flex items-center gap-2">
            <Clock size={16} />
            {isSuperseded ? "Это предложение заменено более новой версией — свяжитесь с менеджером за актуальными условиями." : "Срок действия предложения истёк."}
          </div>
        )}

        {accepted && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Предложение принято. Менеджер свяжется с вами для оформления заказа.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {data.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b border-gray-100 last:border-0">
              {item.productImage ? (
                <img src={item.productImage} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm truncate">{item.productName}</p>
                {item.description && <p className="text-xs text-gray-500 truncate">{item.description}</p>}
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.quantity} шт × {formatPrice(item.unitPrice)}
                  {item.lineDiscountPercent > 0 && <> · скидка {item.lineDiscountPercent}%</>}
                </p>
              </div>
              <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                {formatPrice(item.unitPrice * item.quantity * (1 - item.lineDiscountPercent / 100))}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between p-4 bg-gray-50">
            <span className="font-semibold text-gray-900">Итого</span>
            <span className="font-bold text-lg text-[#0D1F4A]">{formatPrice(data.total)}</span>
          </div>
        </div>

        {data.validUntil && !accepted && (
          <p className="text-xs text-gray-500 text-center mb-4">Предложение действительно до {formatDate(data.validUntil)}</p>
        )}

        {canAccept && (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-[#0D1F4A] text-white font-semibold py-3 rounded-xl disabled:opacity-60 mb-4"
          >
            {accepting ? "Принимаем..." : "Принять предложение"}
          </button>
        )}

        <div className="text-center text-xs text-gray-400 space-y-1">
          <p>Есть вопросы? Свяжитесь с нами:</p>
          <div className="flex items-center justify-center gap-4">
            <Link href={COMPANY_WHATSAPP_URL} target="_blank" className="flex items-center gap-1 text-green-600 hover:underline">
              <MessageCircle size={13} /> WhatsApp
            </Link>
            <a href={`mailto:${COMPANY_EMAIL}`} className="flex items-center gap-1 hover:underline">
              <Mail size={13} /> {COMPANY_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
