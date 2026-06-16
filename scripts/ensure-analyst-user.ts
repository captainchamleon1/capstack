/**
 * Idempotent upsert of the demo analyst account. Safe to run on production.
 * Usage: npx tsx scripts/ensure-analyst-user.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../src/lib/create-prisma-client";

const EMAIL = process.env.ANALYST_SEED_EMAIL ?? "analyst@equitr.com";
const PASSWORD = process.env.ANALYST_SEED_PASSWORD ?? "analyst12345";
const NAME = process.env.ANALYST_SEED_NAME ?? "Equitr Analyst";

async function main() {
  const prisma = createPrismaClient();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: EMAIL.toLowerCase() },
    create: { email: EMAIL.toLowerCase(), name: NAME, passwordHash, isAnalyst: true },
    update: { isAnalyst: true, name: NAME },
  });
  console.log(`Analyst user ready: ${user.email} (isAnalyst=${user.isAnalyst})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
