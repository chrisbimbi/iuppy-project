import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class RemindDto {
  @ApiPropertyOptional({ description: 'Reenviar apenas para quem NÃO abriu', default: true })
  @IsOptional()
  @IsBoolean()
  onlyNotOpened?: boolean;
}