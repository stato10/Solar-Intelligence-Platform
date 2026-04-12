const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.leadIntent.create({
      data: {
        siteId: 'site-demo-001',
        userId: 'some-user-id',
        sourceType: 'cleaning_recommendation',
        title: 'Test Title',
        estimatedValue: 70.8,
        status: 'new_lead'
      }
    });
    console.log("SUCCESS:", res);
  } catch (err) {
    console.error("PRISMA ERROR:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
