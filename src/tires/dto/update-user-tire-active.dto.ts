import { IsBoolean } from 'class-validator';

export class UpdateUserTireActiveDto {
  @IsBoolean()
  isActive: boolean;
}
