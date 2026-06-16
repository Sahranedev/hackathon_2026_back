-- DropForeignKey
ALTER TABLE "activites_has_tires" DROP CONSTRAINT "activites_has_tires_tire_id_fkey";

-- AddForeignKey
ALTER TABLE "activites_has_tires" ADD CONSTRAINT "activites_has_tires_tire_id_fkey" FOREIGN KEY ("tire_id") REFERENCES "users_tire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
