import { BadRequestException, Injectable } from '@nestjs/common';
import { TireHealthService } from 'src/tire-health/tire-health.service';
import { CreateTireSensorReadingDto } from './dto/create-tire-sensor-reading.dto';

@Injectable()
export class TireSensorService {
  constructor(private readonly tireHealthService: TireHealthService) {}

  handleReading(createTireSensorReadingDto: CreateTireSensorReadingDto) {
    this.validateReading(createTireSensorReadingDto);

    return this.tireHealthService.analyzeSensorReading(
      createTireSensorReadingDto,
    );
  }

  private validateReading(reading: CreateTireSensorReadingDto) {
    if (!reading.deviceId || typeof reading.deviceId !== 'string') {
      throw new BadRequestException('deviceId must be a string');
    }

    if (
      typeof reading.pressureBar !== 'number' ||
      Number.isNaN(reading.pressureBar) ||
      reading.pressureBar < 0
    ) {
      throw new BadRequestException('pressureBar must be a positive number');
    }

    if (
      typeof reading.temperatureC !== 'number' ||
      Number.isNaN(reading.temperatureC)
    ) {
      throw new BadRequestException('temperatureC must be a number');
    }

    if (reading.measuredAt && Number.isNaN(Date.parse(reading.measuredAt))) {
      throw new BadRequestException('measuredAt must be a valid date string');
    }
  }
}
