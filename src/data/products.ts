import { Product } from "@/types";

export const PRODUCTS: Product[] = [
  {
    id: "1",
    sku: "DLS-SF-001",
    name: "Диван Oslo",
    slug: "divan-oslo",
    category: "living-room",
    subcategory: "sofas",
    description: "Мягкий диван в современном скандинавском стиле. Обтянут высококачественной тканью, ортопедическое основание.",
    price: 180000,
    salePrice: 150000,
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
    ],
    dimensions: { width: 220, depth: 90, height: 85, weight: 65 },
    material: "Ткань + Дерево",
    style: "Скандинавский",
    inStock: true,
    tags: ["диван", "гостиная", "мягкая мебель"],
    featured: true,
    isNew: false,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    sku: "DLS-BD-001",
    name: "Кровать Comfort King",
    slug: "krovat-comfort-king",
    category: "bedroom",
    subcategory: "beds",
    description: "Просторная и удобная кровать размера king-size. Украшена мягкой панелью изголовья.",
    price: 220000,
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
    ],
    dimensions: { width: 200, depth: 210, height: 120, weight: 80 },
    material: "МДФ + Ткань",
    style: "Современный",
    inStock: true,
    tags: ["кровать", "спальня", "king size"],
    featured: true,
    isNew: true,
    createdAt: "2024-02-10",
  },
  {
    id: "3",
    sku: "DLS-DT-001",
    name: "Обеденный стол Nordic",
    slug: "stol-nordic",
    category: "decor",
    subcategory: "paintings",
    description: "Обеденный стол из натурального дерева. Рассчитан на 6 человек.",
    price: 95000,
    salePrice: 75000,
    images: [
      "https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=800&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
    ],
    dimensions: { width: 160, depth: 90, height: 76, weight: 45 },
    material: "Массив дерева",
    style: "Скандинавский",
    inStock: true,
    tags: ["стол", "столовая", "дерево"],
    featured: true,
    isNew: false,
    createdAt: "2024-01-20",
  },
  {
    id: "4",
    sku: "DLS-OC-001",
    name: "Кресло ErgoWork Pro",
    slug: "kreslo-ergowork-pro",
    category: "living-room",
    subcategory: "armchairs",
    description: "Ортопедическое кресло для офиса. Регулируемая поддержка спины.",
    price: 65000,
    images: [
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80",
    ],
    dimensions: { width: 65, depth: 65, height: 120, weight: 15 },
    material: "Сетка + Пластик",
    style: "Современный",
    inStock: true,
    tags: ["кресло", "офис", "ортопедическое"],
    featured: false,
    isNew: true,
    createdAt: "2024-03-01",
  },
  {
    id: "5",
    sku: "DLS-SF-002",
    name: "Угловой диван Velvet",
    slug: "uglovoy-divan-velvet",
    category: "living-room",
    subcategory: "sofas",
    description: "Угловой диван, обтянутый велюром. Большой семейный диван.",
    price: 280000,
    salePrice: 245000,
    images: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    ],
    dimensions: { width: 280, depth: 200, height: 90, weight: 95 },
    material: "Велюр + Дерево",
    style: "Люкс",
    inStock: true,
    tags: ["диван", "угловой", "велюр"],
    featured: true,
    isNew: false,
    createdAt: "2024-02-05",
  },
  {
    id: "6",
    sku: "DLS-CT-001",
    name: "Журнальный стол Glass Top",
    slug: "zhurnalnyy-stol-glass-top",
    category: "living-room",
    subcategory: "chairs",
    description: "Современный журнальный стол со стеклянной столешницей. Металлические ножки.",
    price: 45000,
    images: [
      "https://images.unsplash.com/photo-1601556123240-462912ece5af?w=800&q=80",
    ],
    dimensions: { width: 110, depth: 60, height: 45, weight: 20 },
    material: "Стекло + Металл",
    style: "Современный",
    inStock: false,
    tags: ["стол", "журнальный", "стекло"],
    featured: false,
    isNew: false,
    createdAt: "2024-01-28",
  },
  {
    id: "7",
    sku: "DLS-WD-001",
    name: "Шкаф Premium",
    slug: "shkaf-premium",
    category: "bedroom",
    subcategory: "beds",
    description: "Большой шкаф с 3 дверьми. Внутри: штанга для одежды, полки и ящики.",
    price: 150000,
    salePrice: 125000,
    images: [
      "https://images.unsplash.com/photo-1558997519-83ea9252eef8?w=800&q=80",
    ],
    dimensions: { width: 180, depth: 60, height: 220, weight: 120 },
    material: "ЛДСП + МДФ",
    style: "Классический",
    inStock: true,
    tags: ["шкаф", "одежда", "спальня"],
    featured: false,
    isNew: false,
    createdAt: "2024-01-10",
  },
  {
    id: "8",
    sku: "DLS-MT-001",
    name: "Матрас OrthoCare Pro",
    slug: "matras-orthocare-pro",
    category: "bedroom",
    subcategory: "mattresses",
    description: "Ортопедический матрас с независимым пружинным блоком. Размер 180x200 см.",
    price: 120000,
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    ],
    dimensions: { width: 180, depth: 200, height: 25, weight: 35 },
    material: "Пружины + Латекс",
    style: "Ортопедический",
    inStock: true,
    tags: ["матрас", "ортопедический", "сон"],
    featured: true,
    isNew: true,
    createdAt: "2024-03-15",
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === "sale") return PRODUCTS.filter((p) => p.salePrice);
  return PRODUCTS.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}
