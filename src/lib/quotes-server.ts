import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getLeadById, type LeadActor } from "@/lib/leads-server";
import { resolveApprovalRequired } from "@/lib/orders-server";

const QUOTE_INCLUDE = {
  versions: {
    include: { items: { orderBy: { sortOrder: "asc" as const } }, createdBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
    orderBy: { versionNumber: "desc" as const },
  },
} satisfies Prisma.QuoteInclude;

export type QuoteWithVersions = Prisma.QuoteGetPayload<{ include: typeof QUOTE_INCLUDE }>;

const PUBLIC_VERSION_INCLUDE = {
  items: { orderBy: { sortOrder: "asc" as const } },
  quote: { include: { createdBy: { select: { name: true } }, lead: { select: { refNumber: true } } } },
} satisfies Prisma.QuoteVersionInclude;

export type PublicQuoteVersion = Prisma.QuoteVersionGetPayload<{ include: typeof PUBLIC_VERSION_INCLUDE }>;

function generatePublicToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function validateDiscount(discountPercent: number) {
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error("Скидка должна быть от 0 до 100%");
  }
}

async function assertLeadVisible(leadId: string, actor: LeadActor): Promise<void> {
  const lead = await getLeadById(leadId, actor);
  if (!lead) throw new Error("Заявка не найдена");
}

export interface QuoteItemInput {
  productId?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  lineDiscountPercent?: number;
  isManual?: boolean;
  description?: string;
}

interface PricedLine {
  unitPrice: number;
  quantity: number;
  lineDiscountPercent: number;
}

function computeVersionTotal(items: PricedLine[], discountPercent: number): number {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity * (1 - i.lineDiscountPercent / 100), 0);
  return Math.round(subtotal * (1 - discountPercent / 100));
}

export async function getQuoteForLead(leadId: string, actor: LeadActor): Promise<QuoteWithVersions | null> {
  const lead = await getLeadById(leadId, actor);
  if (!lead) return null;
  return prisma.quote.findUnique({ where: { leadId }, include: QUOTE_INCLUDE });
}

export interface CreateQuoteVersionInput {
  items: QuoteItemInput[];
  discountPercent?: number;
  discountReason?: string;
  validUntil?: Date;
}

