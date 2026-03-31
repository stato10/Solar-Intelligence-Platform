-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'admin');

-- CreateEnum
CREATE TYPE "OccupancyProfile" AS ENUM ('mostly_day', 'mostly_evening', 'mixed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarSystem" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "systemSizeKw" DOUBLE PRECISION NOT NULL,
    "tilt" DOUBLE PRECISION NOT NULL,
    "azimuth" DOUBLE PRECISION NOT NULL,
    "panelWattage" DOUBLE PRECISION NOT NULL,
    "panelEfficiency" DOUBLE PRECISION NOT NULL,
    "inverterType" TEXT,
    "lastCleaningDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolarSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteDeviceProfile" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "hasBoiler" BOOLEAN NOT NULL DEFAULT false,
    "hasEv" BOOLEAN NOT NULL DEFAULT false,
    "hasBattery" BOOLEAN NOT NULL DEFAULT false,
    "hasDishwasher" BOOLEAN NOT NULL DEFAULT false,
    "hasWashingMachine" BOOLEAN NOT NULL DEFAULT false,
    "hasAc" BOOLEAN NOT NULL DEFAULT false,
    "flexibleLoadShiftingPossible" BOOLEAN NOT NULL DEFAULT false,
    "openToUpgrades" BOOLEAN NOT NULL DEFAULT true,
    "homeOccupancyProfile" "OccupancyProfile" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteDeviceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "selfConsumptionRate" DOUBLE PRECISION NOT NULL,
    "exportRate" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Site_userId_idx" ON "Site"("userId");

-- CreateIndex
CREATE INDEX "SolarSystem_siteId_idx" ON "SolarSystem"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteDeviceProfile_siteId_key" ON "SiteDeviceProfile"("siteId");

-- CreateIndex
CREATE INDEX "SiteDeviceProfile_siteId_idx" ON "SiteDeviceProfile"("siteId");

-- CreateIndex
CREATE INDEX "Tariff_siteId_idx" ON "Tariff"("siteId");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarSystem" ADD CONSTRAINT "SolarSystem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteDeviceProfile" ADD CONSTRAINT "SiteDeviceProfile_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

