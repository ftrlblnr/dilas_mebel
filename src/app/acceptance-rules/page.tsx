import type { Metadata } from "next";
import { CheckCircle2, AlertTriangle, ShieldCheck, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Правила приёмки мебели — Dilas",
  description:
    "Правила приёма мебели клиентом при доставке. Что проверить, как зафиксировать дефект, условия гарантии.",
};

const SECTIONS = [
  {
    number: "1",
    title: "Общие положения",
    content: (
      <ul className="space-y-2 text-sm text-slate-600">
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
          <span>Передача мебели осуществляется только после <strong>полной оплаты</strong> либо согласно договору</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
          <span><strong>Готовности помещения</strong> к установке</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
          <span><strong>Присутствия заказчика</strong> или доверенного лица</span>
        </li>
        <li className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-slate-600">
          После подписания Акта приёма мебель считается <strong>переданной клиенту</strong>, проверенной по внешнему виду и принятой по комплектации.
        </li>
      </ul>
    ),
  },
  {
    number: "2",
    title: "Что обязан проверить клиент при приёмке",
    content: (
      <div className="space-y-4">
        {[
          {
            label: "Внешний вид",
            items: ["отсутствие порезов", "царапин", "сколов", "потёртостей", "загрязнений"],
          },
          {
            label: "Комплектацию",
            items: ["наличие всех изделий", "подушек", "ножек", "фурнитуры", "декоративных элементов"],
          },
          {
            label: "Цвет и ткань",
            items: ["соответствие заказу", "оттенок ткани", "фактура"],
          },
          {
            label: "Размеры",
            items: ["соответствие согласованным параметрам"],
          },
          {
            label: "Механизмы",
            items: ["раскладка дивана", "открывание ящиков", "работа подъёмного механизма"],
          },
        ].map((group) => (
          <div key={group.label} className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-slate-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: "3",
    title: "Освещение при приёмке",
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>Проверка мебели производится при <strong>хорошем освещении</strong> с расстояния <strong>не менее 1 метра</strong>.</p>
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="font-semibold text-amber-800 mb-1.5">Не считаются дефектом:</p>
          <ul className="space-y-1">
            {["малозаметные особенности текстуры", "естественный рисунок ткани", "незначительные складки мягких элементов"].map((i) => (
              <li key={i} className="flex items-center gap-1.5 text-amber-700">
                <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    number: "4",
    title: "Правила по мягкой мебели",
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Допускается:</p>
        <ul className="space-y-1.5">
          {["небольшая разница мягкости подушек", "технологические складки ткани", "естественная усадка наполнителя"].map((i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              {i}
            </li>
          ))}
        </ul>
        <p className="text-slate-500 italic">
          Это является особенностью мягкой мебели и <strong>не считается браком</strong>.
        </p>
      </div>
    ),
  },
  {
    number: "5",
    title: "Если обнаружен дефект",
    content: (
      <div className="space-y-3 text-sm">
        <p className="text-slate-600">При обнаружении брака, повреждений или несоответствия заказу клиент обязан:</p>
        <div className="space-y-2">
          {[
            "указать замечание в Акте приёма",
            "сделать фото",
            "сообщить менеджеру в день доставки",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3 p-2.5 bg-red-50 border border-red-100 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-red-800">{step}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: "6",
    title: "После подписания акта",
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          После подписания Акта претензии по <strong>внешнему виду</strong>, механическим повреждениям и комплектации <strong>не принимаются</strong>.
        </p>
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
          <p className="font-semibold text-green-800 mb-1">Исключения:</p>
          <ul className="space-y-1">
            {["скрытые производственные дефекты", "гарантийные случаи"].map((i) => (
              <li key={i} className="flex items-center gap-1.5 text-green-700">
                <CheckCircle2 size={13} className="flex-shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    number: "7",
    title: "Что запрещено при эксплуатации",
    content: (
      <ul className="space-y-2 text-sm text-slate-600">
        {[
          "прыгать на мебели",
          "превышать нагрузку",
          "использовать агрессивную химию",
          "ставить мебель возле сильного нагрева",
          "перемещать мебель волоком",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    number: "8",
    title: "Гарантия Dilas",
    content: (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
            <p className="font-semibold text-green-800 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Гарантия распространяется
            </p>
            <ul className="space-y-1">
              {["каркас", "механизмы", "производственные дефекты"].map((i) => (
                <li key={i} className="text-green-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="font-semibold text-slate-700 mb-1.5">Не распространяется</p>
            <ul className="space-y-1">
              {["повреждения после передачи", "неправильная эксплуатация", "естественный износ ткани"].map((i) => (
                <li key={i} className="text-slate-500 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ),
  },
];

export default function AcceptanceRulesPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-primary py-12">
        <div className="container-content text-center text-white">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3 text-white">
            Правила приёма мебели
          </h1>
          <p className="text-blue-200 text-base max-w-xl mx-auto">
            Пожалуйста, ознакомьтесь с правилами приёмки до момента доставки
          </p>
        </div>
      </div>

      <div className="container-content py-10">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Логистические заметки */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Ориентировочное время доставки согласовывается <strong>накануне дня доставки</strong></p>
              <p>• Подъезд грузового транспорта к вашему дому должен быть <strong>свободным</strong></p>
              <p>• Мягкую мебель мы <strong>собираем в момент доставки</strong></p>
            </div>
          </div>

          {/* Секции */}
          {SECTIONS.map((section) => (
            <div key={section.number} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {section.number}
                </span>
                <h2 className="font-display font-bold text-slate-800 text-base">{section.title}</h2>
              </div>
              <div className="px-5 py-4">{section.content}</div>
            </div>
          ))}

          {/* Финальное предупреждение */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-bold mb-1">Внимание</p>
              <p>
                Расписываясь в бланке приёма при получении, вы соглашаетесь с тем, что товар поставлен
                в <strong>полном объёме</strong> и <strong>надлежащего качества</strong>. Далее претензии
                к внешнему виду и комплектации не могут быть приняты.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
