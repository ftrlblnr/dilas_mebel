"use client";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="bg-primary section-padding">
      <div className="container-content text-center max-w-2xl mx-auto">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white mb-3">
          Получите скидку на первый заказ
        </h2>
        <p className="text-blue-200 text-base mb-8">
          Подпишитесь на email-рассылку — будьте в курсе специальных предложений и скидок
        </p>
        {submitted ? (
          <div className="bg-white/10 rounded-lg px-6 py-4 text-white font-semibold flex items-center justify-center gap-2">
            <CheckCircle size={18} strokeWidth={2} /> Вы успешно подписались! Промокод будет отправлен на email.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ваш email"
              className="flex-1 bg-white rounded-md px-4 py-3 text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button type="submit" className="btn-accent px-6 py-3 flex-shrink-0">
              Подписаться
            </button>
          </form>
        )}
        <p className="text-blue-300 text-xs mt-4">
          Подписываясь, вы соглашаетесь с нашей политикой конфиденциальности
        </p>
      </div>
    </section>
  );
}
