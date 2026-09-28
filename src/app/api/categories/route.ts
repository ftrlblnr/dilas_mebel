import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readCategories, writeCategories } from "@/lib/categories-server";
import type { NavCategory } from "@/lib/categories-server";

const ADMIN_PASSWORD = "dilas2024";

function authorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${ADMIN_PASSWORD}`;
}

export async function GET() {
  return NextResponse.json(readCategories());
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as NavCategory[];
  if (!Array.isArray(body)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  for (const cat of body) {
    if (!cat.slug?.trim() || !cat.label?.trim()) {
      return NextResponse.json({ error: "У раздела должны быть заполнены название и slug" }, { status: 400 });
    }
    for (const sub of cat.subcategories) {
      if (!sub.slug?.trim() || !sub.label?.trim()) {
        return NextResponse.json({ error: "У подраздела должны быть заполнены название и slug" }, { status: 400 });
      }
      // "Смотреть всё" всегда ссылается на slug родительского раздела
      if (sub.isAll) sub.slug = cat.slug;
    }
  }

  const slugs = body.map((c) => c.slug);
  if (new Set(slugs).size !== slugs.length) {
    return NextResponse.json({ error: "Slug разделов должны быть уникальными" }, { status: 400 });
  }

  writeCategories(body);
  revalidatePath("/", "layout");
  return NextResponse.json(body);
}
