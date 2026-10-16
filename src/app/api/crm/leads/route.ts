import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listLeads } from "@/lib/leads-server";
import type { LeadSource } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const result = await listLeads(
    {
      stageId: sp.get("stageId") || undefined,
      source: (sp.get("source") as LeadSource) || undefined,
      assignedToId: sp.get("assignedToId") || undefined,
      customerId: sp.get("customerId") || undefined,
      search: sp.get("search") || undefined,
      dateFrom: sp.get("dateFrom") ? new Date(sp.get("dateFrom")!) : undefined,
      dateTo: sp.get("dateTo") ? new Date(sp.get("dateTo")!) : undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
      includeArchived: sp.get("archived") === "1",
    },
    { id: session.user.id, role: session.user.role ?? "MANAGER" }
  );
  return NextResponse.json(result);
}
