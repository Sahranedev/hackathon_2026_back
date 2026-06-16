/*
  Warnings:

  - Made the column `maxPressure` on table `tire_data` required. This step will fail if there are existing NULL values in that column.
  - Made the column `minPressure` on table `tire_data` required. This step will fail if there are existing NULL values in that column.
  - Made the column `model` on table `tire_data` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxKilometers` on table `tire_data` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tire_data" ALTER COLUMN "maxPressure" SET NOT NULL,
ALTER COLUMN "minPressure" SET NOT NULL,
ALTER COLUMN "model" SET NOT NULL,
ALTER COLUMN "maxKilometers" SET NOT NULL;
