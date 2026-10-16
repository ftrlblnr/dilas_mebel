require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const STAGES = [
  { order: 0, key: "NEW", name: "Новый", color: "#2F6FD0", type: "WORK" },
  { order: 1, key: "IN_PROGRESS", name: "В работе", color: "#0E8A8A", type: "WORK" },
  { order: 2, key: "SELECTION_QUOTE", name: "Подбор и КП", color: "#6B4FC8", type: "WORK" },
  { order: 3, key: "AGREEMENT", name: "Согласование", color: "#C9721F", type: "WORK" },
  { order: 4, key: "AWAITING_PAYMENT", name: "Ожидает оплату", color: "#B08A2E", type: "WORK" },
  { order: 5, key: "DONE", name: "Выполнен", color: "#2E8B57", type: "WIN" },
  { order: 6, key: "CANCELED", name: "Отменён", color: "#A3271B", type: "LOSE" },
];

// Old LeadStatus -> new Stage.key. FURNITURE_SELECTION and QUOTE_SENT intentionally
// collapse into one stage (SELECTION_QUOTE), matching crm-process.md's target process.
const STATUS_TO_STAGE_KEY = {
  NEW: "NEW",
  NEEDS_ASSESSMENT: "IN_PROGRESS",
  FURNITURE_SELECTION: "SELECTION_QUOTE",
  QUOTE_SENT: "SELECTION_QUOTE",
  NEGOTIATION: "AGREEMENT",
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  WON: "DONE",
  LOST: "CANCELED",
};

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  for (const s of STAGES) {
    await prisma.stage.upsert({
      where: { key: s.key },
      update: { name: s.name, color: s.color, order: s.order, type: s.type },
      create: s,
    });
  }
  console.log(`Seeded ${STAGES.length} stages.`);

  const stages = await prisma.stage.findMany();
  const stageIdByKey = Object.fromEntries(stages.map((s) => [s.key, s.id]));

  let total = 0;
  for (const [status, key] of Object.entries(STATUS_TO_STAGE_KEY)) {
    const stageId = stageIdByKey[key];
    const result = await prisma.lead.updateMany({
      where: { status, stageId: null },
      data: { stageId },
    });
    console.log(`${status} -> ${key}: ${result.count} leads`);
    total += result.count;
  }
  console.log(`Backfilled ${total} leads total.`);

  const remaining = await prisma.lead.count({ where: { stageId: null } });
  if (remaining > 0) {
    console.error(`WARNING: ${remaining} leads still have no stageId — investigate before proceeding.`);
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main();
