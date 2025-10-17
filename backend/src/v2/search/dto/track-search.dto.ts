import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class TrackSearchDto {
  @ApiProperty({ description: 'Consulta digitada', maxLength: 256 })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  q!: string;

  @ApiPropertyOptional({ description: 'Tempo de busca (ms)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  tookMs?: number;

  @ApiPropertyOptional({ description: 'Quantidade de resultados' })
  @IsOptional()
  @IsInt()
  results?: number;

  @ApiPropertyOptional({ type: 'object', description: 'Filtros aplicados' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}