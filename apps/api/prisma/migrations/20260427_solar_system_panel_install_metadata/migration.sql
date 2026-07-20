-- Adds optional catalog metadata to SolarSystem so the Settings page can
-- persist panel count / type and the installation date alongside the
-- existing tilt / azimuth / wattage fields.
ALTER TABLE "SolarSystem"
  ADD COLUMN "panelCount"       INTEGER,
  ADD COLUMN "panelType"        TEXT,
  ADD COLUMN "installationDate" TIMESTAMP(3);
