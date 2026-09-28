"use client";
import { useRef, useState } from "react";
import { Play } from "lucide-react";

interface Props {
  url: string;
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export default function YoutubeSection({ url }: Props) {
  const id = extractYoutubeId(url);
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!id) return null;

  const thumb = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  const embedSrc = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <section className="bg-[#0D1F4A] py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-[0.18em] mb-3">
            О компании
          </p>
          <h2
            className="text-white text-2xl md:text-4xl font-bold leading-tight"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Смотрите наш рекламный ролик
          </h2>
          <p className="text-blue-200 text-sm md:text-base mt-3 max-w-xl mx-auto">
            Узнайте больше о мебели DILAS — качество, стиль и комфорт для вашего дома
          </p>
        </div>

        {/* Video player */}
        <div className="relative mx-auto max-w-3xl">
          {/* Glow effect */}
          <div className="absolute -inset-3 rounded-3xl bg-[#1B3E8F]/60 blur-2xl" />

          {/* Player container 16:9 */}
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            {playing ? (
              <iframe
                ref={iframeRef}
                src={embedSrc}
                title="Рекламный ролик DILAS"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              /* Custom thumbnail + play button */
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 w-full h-full group"
                aria-label="Воспроизвести видео"
              >
                {/* Thumbnail */}
                <img
                  src={thumb}
                  alt="Превью видео"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                  }}
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Outer ring pulse */}
                    <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: "1.8s" }} />
                    {/* Button */}
                    <div
                      className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/95 flex items-center justify-center
                                 shadow-[0_4px_24px_rgba(0,0,0,0.3)]
                                 group-hover:scale-110 group-hover:bg-white
                                 transition-transform duration-200"
                    >
                      <Play
                        size={28}
                        className="text-[#1B3E8F] fill-[#1B3E8F] ml-1"
                      />
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
