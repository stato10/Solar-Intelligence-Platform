import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './node_modules/.prisma/client/default.js';

async function test() {
  const pool = new Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/solar_intelligence?schema=public" });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({ include: { sites: true } });
    console.dir(users, { depth: null });
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
