import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'camille@example.com' })
  mail: string;

  @ApiProperty({ example: 'secret123' })
  password: string;
}
