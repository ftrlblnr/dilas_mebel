import type { Metadata } from "next";
import { Truck, CreditCard, Clock, Wrench, Home, ClipboardCheck, ShieldCheck, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Доставка и оплата — Dilas",
  description:
    "Условия оплаты, сроки изготовления, доставка по Астане и Казахстану, сборка и гарантия на мебель Dilas.",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-primary py-12">
        <div className="container-content text-center text-white">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3 text-white">
            Доставка и оплата
          </h1>
          <p className="text-blue-200 text-base max-w-xl mx-auto">
            Условия оплаты, доставки и сборки мебели Dilas
          </p>
        </div>
      </div>

      <div className="container-content py-10">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Оплата заказа */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <CreditCard size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Оплата заказа</h2>
            </div>
            <div className="px-5 py-4 space-y-5">

              {/* Мебель под заказ */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Мебель под заказ</p>
                <div className="space-y-2">
                  {[
                    "При оформлении заказа вносится предоплата в размере 50% от стоимости заказа.",
                    "Оставшиеся 50% оплачиваются после уведомления о готовности мебели и до доставки либо в день доставки до начала монтажа.",
                    "Заказ запускается в производство только после поступления предоплаты.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Готовая мебель */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Готовая мебель со склада</p>
                <div className="space-y-2">
                  {[
                    "Оплата производится в размере 100% стоимости товара.",
                    "После полной оплаты товар резервируется за покупателем сроком до 5 календарных дней.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Способы оплаты */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Способы оплаты</p>
                <ul className="space-y-2">
                  {[
                    "Наличный расчёт",
                    "Банковская карта",
                    "Безналичный расчёт для физических лиц",
                    "Безналичный расчёт для юридических лиц",
                    "Рассрочка и кредит через банки-партнёры (при наличии)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* Срок изготовления */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <Clock size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Срок изготовления</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-slate-600">
              <p>
                Срок изготовления мебели составляет от{" "}
                <strong className="text-slate-800">15 до 45 рабочих дней</strong> в зависимости от
                модели, выбранной ткани, комплектации и загруженности производства.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
                Точный срок фиксируется в договоре или заказ-наряде.
              </div>
            </div>
          </div>

          {/* Доставка */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <Truck size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Доставка</h2>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm text-slate-600">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-2">По Астане и Косшы</p>
                  <ul className="space-y-1.5">
                    {[
                      "Доставка ежедневно по согласованию",
                      "Уведомление за 24 часа",
                      "Стоимость по тарифу компании",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-2">По Казахстану</p>
                  <ul className="space-y-1.5">
                    {[
                      "Доставка транспортными компаниями",
                      "Стоимость по тарифам перевозчика",
                      "Сохранность после передачи — ответственность перевозчика",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>

          {/* Подъём мебели */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <Home size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Подъём мебели</h2>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm text-slate-600">
              <p>Стоимость подъёма рассчитывается отдельно в случаях:</p>
              <ul className="space-y-2 mt-2">
                {[
                  "отсутствия грузового лифта",
                  "невозможности использования лифта по габаритам изделия",
                  "необходимости ручного подъёма на этаж",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Сборка */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <Wrench size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Сборка мебели</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              {[
                "Сборка мебели производится специалистами компании Dilas.",
                "Стоимость сборки может входить в стоимость изделия либо рассчитываться отдельно.",
                "Самостоятельная сборка клиентом может повлиять на гарантийные обязательства компании.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Требования к помещению */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <Home size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Требования к помещению</h2>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm text-slate-600">
              <p>До доставки клиент обязан обеспечить:</p>
              <ul className="space-y-2 mt-2">
                {[
                  "свободный доступ к помещению",
                  "возможность заноса мебели",
                  "завершение строительных и отделочных работ",
                  "наличие освещения и электропитания при необходимости монтажа",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Приёмка */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <ClipboardCheck size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Приёмка товара</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-slate-600">
              <p>При получении мебели клиент обязан:</p>
              <ul className="space-y-2">
                {[
                  "проверить внешний вид изделия",
                  "проверить комплектность",
                  "проверить работу механизмов",
                  "подписать акт приёма-передачи",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-amber-800">
                  После подписания акта мебель считается принятой без замечаний, кроме скрытых
                  производственных дефектов.
                </p>
              </div>
            </div>
          </div>

          {/* Гарантия */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <ShieldCheck size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Гарантия</h2>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm text-slate-600">
              <p>
                Гарантийный срок на мебель составляет{" "}
                <strong className="text-slate-800">18 месяцев</strong> с момента передачи
                покупателю.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <p className="font-semibold text-green-800 mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    Гарантия распространяется
                  </p>
                  <ul className="space-y-1">
                    {[
                      "производственные дефекты",
                      "дефекты каркаса",
                      "неисправность механизмов при соблюдении правил эксплуатации",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-green-700">
                        <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-semibold text-slate-700 mb-2">Не распространяется</p>
                  <ul className="space-y-1">
                    {[
                      "механические повреждения после передачи",
                      "естественный износ материалов",
                      "повреждения вследствие неправильной эксплуатации",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-slate-500">
                        <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
