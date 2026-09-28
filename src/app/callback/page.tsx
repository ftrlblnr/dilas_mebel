"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSelectionStore } from "@/store/selectionStore";
import { formatPrice } from "@/lib/utils";
import { Phone, User, Mail, MapPin, Clock, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  fullName: z.string().min(2, "Имя должно содержать не менее 2 символов"),
  phone: z.string().min(10, "Введите корректный номер"),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  city: z.string().min(2, "Введите название города"),
  preferredTime: z.enum(["morning", "afternoon", "evening"]),
  comment: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CallbackPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearSelection } = useSelectionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferredTime: "afternoon" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, items }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Произошла ошибка");

      // Save callback history to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("dilas-callbacks") || "[]");
        const entry = {
          refNumber: result.refNumber,
          timestamp: new Date().toISOString(),
          fullName: data.fullName,
          phone: data.phone,
          city: data.city,
          email: data.email || "",
          preferredTime: data.preferredTime,
          comment: data.comment || "",
          itemsCount: items.length,
          estimatedTotal: items.reduce(
            (sum, i) => sum + (i.product.salePrice ?? i.product.price) * i.quantity,
            0
          ),
          itemsSummary: items.map((i) => `${i.product.name} x${i.quantity}`).join(", "),
        };
        localStorage.setItem("dilas-callbacks", JSON.stringify([entry, ...existing]));
      } catch {
        // ignore localStorage errors
      }

      clearSelection();
      router.push(`/callback/success?ref=${result.refNumber}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-content py-8 max-w-5xl">
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-primary">Главная</Link>
        <span>/</span>
        <span className="text-text font-semibold">Обратный звонок</span>
      </nav>

      <h1 className="font-display font-bold text-2xl md:text-3xl text-text mb-2">Запросить обратный звонок</h1>
      <p className="text-text-muted mb-8">Введите ваши данные — наш менеджер свяжется с вами в течение 1 рабочего дня</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 flex items-center gap-1.5">
              <User size={15} /> Имя и фамилия <span className="text-red-500">*</span>
            </label>
            <input {...register("fullName")} placeholder="Введите имя и фамилию" className="input-field" />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 flex items-center gap-1.5">
              <Phone size={15} /> Номер телефона <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="bg-surface border border-border rounded-md px-3 flex items-center text-sm text-text-muted flex-shrink-0">
                +7
              </div>
              <input {...register("phone")} placeholder="700 123 4567" className="input-field" />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 flex items-center gap-1.5">
              <Mail size={15} /> Email <span className="text-text-muted text-xs font-normal">(необязательно)</span>
            </label>
            <input {...register("email")} type="email" placeholder="email@example.com" className="input-field" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 flex items-center gap-1.5">
              <MapPin size={15} /> Город <span className="text-red-500">*</span>
            </label>
            <input {...register("city")} placeholder="Астана, Алматы, Шымкент..." className="input-field" />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
          </div>

          {/* Preferred Time */}
          <div>
            <label className="text-sm font-semibold text-text mb-2 flex items-center gap-1.5">
              <Clock size={15} /> Удобное время для звонка
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "morning", label: "Утром", sub: "10:00–12:00" },
                { value: "afternoon", label: "Днём", sub: "12:00–17:00" },
                { value: "evening", label: "Вечером", sub: "17:00–20:00" },
              ].map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input {...register("preferredTime")} type="radio" value={opt.value} className="sr-only peer" />
                  <div className="border border-border rounded-lg p-3 text-center peer-checked:border-primary peer-checked:bg-surface transition-all hover:border-primary-light">
                    <p className="font-semibold text-sm text-text">{opt.label}</p>
                    <p className="text-xs text-text-muted">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 flex items-center gap-1.5">
              <MessageSquare size={15} /> Сообщение <span className="text-text-muted text-xs font-normal">(необязательно)</span>
            </label>
            <textarea
              {...register("comment")}
              rows={4}
              placeholder="Напишите ваши вопросы или особые пожелания..."
              className="input-field resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Отправка...</>
            ) : (
              "Отправить заявку"
            )}
          </button>
          <p className="text-xs text-text-muted text-center">
            Отправляя форму, вы соглашаетесь с нашей{" "}
            <Link href="/privacy" className="text-primary hover:underline">политикой конфиденциальности</Link>
          </p>
        </form>

        {/* Selected Items Summary */}
        <div className="lg:col-span-2">
          <div className="card p-5 sticky top-28">
            <h2 className="font-display font-bold text-base text-text mb-4">
              Выбранные товары
              <span className="ml-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-normal">
                {items.length}
              </span>
            </h2>

            {items.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-text-muted text-sm mb-3">Нет выбранных товаров</p>
                <Link href="/products" className="btn-primary text-xs px-4 py-2 inline-block">
                  Смотреть товары
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3 bg-surface rounded-lg p-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text truncate">{item.product.name}</p>
                        <p className="text-xs text-text-muted">{item.quantity} шт.</p>
                        <p className="text-sm font-bold text-primary">
                          {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="text-sm text-text-muted">Примерная сумма</span>
                  <span className="font-display font-bold text-lg text-primary">{formatPrice(getTotalPrice())}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
