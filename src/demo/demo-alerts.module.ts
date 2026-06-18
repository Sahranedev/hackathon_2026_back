import { Module } from '@nestjs/common';
import { TireSensorModule } from 'src/tire-sensor/tire-sensor.module';
import { DemoAlertsController } from './demo-alerts.controller';
import { DemoAlertsService } from './demo-alerts.service';

@Module({
  imports: [TireSensorModule],
  controllers: [DemoAlertsController],
  providers: [DemoAlertsService],
})
export class DemoAlertsModule {}
