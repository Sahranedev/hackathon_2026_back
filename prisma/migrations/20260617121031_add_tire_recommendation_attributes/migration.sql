-- CreateEnum
CREATE TYPE "TireUsageType" AS ENUM ('ROAD', 'GRAVEL', 'MTB', 'CITY', 'TOURING', 'COMMUTING', 'E_BIKE');

-- CreateEnum
CREATE TYPE "RimType" AS ENUM ('CLINCHER', 'TUBELESS', 'TUBULAR');

-- CreateEnum
CREATE TYPE "SealingType" AS ENUM ('TUBE', 'TUBELESS_READY', 'TUBELESS');

-- CreateEnum
CREATE TYPE "TireFitting" AS ENUM ('FRONT', 'REAR', 'FRONT_REAR');

-- CreateEnum
CREATE TYPE "TirePerformanceProfile" AS ENUM ('COMFORT', 'SPEED', 'GRIP', 'DURABILITY', 'PUNCTURE_PROTECTION');

-- AlterTable
ALTER TABLE "tire_data" ADD COLUMN     "e_bike_compatible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "etrto_diameter" INTEGER,
ADD COLUMN     "etrto_width" INTEGER,
ADD COLUMN     "family_name" TEXT,
ADD COLUMN     "fitting" "TireFitting",
ADD COLUMN     "performance_profiles" "TirePerformanceProfile"[],
ADD COLUMN     "product_range" TEXT,
ADD COLUMN     "recommendation_weight" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rim_type" "RimType",
ADD COLUMN     "sealing_type" "SealingType",
ADD COLUMN     "usageType" "TireUsageType",
ADD COLUMN     "wheel_diameter" TEXT;
