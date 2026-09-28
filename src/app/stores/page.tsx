import type { Metadata } from "next";
import { MapPin, Phone, Clock, ExternalLink, Navigation } from "lucide-react";

export const metadata: Metadata = {
  title: "Наши магазины — Dilas Мебель",
  description: "Адрес, телефон и время работы магазина Dilas в Астане.",
};

const STORES = [
  {
    id: 1,
    city: "Астана",
    name: "Dilas Астана",
    address: "улица Достык, 3, мебельный центр Корме, Зал В, Мебельный салон Dilas",
    phone: "+7 705 656 7733",
    hours: "Пн–Вс: 10:00–20:00",
    description: "Мебельный салон Dilas в центре Астаны. Широкий выбор диванов, кроватей и аксессуаров.",
    twoGisUrl: "https://2gis.kz/astana/geo/70000001065408327",
    mapEmbed: "https://yandex.kz/map-widget/v1/?ll=71.420883%2C51.128684&z=16&pt=71.420883%2C51.128684%2Cpm2rdl",
    tag: "Флагман",
  },
];

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-primary py-12">
        <div className="container-content text-center text-white">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3 text-white">
            Наши магазины
          </h1>
          <p className="text-blue-200 text-base max-w-xl mx-auto">
            Посетите нас в Астане — наши консультанты помогут выбрать мебель для вашего дома
          </p>
        </div>
      </div>

      <div className="container-content py-10">
        <div className="max-w-lg mx-auto">
          {STORES.map((store) => (
            <div key={store.id} className="bg-white rounded-xl border border-surface-alt shadow-card overflow-hidden flex flex-col">
              {/* Map embed */}
              <div className="relative h-48 bg-surface-alt overflow-hidden">
                <iframe
                  title={`Карта — ${store.name}`}
                  src={store.mapEmbed}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                />
                <a
                  href={store.twoGisUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 hover:bg-white text-primary text-xs font-semibold px-2 py-1 rounded shadow transition-colors"
                >
                  <ExternalLink size={10} />
                  2GIS
                </a>
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-display font-bold text-lg text-text">{store.name}</h2>
                  {store.tag && (
                    <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      {store.tag}
                    </span>
                  )}
                </div>

                <p className="text-sm text-text-muted mb-4 leading-relaxed">{store.description}</p>

                <ul className="space-y-2.5 mb-5">
                  <li className="flex items-start gap-2.5">
                    <MapPin size={15} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text">{store.address}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone size={15} className="text-primary flex-shrink-0" />
                    <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="text-sm text-text hover:text-primary transition-colors">
                      {store.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock size={15} className="text-primary flex-shrink-0" />
                    <span className="text-sm text-text">{store.hours}</span>
                  </li>
                </ul>

                <div className="flex gap-3 mt-auto">
                  <a
                    href={store.twoGisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    <ExternalLink size={14} />
                    Открыть в 2GIS
                  </a>
                  <a
                    href={`tel:${store.phone.replace(/\s/g, "")}`}
                    className="flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors"
                  >
                    <Navigation size={14} />
                    Позвонить
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note about 2GIS */}
        <p className="text-center text-sm text-text-muted mt-8">
          Для просмотра маршрута и точного адреса нажмите{" "}
          <span className="font-semibold text-primary">«Открыть в 2GIS»</span> — карта откроется в приложении или на сайте 2GIS.
        </p>
      </div>
    </div>
  );
}
