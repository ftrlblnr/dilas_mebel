"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, RotateCw, Sofa, BedDouble, Palette, Armchair, Lamp, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavCategory } from "@/lib/categories-server";

interface HeroSlide {
  id: number;
  image: string;
  headline: string;
  subtext: string;
  cta: string;
  ctaLink: string;
}

const ICONS: LucideIcon[] = [Sofa, BedDouble, Palette, Armchair, Lamp, Sparkles];
const MAX_CARDS = 6;

function pluralCount(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export default function HeroSplit({ categories, counts }: { categories: NavCategory[]; counts: Record<string, number> }) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [flippedSlug, setFlippedSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/slides")
      .then((r) => r.json())
      .then((data) => { setSlides(data); setCurrent(0); })
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length < 2) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next, slides.length]);

  const activeSlide = slides[current];

  const showAllTile = categories.length > MAX_CARDS;
  const shown = showAllTile ? categories.slice(0, MAX_CARDS - 1) : categories.slice(0, MAX_CARDS);

  const toggleFlip = (slug: string) => {
    setFlippedSlug((cur) => (cur === slug ? null : slug));
  };

  return (
    <section className="bg-surface py-6 md:py-10">
      <div className="container-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Left — hero panel */}
          <div
            className="lg:col-span-1 rounded-3xl overflow-hidden bg-primary flex flex-col min-h-[440px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative flex-1 min-h-[300px]">
              {slides.length === 0 ? (
                <div className="absolute inset-0 bg-primary-dark animate-pulse" />
              ) : (
                slides.map((slide, i) => (
                  <img
                    key={slide.id}
                    src={slide.image}
                    alt=""
                    aria-hidden={i !== current}
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
                      i === current ? "opacity-100" : "opacity-0"
                    )}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                ))
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary/75 to-primary/25" />

              <div className="relative z-10 h-full flex flex-col justify-center p-6 md:p-8">
                <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4 flex items-center gap-2">
                  <span className="w-6 h-px bg-accent inline-block" />
                  Мебельная фабрика · Астана
                </p>
                <AnimatePresence mode="wait">
                  {activeSlide && (
                    <motion.div
                      key={activeSlide.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl leading-[0.95] text-white mb-4 drop-shadow-lg">
                        {activeSlide.headline}
                      </h1>
                      {activeSlide.subtext && (
                        <p className="text-white/80 text-sm md:text-base mb-6 max-w-xs">
                          {activeSlide.subtext}
                        </p>
                      )}
                      {activeSlide.cta && (
                        <Link href={activeSlide.ctaLink} className="btn-accent inline-block w-fit px-6 py-3 text-sm">
                          {activeSlide.cta}
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {slides.length > 1 && (
                <div className="absolute bottom-4 left-6 md:left-8 z-10 flex gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      aria-label={`Слайд ${i + 1}`}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        i === current ? "w-6 h-2 bg-accent" : "w-2 h-2 bg-white/50 hover:bg-white"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/15" />
            <div className="relative z-10 px-6 md:px-8 py-4 flex items-center justify-between gap-3 bg-primary-dark">
              <a
                href="tel:+77056567733"
                className="flex items-center gap-2 text-white/85 text-sm font-semibold hover:text-accent transition-colors"
              >
                <Phone size={15} /> +7 705 656 7733
              </a>
              <Link
                href="/stores"
                className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-accent hover:text-white transition-colors"
              >
                <MapPin size={13} />
                Найти магазин
              </Link>
            </div>
          </div>

          {/* Right — category flip cards */}
          <div className="lg:col-span-2" id="hero-categories">
            <div className="grid grid-cols-2 gap-3 h-full auto-rows-fr">
              {shown.map((cat, idx) => {
                const Icon = ICONS[idx % ICONS.length];
                const count = counts[cat.slug] ?? 0;
                // "Смотреть всё" entries are redundant now — the card title/front already link to the section itself
                const realSubs = cat.subcategories.filter((sub) => !sub.isAll);
                const hasSubs = realSubs.length > 0;
                const isFlipped = hasSubs && flippedSlug === cat.slug;
                const lastOdd = idx === shown.length - 1 && shown.length % 2 === 1;
                const href = `/products?category=${cat.slug}`;

                const frontFace = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <Icon size={30} strokeWidth={1.5} className={cat.isSale ? "text-accent-dark" : "text-primary"} />
                      {hasSubs && (
                        <button
                          type="button"
                          aria-label={isFlipped ? `Скрыть подразделы «${cat.label}»` : `Показать подразделы «${cat.label}»`}
                          aria-pressed={isFlipped}
                          className="p-1.5 -m-1.5 rounded-full text-text-muted hover:text-primary hover:bg-surface transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFlip(cat.slug);
                          }}
                        >
                          <RotateCw size={15} />
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="font-display font-bold uppercase text-base leading-tight text-text">{cat.label}</div>
                      <div className="font-mono text-[11px] text-text-muted mt-1">
                        {pluralCount(count, "модель", "модели", "моделей")}
                      </div>
                    </div>
                  </>
                );

                if (!hasSubs) {
                  return (
                    <Link
                      key={cat.slug}
                      href={href}
                      className={cn(
                        "min-h-[170px] md:min-h-[195px] rounded-2xl border-2 p-5 flex flex-col justify-between bg-white transition-colors",
                        cat.isSale ? "border-accent bg-accent/10 hover:bg-accent/15" : "border-border hover:border-primary",
                        lastOdd && "col-span-2"
                      )}
                    >
                      {frontFace}
                    </Link>
                  );
                }

                return (
                  <div
                    key={cat.slug}
                    className={cn("flip-card min-h-[170px] md:min-h-[195px]", isFlipped && "is-flipped", lastOdd && "col-span-2")}
                  >
                    <div className="flip-card-inner">
                      {/* Front */}
                      <Link
                        href={href}
                        className={cn(
                          "flip-face rounded-2xl border-2 p-5 flex flex-col justify-between bg-white transition-colors",
                          cat.isSale ? "border-accent bg-accent/10 hover:bg-accent/15" : "border-border hover:border-primary"
                        )}
                      >
                        {frontFace}
                      </Link>
                      {/* Back */}
                      <div className="flip-face flip-face-back rounded-2xl bg-primary p-5 flex flex-col">
                        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/15">
                          <Link
                            href={href}
                            tabIndex={isFlipped ? 0 : -1}
                            className="font-display font-bold uppercase text-sm text-white hover:text-accent transition-colors"
                          >
                            {cat.label}
                          </Link>
                          <button
                            type="button"
                            aria-label={`Скрыть подразделы «${cat.label}»`}
                            className="p-1.5 -m-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => toggleFlip(cat.slug)}
                          >
                            <RotateCw size={15} />
                          </button>
                        </div>
                        <ul className="flex flex-col gap-0 flex-1 overflow-y-auto">
                          {realSubs.slice(0, 6).map((sub) => (
                            <li key={sub.slug}>
                              <Link
                                href={`/products?category=${sub.slug}`}
                                tabIndex={isFlipped ? 0 : -1}
                                className="flex items-center justify-between text-xs text-white/80 hover:text-accent py-1 border-b border-white/10 transition-colors"
                              >
                                {sub.label}
                                <span className="opacity-50">→</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}

              {showAllTile && (
                <Link
                  href="/products"
                  className="rounded-2xl border-2 border-border bg-white flex flex-col items-center justify-center gap-2 p-5 hover:border-primary hover:bg-primary hover:text-white transition-colors group min-h-[170px] md:min-h-[195px]"
                >
                  <span className="font-display font-bold uppercase text-sm">Все разделы</span>
                  <span className="font-mono text-[11px] text-text-muted group-hover:text-white/80">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
