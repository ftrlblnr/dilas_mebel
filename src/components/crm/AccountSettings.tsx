"use client";
import { useState } from "react";
import { KeyRound, Eye, EyeOff, Send } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function AccountSettings({
  name,
  email,
  telegramLinked,
}: {
  name: string;
  email: string;
  telegramLinked: boolean;
}) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/crm/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Не удалось сменить пароль");
        return;
      }
      showToast("Пароль изменён");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setError("Не удалось сменить пароль");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display font-bold text-xl text-text mb-6">Мой аккаунт</h1>

      <div className="card p-5 mb-6 max-w-md space-y-1 text-sm">
        <p><span className="text-text-muted">Имя: </span>{name}</p>
        <p><span className="text-text-muted">Email: </span>{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 max-w-md space-y-4">
        <h2 className="font-semibold text-text flex items-center gap-1.5"><KeyRound size={16} /> Сменить пароль</h2>
        <div>
          <label className="text-sm font-semibold text-text mb-1.5 block">Текущий пароль</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-text mb-1.5 block">Новый пароль</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              className="input-field pr-10"
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 disabled:opacity-60">
          {submitting ? "Сохранение..." : "Сменить пароль"}
        </button>
      </form>

      <div className="card p-5 mt-6 max-w-md space-y-2">
        <h2 className="font-semibold text-text flex items-center gap-1.5"><Send size={16} /> Telegram-уведомления</h2>
        {telegramLinked ? (
          <p className="text-sm text-green-700">✅ Подключено — вы получаете уведомления о заявках в Telegram.</p>
        ) : (
          <p className="text-sm text-text-muted">
            ⛔ Не подключено. Откройте мини-приложение через бота <strong>@dilas_manager_bot</strong> и войдите под
            своим логином CRM — Telegram подключится автоматически.
          </p>
        )}
      </div>
    </div>
  );
}
