"use client";
import { useState } from "react";
import { X, Phone, User, Loader2, CheckCircle } from "lucide-react";

const WHATSAPP_NUMBER = "77056567733";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

type Step = "menu" | "call-form" | "call-success";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setStep("menu");
      setName("");
      setPhone("");
      setError("");
    }, 300);
  }

  async function handleCallSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quick-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ошибка");
      setStep("call-success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Floating button ─────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center group">
        {/* Hover tooltip */}
        <span
          aria-hidden
          className="mr-3 bg-white text-[#0D1F4A] text-sm font-semibold px-3.5 py-2 rounded-xl shadow-lg
                     opacity-0 translate-x-2 pointer-events-none whitespace-nowrap
                     group-hover:opacity-100 group-hover:translate-x-0
                     transition-all duration-200"
        >
          Связаться с нами
        </span>

        {/* Button with pulse rings */}
        <div className="relative flex items-center justify-center">
          {/* Ring 1 */}
          <span className="absolute w-14 h-14 rounded-full bg-[#1B3E8F] animate-ping-ring" />
          {/* Ring 2 (delayed) */}
          <span className="absolute w-14 h-14 rounded-full bg-[#1B3E8F] animate-ping-ring-delay" />

          {/* Online dot */}
          <span className="absolute top-0.5 right-0.5 z-10 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />

          <button
            onClick={() => setOpen(true)}
            aria-label="Обратная связь"
            className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center
                       bg-gradient-to-br from-[#2E57B8] via-[#1B3E8F] to-[#122D6B]
                       shadow-[0_4px_24px_rgba(27,62,143,0.55)]
                       hover:shadow-[0_6px_32px_rgba(27,62,143,0.75)]
                       hover:scale-110 active:scale-95
                       transition-all duration-200"
          >
            <Phone size={24} className="text-white animate-phone-wiggle" />
          </button>
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-backdrop-in"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1B3E8F] to-[#2E57B8] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {step === "menu" && "Как мы можем помочь?"}
                  {step === "call-form" && "Заказать звонок"}
                  {step === "call-success" && "Заявка принята"}
                </p>
                {step === "menu" && (
                  <p className="text-blue-200 text-xs mt-0.5">Выберите удобный способ связи</p>
                )}
              </div>
              <button
                onClick={handleClose}
                aria-label="Закрыть"
                className="text-white/60 hover:text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {step === "menu" && (
                <div className="space-y-3">
                  {/* Option 1 — Call back */}
                  <button
                    onClick={() => setStep("call-form")}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#C5D3EE] hover:border-[#1B3E8F] hover:bg-[#F0F4FB] transition-all text-left group/opt"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#1B3E8F]/10 flex items-center justify-center flex-shrink-0 group-hover/opt:bg-[#1B3E8F]/20 transition-colors">
                      <Phone size={20} className="text-[#1B3E8F]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0D1F4A] text-sm">Заказать обратный звонок</p>
                      <p className="text-[#4A5E85] text-xs mt-0.5">Мы перезвоним в течение дня</p>
                    </div>
                  </button>

                  {/* Option 2 — WhatsApp */}
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClose}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#C5D3EE] hover:border-[#25D366] hover:bg-green-50 transition-all text-left group/wa"
                  >
                    <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 group-hover/wa:bg-green-200 transition-colors">
                      <WhatsAppIcon />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0D1F4A] text-sm">Написать в WhatsApp</p>
                      <p className="text-[#4A5E85] text-xs mt-0.5">Онлайн-чат с менеджером</p>
                    </div>
                  </a>
                </div>
              )}

              {step === "call-form" && (
                <form onSubmit={handleCallSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#0D1F4A] mb-1.5 flex items-center gap-1.5">
                      <User size={13} /> Ваше имя
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Введите имя"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0D1F4A] mb-1.5 flex items-center gap-1.5">
                      <Phone size={13} /> Номер телефона
                    </label>
                    <div className="flex gap-2">
                      <div className="bg-[#F0F4FB] border border-[#C5D3EE] rounded-md px-3 flex items-center text-sm text-[#4A5E85] flex-shrink-0 select-none">
                        +7
                      </div>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="700 123 4567"
                        inputMode="tel"
                        required
                        className="input-field"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs">{error}</p>}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep("menu")}
                      className="flex-1 py-2.5 rounded-lg border border-[#C5D3EE] text-sm font-semibold text-[#0D1F4A] hover:bg-[#F0F4FB] transition-colors"
                    >
                      Назад
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : "Отправить"}
                    </button>
                  </div>
                </form>
              )}

              {step === "call-success" && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} className="text-green-600" />
                  </div>
                  <p className="font-bold text-[#0D1F4A] text-base mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Заявка отправлена!
                  </p>
                  <p className="text-[#4A5E85] text-sm mb-4">
                    Мы перезвоним вам в течение рабочего дня
                  </p>
                  <button onClick={handleClose} className="btn-primary w-full py-2.5 text-sm">
                    Хорошо
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#25D366" width="22" height="22">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
