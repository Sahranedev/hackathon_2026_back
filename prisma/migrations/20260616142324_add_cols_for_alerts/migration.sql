/*
  Warnings:

  - Added the required column `code` to the `Alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_tire_id` to the `Alerts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Alerts" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isChecked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "user_tire_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Alerts" ADD CONSTRAINT "Alerts_user_tire_id_fkey" FOREIGN KEY ("user_tire_id") REFERENCES "users_tire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
