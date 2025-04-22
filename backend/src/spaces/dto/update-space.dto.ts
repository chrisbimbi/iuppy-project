import { 
  IsOptional, IsString, IsNumber, IsBoolean, IsUUID 
} from 'class-validator';

export class UpdateSpaceDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsNumber() priority?: number;
  @IsOptional() @IsBoolean() active?: boolean;

  @IsOptional() @IsUUID()
  companyId?: string;
}
