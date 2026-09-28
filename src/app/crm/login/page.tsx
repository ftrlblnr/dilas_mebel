"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function CrmLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    let res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error && !res?.ok) {
      // A stale/unset CSRF cookie on the very first request of a session (seen on some
      // mobile browsers and in-app WebViews) surfaces as a bogus "wrong password" — a
      // fresh signIn() call re-fetches the CSRF cookie and usually succeeds on retry.
      await new Promise((r) => setTimeout(r, 250));
      res = await signIn("credentials", { email, password, redirect: false });
    }
    setLoading(false);
    if (res?.error) {
      setError("Неверный email или пароль");
      return;
    }
    router.push("/crm");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
            <Lock size={24} className="text-white" />
          </div>
        </div>
        <h1 className="font-display font-bold text-xl text-text text-center mb-1">DILAS CRM</h1>
        <p className="text-text-muted text-sm text-center mb-6">Вход для сотрудников</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dilas.kz"
              className="input-field"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 block">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="input-field pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
