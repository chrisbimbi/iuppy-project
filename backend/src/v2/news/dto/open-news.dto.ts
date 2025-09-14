import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class NewsOpenDto {
  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}