import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsIn,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateSpaceDto {
  @IsNotEmpty() @IsUUID()           companyId: string;
  @IsNotEmpty() @IsString()         name: string;
  @IsNotEmpty() @IsString()         slug: string;
  @IsOptional() @IsString()         description?: string;
  @IsOptional() @IsString()         imageUrl?: string;
  @IsOptional() @IsInt()            priority?: number;
  @IsOptional() @IsBoolean()        active?: boolean;

  @IsOptional() 
  @IsArray() 
  @IsIn(['app','email'], { each: true })
  distributionChannels?: ('app' | 'email')[];

  @IsOptional() 
  @IsArray() 
  @IsUUID('all', { each: true })
  targetGroupIds?: string[];

  @IsOptional() 
  @IsArray() 
  @IsUUID('all', { each: true })
  adminIds?: string[];
}