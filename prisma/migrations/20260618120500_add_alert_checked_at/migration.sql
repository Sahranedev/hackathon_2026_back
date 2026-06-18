ALTER TABLE "Alerts" ADD COLUMN "checked_at" TIMESTAMP(3);

CREATE INDEX "Alerts_user_tire_id_code_isChecked_idx" ON "Alerts"("user_tire_id", "code", "isChecked");
