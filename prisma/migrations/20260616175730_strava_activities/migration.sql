/*
  Warnings:

  - You are about to drop the column `isStrava` on the `Activities` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,strava_activity_id]` on the table `Activities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Activities` table without a default value. This is not possible if the table is not empty.
  - Made the column `user_id` on table `Activities` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('STRAVA', 'APP_TRACKED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TerrainType" AS ENUM ('ROAD', 'TRAIL', 'GRAVEL', 'MIXED', 'UNKNOWN');

-- DropForeignKey
ALTER TABLE "Activities" DROP CONSTRAINT "Activities_user_id_fkey";

-- DropIndex
DROP INDEX "Activities_strava_activity_id_key";

-- AlterTable
ALTER TABLE "Activities" DROP COLUMN "isStrava",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "duration_seconds" INTEGER,
ADD COLUMN     "ended_at" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "status" "ActivityStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "terrain_type" "TerrainType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "ActivitySource" NOT NULL,
ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "StravaAccount" ADD COLUMN     "last_sync_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ActivityGpsPoints" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityGpsPoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityGpsPoints_activity_id_idx" ON "ActivityGpsPoints"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "Activities_user_id_strava_activity_id_key" ON "Activities"("user_id", "strava_activity_id");

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityGpsPoints" ADD CONSTRAINT "ActivityGpsPoints_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "Activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
