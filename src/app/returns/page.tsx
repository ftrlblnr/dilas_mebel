import type { Metadata } from "next";
import { AlertTriangle, ShieldCheck, RefreshCw, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Возврат товара — Dilas",
  description:
    "Условия возврата и обмена мебели Dilas. Возврат надлежащего и ненадлежащего качества, сроки, порядок подачи претензии.",
};

const SECTIONS = [
  {
    number: "1",
    title: "Общие положения",
    content: (
      <p className="text-sm text-slate-600">
        Компания Dilas стремится обеспечить высокое качество продукции и сервиса.
        Возврат и обмен мебели осуществляется в соответствии с законодательством
        Республики Казахстан и настоящими правилами.
      </p>
    ),
  },
  {
    number: "2",
    title: "Возврат мебели надлежащего качества",
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-700">Готовая мебель со склада</p>
        <p>Покупатель вправе отказаться от товара надлежащего качества до его передачи.</p>
        <p>После передачи мебели возврат возможен только при сохранении:</p>
        <ul className="space-y-2">
          {[
            "товарного вида",
            "потребительских свойств",
            "заводской упаковки (при наличии)",
            "документов, подтверждающих покупку",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800">
          Стоимость доставки, подъёма и сборки возврату не подлежит.
        </div>
      </div>
    ),
  },
  {
    number: "3",
    title: "Мебель, изготовленная по индивидуальному заказу",
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          Мебель, изготовленная по индивидуальным размерам, в выбранной клиентом ткани, цвете,
          комплектации или дизайне, <strong>возврату и обмену не подлежит</strong>.
        </p>
        <p className="font-semibold text-slate-700">К таким изделиям относятся:</p>
        <ul className="space-y-2">
          {[
            "мебель по индивидуальному заказу",
            "мебель нестандартных размеров",
            "мебель в заказной ткани",
            "изделия с изменённой комплектацией",
            "мебель, изготовленная по эскизам заказчика",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    number: "4",
    title: "Возврат мебели ненадлежащего качества",
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>Покупатель имеет право предъявить претензии при обнаружении:</p>
        <ul className="space-y-2">
          {[
            "производственного брака",
            "скрытых дефектов",
            "несоответствия заказанной комплектации",
            "неисправности механизмов по вине производителя",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="font-semibold text-slate-700">Компания Dilas обязуется:</p>
        <ul className="space-y-2">
          {[
            "провести проверку качества",
            "устранить недостатки",
            "заменить изделие либо его элементы",
            "вернуть денежные средства в случаях, предусмотренных законодательством",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    number: "5",
    title: "Срок обращения",
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          О выявленных недостатках покупатель обязан сообщить в течение <strong>гарантийного срока</strong>.
        </p>
        <p className="font-semibold text-slate-700">При обнаружении дефекта рекомендуется:</p>
        <div className="space-y-2">
          {[
            "сделать фотографии",
            "направить описание проблемы",
            "предоставить номер заказа",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-blue-800">{step}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: "6",
    title: "Возврат денежных средств",
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          Возврат денежных средств осуществляется тем же способом, которым была произведена
          оплата, либо по согласованию сторон.
        </p>
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2">
          <RefreshCw size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-green-800">
            Срок возврата денежных средств составляет до <strong>30 рабочих дней</strong> после
            принятия решения о возврате.
          </p>
        </div>
      </div>
    ),
  },
  {
    number: "7",
    title: "Случаи, на которые гарантия и возврат не распространяются",
    content: (
      <div className="space-y-2 text-sm text-slate-600">
        <p>Компания вправе отказать в удовлетворении требований, если повреждения возникли вследствие:</p>
        <ul className="space-y-2 mt-2">
          {[
            "механических воздействий после передачи товара",
            "неправильной эксплуатации",
            "самостоятельного ремонта",
            "воздействия влаги, огня или химических веществ",
            "превышения допустимых нагрузок",
            "естественного износа материалов",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-orange-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    number: "8",
    title: "Порядок подачи претензии",
    content: (
      <div className="space-y-3 text-sm text-slate-600">
        <p>Для рассмотрения обращения необходимо предоставить:</p>
        <ul className="space-y-2">
          {[
            "Ф.И.О. покупателя",
            "номер заказа или договора",
            "фотографии изделия",
            "описание выявленного недостатка",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
          Обращения принимаются через салон Dilas, WhatsApp компании или электронную почту.
        </div>
      </div>
    ),
  },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-primary py-12">
        <div className="container-content text-center text-white">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3 text-white">
            Возврат товара
          </h1>
          <p className="text-blue-200 text-base max-w-xl mx-auto">
            Условия возврата и обмена мебели Dilas
          </p>
        </div>
      </div>

      <div className="container-content py-10">
        <div className="max-w-2xl mx-auto space-y-5">

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Возврат и обмен мебели осуществляется в соответствии с законодательством
              Республики Казахстан. При возникновении вопросов обращайтесь к менеджерам
              нашего салона.
            </p>
          </div>

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

        </div>
      </div>
    </div>
  );
}
