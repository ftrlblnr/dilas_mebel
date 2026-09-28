"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ClipboardList, Menu, X, ChevronDown, Heart } from "lucide-react";
import { useSelectionStore } from "@/store/selectionStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { NavCategory } from "@/lib/categories-server";
import { cn } from "@/lib/utils";
import MegaMenu from "./MegaMenu";
import SearchBar from "./SearchBar";

export default function Header({ categories }: { categories: NavCategory[] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const { getTotalItems, openDrawer } = useSelectionStore();
  const { getCount } = useWishlistStore();
  const totalItems = getTotalItems();
  const wishlistCount = getCount();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchButtonRef.current?.contains(target)) return;
      if (searchPanelRef.current?.contains(target)) return;
      setSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white",
        isScrolled ? "shadow-md" : "shadow-sm"
      )}
    >
      {/* Main Nav */}
      <div
        className={cn(
          "bg-white transition-all duration-300",
          isScrolled ? "py-2" : "py-3"
        )}
      >
        <div className="container-content flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/brand/dilas-logo.png"
              alt="DILAS"
              width={415}
              height={191}
              priority
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0 flex-1">
            {categories.map((cat) => (
              <div
                key={cat.slug}
                className="relative"
                onMouseEnter={() => setActiveCategory(cat.slug)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  href={`/products?category=${cat.slug}`}
                  className={cn(
                    "flex items-center gap-0.5 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                    cat.isSale
                      ? "text-accent hover:text-accent-dark"
                      : "text-text hover:text-primary",
                    activeCategory === cat.slug && "text-primary"
                  )}
                >
                  {cat.labelEn}
                  {cat.subcategories.length > 0 && <ChevronDown size={14} />}
                </Link>
                {activeCategory === cat.slug && cat.subcategories.length > 0 && (
                  <MegaMenu category={cat} />
                )}
              </div>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              ref={searchButtonRef}
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-md hover:bg-surface transition-colors"
              aria-label="Поиск"
            >
              <Search size={20} className="text-text" />
            </button>
            <Link
              href="/wishlist"
              className="relative p-2 rounded-md hover:bg-surface transition-colors hidden md:flex"
              aria-label="Список желаний"
            >
              <Heart size={20} className="text-text" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={openDrawer}
              className="relative p-2 rounded-md hover:bg-surface transition-colors"
              aria-label="Список выбора"
            >
              <ClipboardList size={20} className="text-text" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce-once">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-surface transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X size={22} className="text-text" /> : <Menu size={22} className="text-text" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div ref={searchPanelRef}>
            <SearchBar onClose={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-border shadow-lg max-h-[70vh] overflow-y-auto">
          <div className="container-content py-4 flex flex-col gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className={cn(
                  "py-2.5 px-3 rounded-md text-sm font-semibold border-b border-surface last:border-0",
                  cat.isSale ? "text-accent" : "text-text hover:text-primary hover:bg-surface"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
