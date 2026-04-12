-- CreateEnum
CREATE TYPE "ProviderCategory" AS ENUM ('cleaning', 'maintenance', 'installation', 'battery', 'ev_charging', 'automation');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('battery', 'ev_charger', 'switcher', 'cooling', 'automatic_cleaning');

-- CreateEnum
CREATE TYPE "LeadSourceType" AS ENUM ('cleaning_recommendation', 'battery_recommendation', 'ev_recommendation', 'automation_recommendation');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new_lead', 'submitted', 'contacted', 'closed', 'cancelled');

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ProviderCategory" NOT NULL,
    "description" TEXT,
    "serviceAreas" TEXT[],
    "phone" TEXT,
    "whatsappUrl" TEXT,
    "websiteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "estimatedPriceMin" DOUBLE PRECISION,
    "estimatedPriceMax" DOUBLE PRECISION,
    "affiliateUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadIntent" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "LeadSourceType" NOT NULL,
    "sourceReference" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new_lead',
    "estimatedValue" DOUBLE PRECISION,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationLink" (
    "id" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "providerId" TEXT,
    "productId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "countryCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecommendationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "LeadIntent_siteId_idx" ON "LeadIntent"("siteId");

-- CreateIndex
CREATE INDEX "LeadIntent_userId_idx" ON "LeadIntent"("userId");

-- CreateIndex
CREATE INDEX "LeadIntent_status_idx" ON "LeadIntent"("status");

-- CreateIndex
CREATE INDEX "RecommendationLink_triggerType_idx" ON "RecommendationLink"("triggerType");

-- AddForeignKey
ALTER TABLE "RecommendationLink" ADD CONSTRAINT "RecommendationLink_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationLink" ADD CONSTRAINT "RecommendationLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
