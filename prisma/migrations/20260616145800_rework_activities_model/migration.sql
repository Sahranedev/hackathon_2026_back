/*
  Warnings:

  - A unique constraint covering the columns `[strava_activity_id]` on the table `Activities` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Activities" ADD COLUMN     "source" TEXT,
ADD COLUMN     "strava_activity_id" BIGINT,
ADD COLUMN     "user_id" INTEGER,
ALTER COLUMN "kilometers" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Activities_strava_activity_id_key" ON "Activities"("strava_activity_id");

-- CreateIndex
CREATE INDEX "Activities_user_id_idx" ON "Activities"("user_id");

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
