import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
} from 'class-validator';

export class CreateChannelDto {
  @IsNotEmpty() @IsString()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsNotEmpty() @IsUUID()
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