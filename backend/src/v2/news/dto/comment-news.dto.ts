import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class NewsCommentCreateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  text!: string;
}
