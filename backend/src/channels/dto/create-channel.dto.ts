import { IsNotEmpty, IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateChannelDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  companyId: string;

  // ---
  // Troca locationIds por spaceIds
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  spaceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  groupIds?: string[];

  @IsOptional()
  @IsArray() @IsUUID('4', { each: true })
  contributorIds?: string[];

  @IsOptional()
  @IsArray() @IsUUID('4', { each: true })
  adminIds?: string[];
  
}
