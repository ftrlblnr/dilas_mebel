import "server-only";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface NavSubcategory {
  id: string;
  label: string;
  slug: string;
  isAll?: boolean;
}

export interface NavCategory {
  id: string;
  label: string;
  labelEn: string;
  slug: string;
  subcategories: NavSubcategory[];
  isSale?: boolean;
}

const DB_PATH = join(process.cwd(), "data", "categories.json");

export function readCategories(): NavCategory[] {
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as NavCategory[];
}

export function writeCategories(categories: NavCategory[]): void {
  writeFileSync(DB_PATH, JSON.stringify(categories, null, 2), "utf-8");
}
