-- AlterTable
ALTER TABLE "tire_data" ADD COLUMN     "maxPressure" DOUBLE PRECISION,
ADD COLUMN     "minPressure" DOUBLE PRECISION,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "terrainTypes" TEXT[];
