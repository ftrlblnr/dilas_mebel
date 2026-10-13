import { NextResponse } from "next/server";
import { recalculateBundleAuto } from "@/lib/bundle-server";
import { isAdmin } from "@/lib/auth";

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  recalculateBundleAuto();
  return NextResponse.json({ ok: true });
}