export async function createQuoteVersion(leadId: string, input: CreateQuoteVersionInput, actor: LeadActor) {
  await assertLeadVisible(leadId, actor);
  if (input.items.length === 0) throw new Error("Добавьте хотя бы одну позицию");
  const discountPercent = input.discountPercent ?? 0;
  validateDiscount(discountPercent);
  const approvalRequired = await resolveApprovalRequired(discountPercent, actor.role);

  return prisma.$transaction(async (tx) => {
    let quote = await tx.quote.findUnique({ where: { leadId } });
    if (!quote) {
      quote = await tx.quote.create({ data: { leadId, createdById: actor.id } });
    }

    const lastVersion = await tx.quoteVersion.findFirst({ where: { quoteId: quote.id }, orderBy: { versionNumber: "desc" } });
    if (lastVersion && (lastVersion.status === "SENT" || lastVersion.status === "VIEWED")) {
      await tx.quoteVersion.update({ where: { id: lastVersion.id }, data: { status: "SUPERSEDED" } });
    }

    return tx.quoteVersion.create({
      data: {
        quoteId: quote.id,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        publicToken: generatePublicToken(),
        discountPercent,
        discountReason: input.discountReason,
        approvalRequired,
        validUntil: input.validUntil,
        createdById: actor.id,
        items: {
          create: input.items.map((i, idx) => ({
            productId: i.productId,
            productName: i.productName,
            productImage: i.productImage,
            quantity: i.quantity,
            unitPrice: Math.round(i.unitPrice),
            lineDiscountPercent: i.lineDiscountPercent ?? 0,
            isManual: i.isManual ?? false,
            description: i.description,
            sortOrder: idx,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  });
}

async function getVersionOwningLead(versionId: string) {
  return prisma.quoteVersion.findUniqueOrThrow({ where: { id: versionId }, include: { quote: true } });
}

export async function updateQuoteVersionItems(versionId: string, items: QuoteItemInput[], actor: LeadActor) {
  const version = await getVersionOwningLead(versionId);
  await assertLeadVisible(version.quote.leadId, actor);
  if (version.status !== "DRAFT") throw new Error("Отправленную версию нельзя изменить — создайте новую версию");
  if (items.length === 0) throw new Error("Добавьте хотя бы одну позицию");

  return prisma.$transaction(async (tx) => {
    await tx.quoteVersionItem.deleteMany({ where: { quoteVersionId: versionId } });
    await tx.quoteVersionItem.createMany({
      data: items.map((i, idx) => ({
        quoteVersionId: versionId,
        productId: i.productId,
        productName: i.productName,
        productImage: i.productImage,
        quantity: i.quantity,
        unitPrice: Math.round(i.unitPrice),
        lineDiscountPercent: i.lineDiscountPercent ?? 0,
        isManual: i.isManual ?? false,
        description: i.description,
        sortOrder: idx,
      })),
    });
    return tx.quoteVersion.findUniqueOrThrow({ where: { id: versionId }, include: { items: { orderBy: { sortOrder: "asc" } } } });
  });
}

export async function updateQuoteVersionDiscount(
  versionId: string,
  input: { discountPercent: number; discountReason?: string | null },
  actor: LeadActor
) {
  const version = await getVersionOwningLead(versionId);
  await assertLeadVisible(version.quote.leadId, actor);
  if (version.status !== "DRAFT") throw new Error("Отправленную версию нельзя изменить — создайте новую версию");
  validateDiscount(input.discountPercent);
  const approvalRequired = await resolveApprovalRequired(input.discountPercent, actor.role);

  return prisma.quoteVersion.update({
    where: { id: versionId },
    data: {
      discountPercent: input.discountPercent,
      discountReason: input.discountReason,
      approvalRequired,
      approvedById: null,
      approvedAt: null,
    },
  });
}

export async function approveQuoteDiscount(versionId: string, actor: LeadActor) {
  if (actor.role !== "ADMIN") throw new Error("Только администратор может согласовать скидку");
  const version = await getVersionOwningLead(versionId);
  await assertLeadVisible(version.quote.leadId, actor);
  return prisma.quoteVersion.update({ where: { id: versionId }, data: { approvedById: actor.id, approvedAt: new Date() } });
}

export async function markSent(versionId: string, actor: LeadActor) {
  const version = await getVersionOwningLead(versionId);
  await assertLeadVisible(version.quote.leadId, actor);
  if (version.status !== "DRAFT") throw new Error("Версия уже отправлена");
  return prisma.quoteVersion.update({ where: { id: versionId }, data: { status: "SENT", sentAt: new Date() } });
}

function isExpired(version: { validUntil: Date | null }): boolean {
  return !!version.validUntil && version.validUntil.getTime() < Date.now();
}

export async function getVersionByPublicToken(token: string): Promise<PublicQuoteVersion | null> {
  const version = await prisma.quoteVersion.findUnique({ where: { publicToken: token }, include: PUBLIC_VERSION_INCLUDE });
  return version;
}

export async function recordPublicView(token: string): Promise<void> {
  const version = await prisma.quoteVersion.findUnique({ where: { publicToken: token } });
  if (!version || version.status !== "SENT") return;
  await prisma.quoteVersion.update({ where: { id: version.id }, data: { status: "VIEWED", viewedAt: new Date() } });
}

export async function acceptPublicly(token: string): Promise<void> {
  const version = await prisma.quoteVersion.findUnique({ where: { publicToken: token } });
  if (!version) throw new Error("Предложение не найдено");
  if (isExpired(version)) throw new Error("Предложение больше не действительно");
  if (version.status !== "SENT" && version.status !== "VIEWED") throw new Error("Это предложение больше нельзя принять");
  await prisma.quoteVersion.update({ where: { id: version.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
}

export function computeQuoteVersionTotal(version: { discountPercent: number; items: { unitPrice: number; quantity: number; lineDiscountPercent: number }[] }): number {
  return computeVersionTotal(version.items, version.discountPercent);
}

export { isExpired as isQuoteVersionExpired };
