"use client";
import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { GalleryLayout } from "@/lib/settings-server";

interface Props {
  layout: GalleryLayout;
  photos: (string | null)[];
}

export default function GallerySection({ layout, photos }: Props) {
  const filled = photos.filter(Boolean) as string[];
  if (filled.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-[0.18em] mb-3">
            Наши работы
          </p>
          <h2
            className="text-[#0D1F4A] text-2xl md:text-4xl font-bold leading-tight"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Портфолио мебельной фабрики
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-3 max-w-xl mx-auto">
            Примеры нашей продукции — качество, которое говорит само за себя
          </p>
        </div>

        <GalleryGrid layout={layout} photos={photos} />
      </div>
    </section>
  );
}

function GalleryGrid({ layout, photos }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const filled = photos
    .map((p, i) => ({ url: p, slot: i }))
    .filter((x) => x.url) as { url: string; slot: number }[];

  const openLightbox = useCallback((slot: number) => {
    const idx = filled.findIndex((x) => x.slot === slot);
    if (idx !== -1) setLightboxIdx(idx);
  }, [filled]);

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  const prev = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : (i - 1 + filled.length) % filled.length));
  }, [filled.length]);

  const next = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : (i + 1) % filled.length));
  }, [filled.length]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, prev, next, closeLightbox]);

  // img uses absolute positioning so it fills the cell regardless of whether
  // the cell has aspect-square (grid layouts) or stretches via CSS Grid (featured slot 0)
  const cell = (slot: number, className: string) => {
    const photo = photos[slot];
    if (!photo) return <div key={slot} className={`${className} bg-gray-100 rounded-xl`} />;
    return (
      <button
        key={slot}
        onClick={() => openLightbox(slot)}
        className={`${className} group relative overflow-hidden rounded-xl cursor-zoom-in`}
      >
        <img
          src={photo}
          alt={`Работа ${slot + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
          <ZoomIn
            size={28}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
          />
        </div>
      </button>
    );
  };

  let grid: React.ReactNode;

  if (layout === "featured") {
    // Left: 4 squares (2×2), Right: 1 large square — all equal height
    grid = (
      <div className="grid grid-cols-2 gap-2">
        <div className="grid grid-cols-2 gap-2">
          {cell(0, "aspect-square")}
          {cell(1, "aspect-square")}
          {cell(2, "aspect-square")}
          {cell(3, "aspect-square")}
        </div>
        {cell(4, "aspect-square")}
      </div>
    );
  } else {
    // grid-2rows: 6 squares, 3 columns × 2 rows
    grid = (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }, (_, i) => cell(i, "aspect-square"))}
      </div>
    );
  }

  return (
    <>
      {grid}

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X size={28} />
          </button>

          {filled.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 text-white/70 hover:text-white transition-colors p-2"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 text-white/70 hover:text-white transition-colors p-2"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          <img
            src={filled[lightboxIdx].url}
            alt={`Работа ${lightboxIdx + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 text-white/50 text-sm">
            {lightboxIdx + 1} / {filled.length}
          </div>
        </div>
      )}
    </>
  );
}
