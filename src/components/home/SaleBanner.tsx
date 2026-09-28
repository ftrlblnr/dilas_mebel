"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

function getTimeLeft() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end.getTime() - Date.now();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

export default function SaleBanner() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="bg-primary py-12 md:py-16">
      <div className="container-content">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-block bg-accent text-text text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              Специальное предложение
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-2">
              Летняя распродажа — до 30%
            </h2>
            <p className="text-blue-200 text-base">Специальные цены на избранные модели мебели</p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <p className="text-blue-200 text-sm font-semibold">До конца акции</p>
            <div className="flex gap-3">
              {[
                { value: pad(time.h), label: "ч" },
                { value: pad(time.m), label: "мин" },
                { value: pad(time.s), label: "сек" },
              ].map((unit, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg w-16 h-16 flex items-center justify-center">
                    <span className="font-display font-extrabold text-2xl text-white">{unit.value}</span>
                  </div>
                  <span className="text-xs text-blue-300 mt-1">{unit.label}</span>
                </div>
              ))}
            </div>
            <Link href="/sale" className="btn-accent px-8 py-3 mt-2 inline-block">
              Смотреть скидки
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
