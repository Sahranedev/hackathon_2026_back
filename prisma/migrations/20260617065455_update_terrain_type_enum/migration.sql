/*
  Warnings:

  - The values [ROAD,TRAIL] on the enum `TerrainType` will be removed. If these variants are still used in the database, this will fail.
  - The `terrainTypes` column on the `tire_data` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TerrainType_new" AS ENUM ('ASPHALT', 'HARD_PACKED', 'MIXED', 'GRAVEL', 'ROCKY', 'MUD', 'SOFT', 'SAND', 'WET', 'UNKNOWN');
ALTER TABLE "public"."Activities" ALTER COLUMN "terrain_type" DROP DEFAULT;
ALTER TABLE "Activities" ALTER COLUMN "terrain_type" TYPE "TerrainType_new" USING ("terrain_type"::text::"TerrainType_new");
ALTER TABLE "tire_data" ALTER COLUMN "terrainTypes" TYPE "TerrainType_new"[] USING ("terrainTypes"::text::"TerrainType_new"[]);
ALTER TYPE "TerrainType" RENAME TO "TerrainType_old";
ALTER TYPE "TerrainType_new" RENAME TO "TerrainType";
DROP TYPE "public"."TerrainType_old";
ALTER TABLE "Activities" ALTER COLUMN "terrain_type" SET DEFAULT 'UNKNOWN';
COMMIT;

-- AlterTable
ALTER TABLE "tire_data" DROP COLUMN "terrainTypes",
ADD COLUMN     "terrainTypes" "TerrainType"[];
