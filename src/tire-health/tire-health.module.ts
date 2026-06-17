import { Module } from '@nestjs/common';
import { AlertsModule } from 'src/alerts/alerts.module';
import { TiresModule } from 'src/tires/tires.module';
import { TireHealthService } from './tire-health.service';

@Module({
  imports: [AlertsModule, TiresModule],
  providers: [TireHealthService],
  exports: [TireHealthService],
})
export class TireHealthModule {}
