import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readSlides, writeSlides } from "@/lib/slides-server";

const ADMIN_PASSWORD = "dilas2024";

function authorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${ADMIN_PASSWORD}`;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const slides = readSlides();
  const idx = slides.findIndex((s) => s.id === Number(id));
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  slides[idx] = { ...slides[idx], ...body, id: slides[idx].id };
  writeSlides(slides);
  revalidatePath("/");
  return NextResponse.json(slides[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const slides = readSlides();
  const filtered = slides.filter((s) => s.id !== Number(id));
  if (filtered.length === slides.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  writeSlides(filtered);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
