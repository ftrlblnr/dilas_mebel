"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Heart, ClipboardList, Save, CheckCircle } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import ProductCard from "@/components/products/ProductCard";
import { formatPrice, cn } from "@/lib/utils";

interface Profile {
  name: string;
  phone: string;
  city: string;
  email: string;
}

interface CallbackRecord {
  refNumber: string;
  timestamp: string;
  fullName: string;
  phone: string;
  city: string;
  email: string;
  preferredTime: string;
  comment: string;
  itemsCount: number;
  estimatedTotal: number;
  itemsSummary: string;
}

const TIME_LABELS: Record<string, string> = {
  morning: "Утром (9:00–12:00)",
  afternoon: "Днём (12:00–17:00)",
  evening: "Вечером (17:00–21:00)",
};

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "wishlist" | "callbacks">("profile");
  const [profile, setProfile] = useState<Profile>({ name: "", phone: "", city: "", email: "" });
  const [saved, setSaved] = useState(false);
  const [callbacks, setCallbacks] = useState<CallbackRecord[]>([]);
  const { items: wishlistItems } = useWishlistStore();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dilas-profile");
      if (stored) setProfile(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dilas-callbacks");
      if (stored) setCallbacks(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, [activeTab]);

  const handleSaveProfile = () => {
    try {
      localStorage.setItem("dilas-profile", JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Профиль", icon: User },
    { id: "wishlist" as const, label: "Список желаний", icon: Heart },
    { id: "callbacks" as const, label: "Мои заявки", icon: ClipboardList },
  ];

  return (
    <div className="container-content py-8 max-w-5xl">
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-primary">Главная</Link>
        <span>/</span>
        <span className="text-text font-semibold">Аккаунт</span>
      </nav>

      <h1 className="font-display font-bold text-2xl md:text-3xl text-text mb-8">Мой аккаунт</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="md:w-56 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left w-full",
                  activeTab === id
                    ? "bg-primary text-white shadow-sm"
                    : "text-text hover:bg-surface"
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg text-text mb-6">Профиль</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-semibold text-text mb-1.5 block">Имя</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Введите ваше имя"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text mb-1.5 block">Телефон</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+7 700 000 0000"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text mb-1.5 block">Город</label>
                  <input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="Астана, Алматы..."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-text mb-1.5 block">Email</label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    type="email"
                    placeholder="email@example.com"
                    className="input-field"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all",
                    saved
                      ? "bg-green-600 text-white"
                      : "btn-primary"
                  )}
                >
                  {saved ? (
                    <><CheckCircle size={16} /> Сохранено!</>
                  ) : (
                    <><Save size={16} /> Сохранить</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === "wishlist" && (
            <div>
              <h2 className="font-display font-bold text-lg text-text mb-6">
                Список желаний
                {wishlistItems.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-text-muted">({wishlistItems.length})</span>
                )}
              </h2>
              {wishlistItems.length === 0 ? (
                <div className="card p-10 flex flex-col items-center text-center">
                  <Heart size={40} className="text-text-muted mb-4" />
                  <p className="font-semibold text-text mb-2">Список желаний пуст</p>
                  <p className="text-text-muted text-sm mb-6">Добавляйте товары, нажимая на иконку сердечка</p>
                  <Link href="/products" className="btn-primary px-6 py-2.5 text-sm">
                    Смотреть товары
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Callbacks Tab */}
          {activeTab === "callbacks" && (
            <div>
              <h2 className="font-display font-bold text-lg text-text mb-6">
                Мои заявки
                {callbacks.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-text-muted">({callbacks.length})</span>
                )}
              </h2>
              {callbacks.length === 0 ? (
                <div className="card p-10 flex flex-col items-center text-center">
                  <ClipboardList size={40} className="text-text-muted mb-4" />
                  <p className="font-semibold text-text mb-2">Нет заявок</p>
                  <p className="text-text-muted text-sm mb-6">Ваши заявки на обратный звонок будут отображаться здесь</p>
                  <Link href="/callback" className="btn-primary px-6 py-2.5 text-sm">
                    Оставить заявку
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {callbacks.map((cb) => (
                    <div key={cb.refNumber} className="card p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <span className="text-xs text-text-muted">№ заявки</span>
                          <p className="font-bold text-primary text-sm">{cb.refNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-text-muted">Дата</span>
                          <p className="text-sm text-text">
                            {new Date(cb.timestamp).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm mb-3">
                        <div>
                          <span className="text-text-muted text-xs">Имя: </span>
                          <span className="font-medium text-text">{cb.fullName}</span>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Телефон: </span>
                          <span className="font-medium text-text">{cb.phone}</span>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Город: </span>
                          <span className="font-medium text-text">{cb.city}</span>
                        </div>
                        <div>
                          <span className="text-text-muted text-xs">Время: </span>
                          <span className="font-medium text-text">{TIME_LABELS[cb.preferredTime] || cb.preferredTime}</span>
                        </div>
                      </div>
                      {cb.itemsSummary && (
                        <div className="bg-surface rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-text-muted text-xs">Товаров: {cb.itemsCount}</span>
                            <span className="font-bold text-primary text-sm">{formatPrice(cb.estimatedTotal)}</span>
                          </div>
                          <p className="text-text-muted text-xs line-clamp-2">{cb.itemsSummary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
