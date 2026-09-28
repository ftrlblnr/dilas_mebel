"use client";

import { useEffect, useRef } from "react";
import {
  X, CheckCircle2, AlertTriangle, ShieldCheck, Info,
} from "lucide-react";

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
          { label: "Внешний вид", items: ["отсутствие порезов", "царапин", "сколов", "потёртостей", "загрязнений"] },
          { label: "Комплектацию", items: ["наличие всех изделий", "подушек", "ножек", "фурнитуры", "декоративных элементов"] },
          { label: "Цвет и ткань", items: ["соответствие заказу", "оттенок ткани", "фактура"] },
          { label: "Размеры", items: ["соответствие согласованным параметрам"] },
          { label: "Механизмы", items: ["раскладка дивана", "открывание ящиков", "работа подъёмного механизма"] },
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
        <p>Проверка при <strong>хорошем освещении</strong> с расстояния <strong>не менее 1 метра</strong>.</p>
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="font-semibold text-amber-800 mb-1.5">Не считаются дефектом:</p>
          <ul className="space-y-1">
            {["малозаметные особенности текстуры", "естественный рисунок ткани", "незначительные складки мягких элементов"].map((i) => (
              <li key={i} className="flex items-center gap-1.5 text-amber-700">
                <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />{i}
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
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{i}
            </li>
          ))}
        </ul>
        <p className="text-slate-500 italic">Это является особенностью мягкой мебели и <strong>не считается браком</strong>.</p>
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
          {["указать замечание в Акте приёма", "сделать фото", "сообщить менеджеру в день доставки"].map((step, i) => (
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
        <p>После подписания Акта претензии по <strong>внешнему виду</strong>, механическим повреждениям и комплектации <strong>не принимаются</strong>.</p>
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
          <p className="font-semibold text-green-800 mb-1">Исключения:</p>
          <ul className="space-y-1">
            {["скрытые производственные дефекты", "гарантийные случаи"].map((i) => (
              <li key={i} className="flex items-center gap-1.5 text-green-700">
                <CheckCircle2 size={13} className="flex-shrink-0" />{i}
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
        {["прыгать на мебели", "превышать нагрузку", "использовать агрессивную химию", "ставить мебель возле сильного нагрева", "перемещать мебель волоком"].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-400 flex-shrink-0" />{item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    number: "8",
    title: "Гарантия Dilas",
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
          <p className="font-semibold text-green-800 mb-1.5 flex items-center gap-1.5">
            <ShieldCheck size={14} />Гарантия распространяется
          </p>
          <ul className="space-y-1">
            {["каркас", "механизмы", "производственные дефекты"].map((i) => (
              <li key={i} className="text-green-700 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />{i}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="font-semibold text-slate-700 mb-1.5">Не распространяется</p>
          <ul className="space-y-1">
            {["повреждения после передачи", "неправильная эксплуатация", "естественный износ ткани"].map((i) => (
              <li key={i} className="text-slate-500 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />{i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
];

interface Props {
  onClose: () => void;
}

export default function AcceptanceRulesModal({ onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Закрытие на Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    // Блокировка скролла body
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-2xl sm:mx-4 bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Правила приёма мебели</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ознакомьтесь перед получением заказа</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="overflow-y-auto px-5 py-4 space-y-4 flex-1">

          {/* Логистика */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 space-y-1">
              <p>• Время доставки согласовывается <strong>накануне дня доставки</strong></p>
              <p>• Подъезд грузового транспорта должен быть <strong>свободным</strong></p>
              <p>• Мягкую мебель <strong>собираем в момент доставки</strong></p>
            </div>
          </div>

          {/* Секции */}
          {SECTIONS.map((section) => (
            <div key={section.number} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {section.number}
                </span>
                <h3 className="font-semibold text-slate-800 text-sm">{section.title}</h3>
              </div>
              <div className="px-4 py-3">{section.content}</div>
            </div>
          ))}

          {/* Финальное предупреждение */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-900">
              <p className="font-bold mb-1">Внимание</p>
              <p>
                Расписываясь в бланке приёма, вы соглашаетесь с тем, что товар поставлен
                в <strong>полном объёме</strong> и <strong>надлежащего качества</strong>.
                Далее претензии к внешнему виду и комплектации не принимаются.
              </p>
            </div>
          </div>

          <div className="h-2" />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full btn-primary py-3 font-semibold"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
