// backend/src/channels/dto/create-channel.dto.ts
import { ChannelType } from '@shared/types';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
  IsBoolean
} from 'class-validator';


export class UpdateChannelDto {

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(ChannelType)
  type: ChannelType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  spaceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  groupIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  contributorIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  adminIds?: string[];
}