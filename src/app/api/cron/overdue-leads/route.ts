import { NextRequest, NextResponse } from "next/server";
import { notifyOverdueLeads } from "@/lib/lead-notifications";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const notified = await notifyOverdueLeads();
  return NextResponse.json({ ok: true, notified });
}
