import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readSlides, writeSlides } from "@/lib/slides-server";
import type { HeroSlide } from "@/lib/slides-server";

const ADMIN_PASSWORD = "dilas2024";

function authorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${ADMIN_PASSWORD}`;
}

export async function GET() {
  return NextResponse.json(readSlides());
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Omit<HeroSlide, "id">;
  const slides = readSlides();
  const maxId = slides.reduce((m, s) => Math.max(m, s.id), 0);
  const newSlide: HeroSlide = { ...body, id: maxId + 1 };

  writeSlides([...slides, newSlide]);
  revalidatePath("/");
  return NextResponse.json(newSlide, { status: 201 });
}
