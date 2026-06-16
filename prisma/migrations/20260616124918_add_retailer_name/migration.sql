/*
  Warnings:

  - Added the required column `name` to the `Retails` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `Retails` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Retails" ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "address" SET NOT NULL;
