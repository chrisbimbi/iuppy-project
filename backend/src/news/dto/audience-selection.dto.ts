// src/news/dto/audience-selection.dto.ts
import {
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';
import { AudienceMode } from '@shared/types/NewsSettings';

/**
 * DTO para aplicar/projetar uma seleção de audiência.
 * Usa o enum do shared (NÃO duplicamos o AudienceMode localmente).
 */
export class AudienceSelectionDto {
  @IsEnum(AudienceMode)
  mode!: AudienceMode;

  @ValidateIf((o) => o.mode === AudienceMode.SPACE)
  @IsOptional()
  @IsString()
  spaceId?: string;

  @ValidateIf((o) => o.mode === AudienceMode.CHANNEL)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channelIds?: string[];

  @ValidateIf((o) => o.mode === AudienceMode.GROUPS)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  groupIds?: string[];
}

// Exportamos o tipo do shared para manter importações existentes compatíveis.
export { AudienceMode };
