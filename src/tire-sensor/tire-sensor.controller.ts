import { Body, Controller, Post } from '@nestjs/common';
import { Public } from 'src/security/decorators/public.decorator';
import { CreateTireSensorReadingDto } from './dto/create-tire-sensor-reading.dto';
import { TireSensorService } from './tire-sensor.service';

@Public()
@Controller('api/tire-sensor')
export class TireSensorController {
  constructor(private readonly tireSensorService: TireSensorService) {}

  @Post('readings')
  createReading(
    @Body() createTireSensorReadingDto: CreateTireSensorReadingDto,
  ) {
    return this.tireSensorService.handleReading(createTireSensorReadingDto);
  }
}
