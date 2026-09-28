"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock } from "lucide-react";

export default function MiniAppLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    let res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error === "CredentialsSignin" || (res?.error && !res?.ok)) {
      // Telegram's in-app WebView occasionally fails to persist the CSRF cookie on the very
      // first request after opening the mini app, which surfaces as a bogus "wrong password".
      // A fresh signIn() call re-fetches the CSRF cookie and usually succeeds on retry.
      await new Promise((r) => setTimeout(r, 250));
      res = await signIn("credentials", { email, password, redirect: false });
    }
    setLoading(false);
    if (res?.error) {
      setError("Неверный email или пароль");
      return;
    }
    router.push("/miniapp");
    router.refresh();
  };

  return (
    <div className="ma-screen flex items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-[20px] flex items-center justify-center ma-accent-bg" style={{ boxShadow: "var(--ma-shadow)" }}>
            <span className="text-2xl font-bold ma-accent-text">D</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <h1 className="text-lg font-bold ma-text tracking-tight">DILAS Manager</h1>
            <p className="text-sm ma-hint">Вход по логину CRM</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium ma-hint">Email</label>
          <div className="ma-search-wrap">
            <Mail size={15} className="ma-search-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dilas.kz"
              className="ma-input pl-9"
              required
              autoFocus
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium ma-hint">Пароль</label>
          <div className="ma-search-wrap">
            <Lock size={15} className="ma-search-icon" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="ma-input pl-9"
              required
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="ma-button-primary mt-2 disabled:opacity-60">
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
