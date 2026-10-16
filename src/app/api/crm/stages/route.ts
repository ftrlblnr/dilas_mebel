import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listActiveStages } from "@/lib/stages-server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  const stages = await listActiveStages();
  return NextResponse.json(stages);
}
