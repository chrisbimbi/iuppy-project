import { IsEnum, IsArray, IsOptional, IsString } from 'class-validator';
import { AudienceMode } from '@shared/types/NewsSettings';

export class AudienceProbeDto {
  @IsEnum(AudienceMode)
  mode!: AudienceMode;

  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channelIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}
