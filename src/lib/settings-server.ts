import "server-only";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type GalleryLayout = "featured" | "grid-2rows";

export interface GallerySettings {
  layout: GalleryLayout;
  photos: (string | null)[];
}

export interface SiteSettings {
  youtubeUrl: string;
  gallery: GallerySettings;
}

const DB_PATH = join(process.cwd(), "data", "settings.json");

export function readSettings(): SiteSettings {
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as SiteSettings;
}

export function writeSettings(settings: SiteSettings): void {
  writeFileSync(DB_PATH, JSON.stringify(settings, null, 2), "utf-8");
}
