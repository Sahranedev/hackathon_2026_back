import { Module } from '@nestjs/common';
import { TireHealthModule } from 'src/tire-health/tire-health.module';
import { TireSensorController } from './tire-sensor.controller';
import { TireSensorService } from './tire-sensor.service';

@Module({
  imports: [TireHealthModule],
  controllers: [TireSensorController],
  providers: [TireSensorService],
})
export class TireSensorModule {}
