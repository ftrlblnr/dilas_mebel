import Link from "next/link";

interface Category {
  label: string;
  labelEn: string;
  slug: string;
  subcategories: { label: string; slug: string; isAll?: boolean }[];
}

export default function MegaMenu({ category }: { category: Category }) {
  return (
    <div className="absolute top-full left-0 bg-white border border-border shadow-card-hover rounded-b-lg py-5 px-6 min-w-[220px] z-50 animate-fade-in">
      <div className="flex flex-col gap-1">
        {category.subcategories.map((sub) => (
          <Link
            key={sub.slug}
            href={`/products?category=${sub.isAll ? category.slug : sub.slug}`}
            className={
              sub.isAll
                ? "text-sm font-bold text-primary hover:text-primary-dark mt-2 pt-2 border-t border-border"
                : "text-sm text-text-muted hover:text-primary transition-colors py-0.5"
            }
          >
            {sub.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
