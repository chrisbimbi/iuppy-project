import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional } from 'class-validator';

export type V2ShareChannel = 'app' | 'email' | 'whatsapp' | 'telegram';

export class NewsShareDto {
  @ApiPropertyOptional({ enum: ['app', 'email', 'whatsapp', 'telegram'] })
  @IsOptional()
  @IsIn(['app', 'email', 'whatsapp', 'telegram'])
  channel?: V2ShareChannel;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}