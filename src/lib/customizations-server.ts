import "server-only";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { CustomCriterion, CustomizationMap } from "@/types";

const DB_PATH = join(process.cwd(), "data", "customizations.json");

export function readCustomizations(): CustomizationMap {
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as CustomizationMap;
}

export function writeCustomizations(data: CustomizationMap): void {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getProductCustomizations(productId: string): CustomCriterion[] {
  return readCustomizations()[productId] ?? [];
}
