import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/security/decorators/public.decorator';
import { CreateTireSensorReadingDto } from './dto/create-tire-sensor-reading.dto';
import { TireSensorService } from './tire-sensor.service';
import { TireSensorAnalysisResponseDto } from '../docs/api-response.dto';
import {
  ApiResourceNotFound,
  ApiValidationError,
} from '../docs/swagger.decorators';

@Public()
@ApiTags('Tire Sensor')
@Controller('api/tire-sensor')
export class TireSensorController {
  constructor(private readonly tireSensorService: TireSensorService) {}

  @Post('readings')
  @ApiOperation({
    summary: 'Recevoir une mesure de pression/temperature depuis un capteur.',
  })
  @ApiCreatedResponse({ type: TireSensorAnalysisResponseDto })
  @ApiValidationError('Mesure capteur invalide.')
  @ApiResourceNotFound('Aucun pneu utilisateur associe au deviceId.')
  createReading(
    @Body() createTireSensorReadingDto: CreateTireSensorReadingDto,
  ) {
    return this.tireSensorService.handleReading(createTireSensorReadingDto);
  }
}
