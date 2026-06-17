-- CreateTable
CREATE TABLE "tire_sensor_readings" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "user_tire_id" INTEGER NOT NULL,
    "pressure_bar" DOUBLE PRECISION NOT NULL,
    "temperature_c" DOUBLE PRECISION NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tire_sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tire_sensor_readings_device_id_measured_at_idx" ON "tire_sensor_readings"("device_id", "measured_at");

-- CreateIndex
CREATE INDEX "tire_sensor_readings_user_tire_id_idx" ON "tire_sensor_readings"("user_tire_id");

-- AddForeignKey
ALTER TABLE "tire_sensor_readings" ADD CONSTRAINT "tire_sensor_readings_user_tire_id_fkey" FOREIGN KEY ("user_tire_id") REFERENCES "users_tire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
