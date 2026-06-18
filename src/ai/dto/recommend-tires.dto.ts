import { ApiProperty } from '@nestjs/swagger';

export class RecommendTiresDto {
  @ApiProperty({
    example:
      'Je roule surtout en gravel humide, environ 50 km par semaine, et je veux un pneu resistant aux crevaisons.',
  })
  prompt: string;
}
