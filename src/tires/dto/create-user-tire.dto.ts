import { IsInt, Min } from 'class-validator';

export class CreateUserTireDto {
  @IsInt()
  @Min(1)
  tireId: number;
}
