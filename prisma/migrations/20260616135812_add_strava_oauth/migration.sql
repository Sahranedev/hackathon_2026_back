/*
  Warnings:

  - You are about to drop the column `strava_id` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "strava_id";

-- CreateTable
CREATE TABLE "StravaAccount" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "username" TEXT,
    "firstname" TEXT,
    "lastname" TEXT,
    "profile" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StravaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthState" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StravaAccount_userId_key" ON "StravaAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StravaAccount_athleteId_key" ON "StravaAccount"("athleteId");

-- AddForeignKey
ALTER TABLE "StravaAccount" ADD CONSTRAINT "StravaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthState" ADD CONSTRAINT "OAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
