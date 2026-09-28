"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AnimateIn } from "@/components/ui/AnimateIn";

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  return (
    <section className="section-padding bg-surface">
      <div className="container-content">
        <AnimateIn>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-text text-center mb-10">
            Что говорят наши покупатели
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.1}>
        <div className="relative max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-display font-bold text-xl mx-auto mb-4">
              {TESTIMONIALS[current].avatar}
            </div>
            <div className="flex justify-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < TESTIMONIALS[current].rating ? "text-accent fill-accent" : "text-border"}
                />
              ))}
            </div>
            <p className="text-text text-base italic mb-4 leading-relaxed">
              &ldquo;{TESTIMONIALS[current].text}&rdquo;
            </p>
            <p className="font-semibold text-text">{TESTIMONIALS[current].name}</p>
            <p className="text-xs text-text-muted mt-1">{TESTIMONIALS[current].product}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-surface-alt transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn("rounded-full transition-all", i === current ? "w-6 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-border")}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((c) => (c + 1) % TESTIMONIALS.length)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-surface-alt transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        </AnimateIn>
      </div>
    </section>
  );
}
