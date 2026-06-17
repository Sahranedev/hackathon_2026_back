/*
  Warnings:

  - The values [ROAD,TRAIL] on the enum `TerrainType` will be removed. If these variants are still used in the database, this will fail.
  - The `terrainTypes` column on the `tire_data` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TerrainType_new" AS ENUM ('ASPHALT', 'HARD_PACKED', 'MIXED', 'GRAVEL', 'ROCKY', 'MUD', 'SOFT', 'SAND', 'WET', 'UNKNOWN');

CREATE OR REPLACE FUNCTION map_terrain_type_text_to_new(old_val text)
RETURNS "TerrainType_new" AS $$
  SELECT CASE old_val
    WHEN 'ROAD' THEN 'ASPHALT'::"TerrainType_new"
    WHEN 'TRAIL' THEN 'MIXED'::"TerrainType_new"
    ELSE old_val::"TerrainType_new"
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION map_terrain_types_text_to_new(old_vals text[])
RETURNS "TerrainType_new"[] AS $$
  SELECT CASE
    WHEN old_vals IS NULL THEN NULL::"TerrainType_new"[]
    ELSE COALESCE(
      (
        SELECT array_agg(map_terrain_type_text_to_new(elem))
        FROM unnest(old_vals) AS elem
      ),
      ARRAY[]::"TerrainType_new"[]
    )
  END;
$$ LANGUAGE sql IMMUTABLE;

ALTER TABLE "public"."Activities" ALTER COLUMN "terrain_type" DROP DEFAULT;
ALTER TABLE "Activities" ALTER COLUMN "terrain_type" TYPE "TerrainType_new" USING (
  CASE "terrain_type"::text
    WHEN 'ROAD' THEN 'ASPHALT'::"TerrainType_new"
    WHEN 'TRAIL' THEN 'MIXED'::"TerrainType_new"
    ELSE ("terrain_type"::text)::"TerrainType_new"
  END
);
ALTER TABLE "tire_data" ALTER COLUMN "terrainTypes" TYPE "TerrainType_new"[] USING (map_terrain_types_text_to_new("terrainTypes"));
ALTER TYPE "TerrainType" RENAME TO "TerrainType_old";
ALTER TYPE "TerrainType_new" RENAME TO "TerrainType";
DROP FUNCTION map_terrain_types_text_to_new(text[]);
DROP FUNCTION map_terrain_type_text_to_new(text);
DROP TYPE "public"."TerrainType_old";
ALTER TABLE "Activities" ALTER COLUMN "terrain_type" SET DEFAULT 'UNKNOWN';
COMMIT;
