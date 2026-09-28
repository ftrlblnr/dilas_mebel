import "server-only";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { BundleMap, BundleEntry, OrderHistoryEntry, Product } from "@/types";

const BUNDLE_PATH = join(process.cwd(), "data", "bundle.json");
const HISTORY_PATH = join(process.cwd(), "data", "order-history.json");

export function readBundle(): BundleMap {
  if (!existsSync(BUNDLE_PATH)) return {};
  return JSON.parse(readFileSync(BUNDLE_PATH, "utf-8")) as BundleMap;
}

export function writeBundle(data: BundleMap): void {
  writeFileSync(BUNDLE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function readOrderHistory(): OrderHistoryEntry[] {
  if (!existsSync(HISTORY_PATH)) return [];
  return JSON.parse(readFileSync(HISTORY_PATH, "utf-8")) as OrderHistoryEntry[];
}

export function appendOrderHistory(entry: OrderHistoryEntry): void {
  const history = readOrderHistory();
  history.push(entry);
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");
}

export function getBundleProducts(productId: string, allProducts: Product[]): Product[] {
  const bundle = readBundle();
  const entry: BundleEntry = bundle[productId] ?? { manual: [], auto: [] };

  const ids = [...new Set([...entry.manual, ...entry.auto])].filter((id) => id !== productId);

  const productMap = new Map(allProducts.map((p) => [p.id, p]));
  return ids.map((id) => productMap.get(id)).filter(Boolean).slice(0, 4) as Product[];
}

export function recalculateBundleAuto(): void {
  const history = readOrderHistory();
  const coOccurrence: Record<string, Record<string, number>> = {};

  for (const entry of history) {
    const items = [...new Set(entry.items)];
    for (const a of items) {
      for (const b of items) {
        if (a === b) continue;
        coOccurrence[a] ??= {};
        coOccurrence[a][b] = (coOccurrence[a][b] ?? 0) + 1;
      }
    }
  }

  const bundle = readBundle();

  for (const [productId, counts] of Object.entries(coOccurrence)) {
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);

    bundle[productId] ??= { manual: [], auto: [] };
    bundle[productId].auto = sorted;
  }

  writeBundle(bundle);
}
