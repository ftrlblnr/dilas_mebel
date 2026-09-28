import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readSettings, writeSettings } from "@/lib/settings-server";

const ADMIN_PASSWORD = "dilas2024";

function authorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${ADMIN_PASSWORD}`;
}

export async function GET() {
  return NextResponse.json(readSettings());
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const current = readSettings();
  const updated = { ...current, ...body };
  writeSettings(updated);
  revalidatePath("/");
  return NextResponse.json(updated);
}
