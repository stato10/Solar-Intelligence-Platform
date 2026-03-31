import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/solar_intelligence?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  console.log("Starting DB seed...");

  // Clean DB (if needed)
  // await prisma.site.deleteMany();
  // await prisma.user.deleteMany();

  // Create Seed User
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@solarplatform.com" },
    update: {},
    create: {
      email: "demo@solarplatform.com",
      fullName: "Demo Owner",
      passwordHash: "mocked_hash_for_dev", // In a real app we'd bcrypt this
      role: "owner"
    }
  });

  // Create Seed Site
  const demoSite = await prisma.site.create({
    data: {
      userId: demoUser.id,
      siteName: "Demo Primary Residence",
      address: "123 Solar Way, Sunnyville",
      latitude: 31.0461,
      longitude: 34.8516,
      timezone: "Asia/Jerusalem",
      solarSystems: {
        create: [
          {
            systemSizeKw: 10.5,
            tilt: 30,
            azimuth: 180,
            panelWattage: 400,
            panelEfficiency: 0.2,
            lastCleaningDate: new Date("2024-01-01T00:00:00Z"),
            isActive: true
          }
        ]
      },
      deviceProfile: {
        create: {
          hasBoiler: true,
          hasEv: false,
          hasBattery: false,
          homeOccupancyProfile: "mostly_evening",
          openToUpgrades: true
        }
      },
      tariffs: {
        create: [
          {
            selfConsumptionRate: 0.6,
            exportRate: 0.16,
            currency: "ILS",
            effectiveFrom: new Date("2024-01-01T00:00:00Z"),
            isActive: true
          }
        ]
      }
    }
  });

  console.log(`Seed completed. Database populated with test user ${demoUser.email} and site ${demoSite.siteName}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
