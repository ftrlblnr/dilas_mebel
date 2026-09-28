import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import type { NavCategory } from "@/lib/categories-server";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}


const STORES = [
  { city: "Астана", address: "улица Достык, 3, мебельный центр Корме, Зал В, Мебельный салон Dilas", twoGisUrl: "https://2gis.kz/astana/geo/70000001065408327" },
];

export default function Footer({ categories }: { categories: NavCategory[] }) {
  const catalogLinks = [
    ...categories
      .filter((c) => !c.isSale)
      .map((c) => ({ label: c.label, href: `/products?category=${c.slug}` })),
    { label: "Распродажа", href: "/sale" },
    { label: "Новинки", href: "/products?filter=new" },
  ];

  return (
    <footer className="bg-primary-dark text-white">
      <div className="container-content py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Column 1 — Brand + Newsletter + Social */}
          <div>
            <div className="mb-4">
              <Image
                src="/brand/dilas-logo-light.png"
                alt="DILAS"
                width={415}
                height={191}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-blue-200 mb-5 leading-relaxed">
              Качественный мебельный магазин в Казахстане. Сделать ваш дом уютным — наша миссия.
            </p>

          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-4 text-white">Каталог</h4>
            <ul className="space-y-2.5">
              {catalogLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-blue-200 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Customer Service */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-4 text-white">Покупателям</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Доставка и оплата", href: "/shipping" },
                { label: "Правила приёмки мебели", href: "/acceptance-rules" },
                { label: "Возврат товара", href: "/returns" },
                { label: "Наши магазины", href: "/stores" },
                { label: "О компании", href: "/about" },
                { label: "Контакты", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-blue-200 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact + Stores */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-4 text-white">Контакты</h4>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2.5">
                <Phone size={15} className="text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <a href="tel:+77056567733" className="text-sm text-blue-200 hover:text-white transition-colors">
                    +7 705 656 7733
                  </a>
                  <p className="text-xs text-blue-300 mt-0.5">Пн–Вс: 10:00–20:00</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent mt-0.5 flex-shrink-0"><InstagramIcon /></span>
                <a href="https://www.instagram.com/dilas_mebel?igsh=aG8wajd2OTl0YWxy" target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-200 hover:text-white transition-colors">
                  @dilas_mebel
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="text-accent mt-0.5 flex-shrink-0" />
                <a href="mailto:dilas_group@mail.ru" className="text-sm text-blue-200 hover:text-white transition-colors">
                  dilas_group@mail.ru
                </a>
              </li>
            </ul>

            {/* Stores */}
            <h5 className="font-bold text-xs uppercase tracking-wider text-blue-300 mb-3">Наши магазины</h5>
            <ul className="space-y-3">
              {STORES.map((store) => (
                <li key={store.city}>
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-accent mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{store.city}</p>
                      <p className="text-xs text-blue-300 leading-snug">{store.address}</p>
                      <a
                        href={store.twoGisUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-dark transition-colors mt-1 font-semibold"
                      >
                        <ExternalLink size={10} />
                        Открыть в 2GIS
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-content py-4 flex items-center justify-center">
          <p className="text-xs text-blue-300">© 2025 Dilas Жиһаз Мебель. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
