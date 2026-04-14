import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./node_modules/.prisma/client/default.js";
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/solar_intelligence?schema=public" });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const site = await prisma.site.findFirst();
    if (!site) {
      console.log("No site available to test.");
      return;
    }
    
    await (prisma as any).leadIntent.create({
        data: {
          siteId: site.id,
          userId: site.userId,
          sourceType: "automation_recommendation",
          title: "Test lead",
          status: 'new_lead',
        },
    });
    console.log("Successfully created intent!");
  } catch(e) {
    console.error("FATAL ERROR IN CREATE:", e);
  } finally {
    await pool.end();
  }
}
main().catch(console.error);
