-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "mail" TEXT NOT NULL,
    "password" TEXT,
    "strava_id" TEXT,
    "roles" "Roles"[] DEFAULT ARRAY['USER']::"Roles"[],

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_tire" (
    "id" SERIAL NOT NULL,
    "position" TEXT,
    "tire_id" INTEGER,
    "user_id" INTEGER,
    "kilometers" INTEGER,
    "smart_tire" BOOLEAN,
    "isActive" BOOLEAN,

    CONSTRAINT "users_tire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activities" (
    "id" SERIAL NOT NULL,
    "start_position" INTEGER,
    "kilometers" INTEGER,
    "date" DATE,
    "isStrava" BOOLEAN,

    CONSTRAINT "Activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerts" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retails" (
    "id" SERIAL NOT NULL,
    "address" TEXT,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "phone_number" TEXT,
    "website_url" TEXT,

    CONSTRAINT "Retails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tire_data" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "tire_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activites_has_tires" (
    "tire_id" INTEGER NOT NULL,
    "activities_id" INTEGER NOT NULL,

    CONSTRAINT "activites_has_tires_pkey" PRIMARY KEY ("tire_id","activities_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_mail_key" ON "Users"("mail");

-- AddForeignKey
ALTER TABLE "users_tire" ADD CONSTRAINT "users_tire_tire_id_fkey" FOREIGN KEY ("tire_id") REFERENCES "tire_data"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_tire" ADD CONSTRAINT "users_tire_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites_has_tires" ADD CONSTRAINT "activites_has_tires_tire_id_fkey" FOREIGN KEY ("tire_id") REFERENCES "tire_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites_has_tires" ADD CONSTRAINT "activites_has_tires_activities_id_fkey" FOREIGN KEY ("activities_id") REFERENCES "Activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
