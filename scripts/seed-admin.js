require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");

async function main() {
  const [, , email, password, name] = process.argv;
  if (!email || !password) {
    console.error("Usage: node scripts/seed-admin.js <email> <password> [name]");
    process.exit(1);
  }
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.trim().toLowerCase() },
    update: { passwordHash, role: "ADMIN", active: true },
    create: { email: email.trim().toLowerCase(), passwordHash, name: name ?? "Admin", role: "ADMIN" },
  });
  console.log("Seeded admin:", user.email);
  await prisma.$disconnect();
}

main();
