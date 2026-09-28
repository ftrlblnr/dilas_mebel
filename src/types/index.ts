export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];

  dimensions?: { width: number; depth: number; height: number; weight?: number };
  material?: string;
  style?: string;
  inStock: boolean;
  tags: string[];
  featured: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  createdAt: string;
}

export interface SelectionItem {
  product: Product;
  quantity: number;
}

export interface CallbackRequest {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  preferredTime: "morning" | "afternoon" | "evening";
  comment?: string;
  items: SelectionItem[];
}

export interface CustomVariant {
  id: string;
  label: string;
  price: number;
  // false = недоступно для выбора (нет в наличии); undefined/true = доступно
  inStock?: boolean;
  // for cascading root nodes: level index (string) → child options
  levelChildren?: Record<string, CustomVariant[]>;
}

export interface CustomCriterion {
  id: string;
  name: string;
  type?: "select" | "checkbox" | "checkbox-group" | "cascading";
  variants: CustomVariant[];
  showInCard?: boolean;
  defaultValue?: string;
  cascadeLevels?: string[];
  // for cascading: default selection per level index ("0" = root, "1" = first sub-level, …)
  cascadeDefault?: Record<string, string>;
}

export type CustomizationMap = Record<string, CustomCriterion[]>;

export interface CustomOrderSelection {
  criterionId: string;
  criterionName: string;
  variantId: string;
  variantLabel: string;
  price: number;
}

export interface CustomOrder {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  fullName: string;
  phone: string;
  selections: CustomOrderSelection[];
  totalPrice: number;
}

export interface BundleEntry {
  manual: string[];
  auto: string[];
}

export type BundleMap = Record<string, BundleEntry>;

export interface OrderHistoryEntry {
  id: string;
  items: string[];
  timestamp: string;
}
