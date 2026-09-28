import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join, extname } from "path";
import { randomBytes } from "crypto";

const ADMIN_PASSWORD = "dilas2024";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Too large (max 10 MB)" }, { status: 400 });

  const ext = extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  const dest = join(process.cwd(), "public", "uploads", filename);

  await writeFile(dest, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${filename}` });
}
