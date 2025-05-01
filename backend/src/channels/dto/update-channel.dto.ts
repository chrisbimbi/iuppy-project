import {
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
} from 'class-validator';

export class UpdateChannelDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsUUID()
  companyId?: string;

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