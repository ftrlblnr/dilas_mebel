import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { readSettings, writeSettings } from "@/lib/settings-server";

export async function GET() {
  return NextResponse.json(readSettings());
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const current = readSettings();
  const updated = { ...current, ...body };
  writeSettings(updated);
  revalidatePath("/");
  return NextResponse.json(updated);
}
