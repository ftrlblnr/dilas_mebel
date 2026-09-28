"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const ref = params.get("ref") || "#DLS-00000";

  return (
    <div className="container-content py-20 max-w-xl mx-auto text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={44} className="text-green-600" />
        </div>
      </div>
      <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mb-3">
        Ваша заявка принята!
      </h1>
      <p className="text-text-muted text-base mb-6 leading-relaxed">
        Наш менеджер свяжется с вами в течение 1 рабочего дня. Спасибо!
      </p>

      <div className="bg-surface rounded-2xl p-6 mb-8">
        <p className="text-text-muted text-sm mb-1">Номер заявки</p>
        <p className="font-display font-extrabold text-2xl text-primary">{ref}</p>
      </div>

      <p className="text-sm text-text-muted mb-8">
        Если есть вопросы:{" "}
        <a href="tel:+77056567733" className="text-primary font-semibold hover:underline">
          +7 705 656 7733
        </a>
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="btn-primary px-8 py-3">
          На главную
        </Link>
        <Link href="/products" className="btn-secondary px-8 py-3">
          Смотреть товары
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-text-muted">Загрузка...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
