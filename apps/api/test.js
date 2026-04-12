const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const res = await prisma.leadIntent.create({
      data: {
        siteId: 'site-demo-001',
        userId: 'some-user-id',
        sourceType: 'cleaning_recommendation',
        title: 'Test',
        status: 'new_lead'
      }
    });
    console.log("Success:", res);
  } catch (e) {
    console.error("Error creating LeadIntent:", e);
  }
}
test();
