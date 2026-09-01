-- Phase 9: telemetry ingestion foundation.
-- Adds inverter connections (vendor credentials + sync state) and
-- interval production readings pulled from vendor monitoring APIs.

-- CreateEnum
CREATE TYPE "InverterVendor" AS ENUM ('solaredge', 'enphase', 'fronius', 'sma', 'mock');

-- CreateEnum
CREATE TYPE "InverterConnectionStatus" AS ENUM ('pending', 'active', 'error', 'disconnected');

-- CreateTable
CREATE TABLE "InverterConnection" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "vendor" "InverterVendor" NOT NULL,
    "externalSystemId" TEXT,
    "apiKeyEncrypted" TEXT NOT NULL,
    "status" "InverterConnectionStatus" NOT NULL DEFAULT 'pending',
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InverterConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryReading" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "productionWh" DOUBLE PRECISION NOT NULL,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "source" "InverterVendor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InverterConnection_siteId_key" ON "InverterConnection"("siteId");

-- CreateIndex
CREATE INDEX "InverterConnection_status_idx" ON "InverterConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TelemetryReading_siteId_timestamp_key" ON "TelemetryReading"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "TelemetryReading_siteId_timestamp_idx" ON "TelemetryReading"("siteId", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "InverterConnection" ADD CONSTRAINT "InverterConnection_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryReading" ADD CONSTRAINT "TelemetryReading_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
