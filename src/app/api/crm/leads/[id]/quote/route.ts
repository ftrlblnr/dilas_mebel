import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuoteForLead } from "@/lib/quotes-server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const quote = await getQuoteForLead(id, { id: session.user.id, role: session.user.role ?? "MANAGER" });
  return NextResponse.json(quote);
}
