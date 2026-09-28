@AGENTS.md

# Dilas — Мебельный интернет-магазин

## Суть продукта

Сайт мебельного бренда Dilas. Каталог товаров, избранное, подбор, акции, личный кабинет, админ-панель.

**Live URL:** https://dilas.glb-engineeering.kz
**Code:** `/home/ubuntu/shar_qurylys/dilas`
**Process manager:** PM2, app name `dilas`, port `3000`

## Stack

- **Next.js 16** (App Router, `src/` layout, TypeScript)
- **React 19**, Tailwind CSS v4
- **Prisma ORM** + `@auth/prisma-adapter`
- **NextAuth v5** (beta)
- **Zustand** — state management
- **Framer Motion** — анимации
- **React Hook Form + Zod** — формы и валидация
- **Axios** — HTTP клиент

## Routes (`src/app/`)

```
page.tsx              — главная
products/             — каталог
  [id]/               — карточка товара
sale/                 — акции
search/               — поиск
selection/            — подбор
wishlist/             — избранное
account/              — личный кабинет
admin/                — админ панель
login/                — авторизация
callback/             — OAuth callback
stores/               — (магазины)
```

## Key Components (`src/components/`)

```
layout/
  Header.tsx          — шапка с навигацией
  Footer.tsx
  MegaMenu.tsx        — мега-меню каталога
  SearchBar.tsx
  SelectionDrawer.tsx — боковой дровер подбора
home/                 — секции главной страницы
products/             — компоненты карточек товаров
search/               — компоненты поиска
admin/                — компоненты админ-панели
ui/                   — переиспользуемые UI компоненты
providers/            — контекст-провайдеры
```

## Other Key Dirs

```
src/store/            — Zustand stores
src/data/             — статические/seed данные
src/lib/              — утилиты
src/types/            — TypeScript типы
```

## Dev / Deploy

```bash
# Запуск в dev режиме:
npm run dev

# Сборка и перезапуск (после изменений):
npm run build && pm2 restart dilas

# Логи:
pm2 logs dilas

# tmux сессия (если нужна):
tmux attach -t dilas
# или создать: tmux new-session -d -s dilas -c /home/ubuntu/shar_qurylys/dilas
```

## Gotchas

- После любых изменений обязательно `npm run build && pm2 restart dilas`
- PM2 config: `ecosystem.config.js`
- Tailwind v4 — синтаксис может отличаться от v3 (нет `tailwind.config.js` с `content`)
- NextAuth v5 beta — API отличается от v4; не смешивать документацию версий
