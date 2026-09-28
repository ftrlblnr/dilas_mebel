"use client";
import { Truck, ShieldCheck, CreditCard, type LucideIcon } from "lucide-react";
import { StaggerList, StaggerItem } from "@/components/ui/AnimateIn";

const BADGES: { Icon: LucideIcon; title: string; subtitle: string }[] = [
  { Icon: Truck,       title: "Бесплатная доставка по г. Астана", subtitle: "от 150 000 ₸" },
  { Icon: ShieldCheck, title: "Гарантия качества",   subtitle: "2 года гарантии" },
  { Icon: CreditCard,  title: "Рассрочка",            subtitle: "0% переплаты" },
];

export default function TrustBadges() {
  return (
    <section className="bg-white border-y border-border">
      <div className="container-content py-8">
        <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {BADGES.map(({ Icon, title, subtitle }) => (
            <StaggerItem key={title} className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                <Icon size={20} strokeWidth={1.5} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-text text-sm">{title}</p>
                <p className="text-text-muted text-xs">{subtitle}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}
