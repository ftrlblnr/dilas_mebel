"use client";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-300">
        <CheckCircle size={15} />
        <span>Вы подписались!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ваш email"
        className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-blue-300 focus:outline-none focus:border-accent focus:bg-white/15 transition-colors"
      />
      <button
        type="submit"
        className="bg-accent hover:bg-accent-dark text-text font-bold px-3 py-2 rounded-md text-xs uppercase tracking-wide transition-colors flex-shrink-0"
      >
        ОК
      </button>
    </form>
  );
}
