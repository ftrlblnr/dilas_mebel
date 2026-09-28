import { NextRequest, NextResponse } from "next/server";
import { recalculateBundleAuto } from "@/lib/bundle-server";

const ADMIN_PASSWORD = "dilas2024";

export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  recalculateBundleAuto();
  return NextResponse.json({ ok: true });
}
