import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportLeadsCsv } from "@/lib/leads-server";
import type { LeadSource } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const csv = await exportLeadsCsv(
    {
      stageId: sp.get("stageId") || undefined,
      source: (sp.get("source") as LeadSource) || undefined,
      assignedToId: sp.get("assignedToId") || undefined,
      search: sp.get("search") || undefined,
      dateFrom: sp.get("dateFrom") ? new Date(sp.get("dateFrom")!) : undefined,
      dateTo: sp.get("dateTo") ? new Date(sp.get("dateTo")!) : undefined,
      includeArchived: sp.get("archived") === "1",
    },
    { id: session.user.id, role: session.user.role ?? "MANAGER" }
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${date}.csv"`,
    },
  });
}
