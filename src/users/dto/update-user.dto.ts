import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Camille' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Martin' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'camille@example.com' })
  mail?: string;

  @ApiPropertyOptional({ example: 'new-secret123' })
  password?: string;

  @ApiPropertyOptional({ example: '12345678' })
  stravaId?: string;
}
