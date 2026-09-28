import "server-only";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface HeroSlide {
  id: number;
  image: string;
  headline: string;
  subtext: string;
  cta: string;
  ctaLink: string;
}

const DB_PATH = join(process.cwd(), "data", "slides.json");

export function readSlides(): HeroSlide[] {
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as HeroSlide[];
}

export function writeSlides(slides: HeroSlide[]): void {
  writeFileSync(DB_PATH, JSON.stringify(slides, null, 2), "utf-8");
}
