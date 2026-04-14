import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./node_modules/.prisma/client/default.js";
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/solar_intelligence?schema=public" });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  console.log("has leadIntent:", typeof (prisma as any).leadIntent);
  await pool.end();
}
main().catch(console.error);
