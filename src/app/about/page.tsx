import type { Metadata } from "next";
import { CheckCircle2, Factory, Palette, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "О компании — Dilas",
  description:
    "Dilas — казахстанская мебельная компания. Производство и продажа мягкой мебели, кроватей, стульев и интерьерных решений для дома.",
};

const PRINCIPLES = [
  "Качественные материалы и комплектующие",
  "Современный дизайн",
  "Контроль качества на каждом этапе производства",
  "Честные сроки изготовления",
  "Профессиональный сервис до и после покупки",
];

const PRODUCTION_STEPS = [
  "изготовление каркасов",
  "пошив мебельных чехлов",
  "сборка изделий",
  "контроль качества",
  "упаковка и подготовка к доставке",
];

const INDIVIDUAL = [
  "выбор тканей и материалов",
  "подбор цвета и комплектации",
  "изготовление мебели по индивидуальным размерам",
  "консультации по подбору мебели для интерьера",
];

const ADVANTAGES = [
  "Собственное производство",
  "Гарантия качества",
  "Современный дизайн",
  "Большой выбор тканей и материалов",
  "Доставка и сборка",
  "Индивидуальные решения под заказ",
  "Профессиональное сопровождение клиента",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-primary py-14">
        <div className="container-content text-center text-white">
          <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-3">
            О компании
          </p>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-4 text-white">
            Создаём мебель, в которой хочется жить
          </h1>
          <p className="text-blue-100 text-base max-w-2xl mx-auto leading-relaxed">
            Dilas — казахстанская мебельная компания, специализирующаяся на производстве
            и продаже мягкой мебели, кроватей, стульев и интерьерных решений для дома.
          </p>
        </div>
      </div>

      <div className="container-content py-10">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* О компании — вводный блок */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              Наша цель — создавать красивую, удобную и долговечную мебель, которая делает
              дом комфортнее, а жизнь уютнее.
            </p>
            <p>
              Мы объединяем современные технологии производства, качественные материалы и
              внимание к деталям, чтобы каждый клиент получил мебель, которой будет
              пользоваться долгие годы.
            </p>
          </div>

          {/* Наш подход */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <Star size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Наш подход</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-slate-600">
              <p>Мы уверены, что мебель должна быть не только красивой, но и практичной. Поэтому в работе придерживаемся нескольких принципов:</p>
              <ul className="space-y-2">
                {PRINCIPLES.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-slate-500 italic">
                Каждое изделие проходит проверку перед отправкой клиенту.
              </p>
            </div>
          </div>

          {/* Собственное производство */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <Factory size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Собственное производство</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-slate-600">
              <p>Производство Dilas позволяет контролировать качество на всех этапах:</p>
              <ul className="space-y-2">
                {PRODUCTION_STEPS.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Благодаря собственному производству мы можем предлагать клиентам широкий
                выбор моделей, размеров и тканей.
              </p>
            </div>
          </div>

          {/* Индивидуальный подход */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <Palette size={18} className="text-primary flex-shrink-0" />
              <h2 className="font-display font-bold text-slate-800 text-base">Индивидуальный подход</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-slate-600">
              <p>Мы понимаем, что каждый интерьер уникален. Поэтому предлагаем:</p>
              <ul className="space-y-2">
                {INDIVIDUAL.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Наша задача — помочь клиенту найти решение, которое идеально подойдёт
                именно для его дома.
              </p>
            </div>
          </div>

          {/* Почему выбирают Dilas */}
          <div className="bg-primary rounded-xl p-6">
            <h2 className="font-display font-bold text-white text-base mb-4">
              Почему выбирают Dilas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ADVANTAGES.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-blue-100">
                  <CheckCircle2 size={15} className="text-blue-300 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Миссия */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              Наша миссия
            </p>
            <p className="text-slate-700 text-base font-medium leading-relaxed">
              Создавать мебель, которая объединяет комфорт, качество и стиль, делая каждый
              дом уютнее и красивее.
            </p>
            <p className="text-slate-400 text-sm">
              Dilas — мебель для жизни, отдыха и вдохновения.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
