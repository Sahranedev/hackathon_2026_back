-- AlterTable
ALTER TABLE "users_tire" ADD COLUMN "device_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_tire_device_id_key" ON "users_tire"("device_id");
