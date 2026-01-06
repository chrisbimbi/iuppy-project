import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class NewsCommentModerateDto {
  @ApiProperty()
  @IsBoolean()
  approve!: boolean;
}
