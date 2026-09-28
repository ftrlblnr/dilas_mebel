"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-display font-extrabold text-xl">D</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text">
            {isLogin ? "Войти" : "Регистрация"}
          </h1>
          <p className="text-text-muted text-sm mt-1">Войдите в личный кабинет Dilas</p>
        </div>

        <div className="card p-8">
          <div className="flex bg-surface rounded-lg p-1 mb-6">
            {["Войти", "Регистрация"].map((label, i) => (
              <button
                key={label}
                onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  (i === 0) === isLogin ? "bg-white shadow-sm text-primary" : "text-text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-semibold text-text mb-1.5 block">Имя и фамилия</label>
                <input type="text" placeholder="Ваше имя и фамилия" className="input-field" required />
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-text mb-1.5 block">Email</label>
              <input type="email" placeholder="email@example.com" className="input-field" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-text mb-1.5 block">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {isLogin && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Забыли пароль?
                </Link>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLogin ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
