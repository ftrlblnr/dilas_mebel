import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getLeadNoteAuthor, updateLeadNote, deleteLeadNote } from "@/lib/leads-server";

const patchSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

async function assertCanEdit(noteId: string) {
  const session = await auth();
  if (!session?.user?.id) return { session: null, error: NextResponse.json({ message: "Не авторизован" }, { status: 401 }) };

  const authorId = await getLeadNoteAuthor(noteId);
  if (!authorId) return { session, error: NextResponse.json({ message: "Заметка не найдена" }, { status: 404 }) };

  const canEdit = authorId === session.user.id || session.user.role === "ADMIN";
  if (!canEdit) return { session, error: NextResponse.json({ message: "Доступ запрещён" }, { status: 403 }) };

  return { session, error: null };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await params;
  const { error } = await assertCanEdit(noteId);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });

  const note = await updateLeadNote(noteId, parsed.data.text);
  return NextResponse.json(note);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await params;
  const { error } = await assertCanEdit(noteId);
  if (error) return error;

  await deleteLeadNote(noteId);
  return NextResponse.json({ ok: true });
}
