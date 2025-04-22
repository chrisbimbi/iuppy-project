import { 
  IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsUUID 
} from 'class-validator';

export class CreateSpaceDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsNumber() priority?: number;
  @IsOptional() @IsBoolean() active?: boolean;

  @IsNotEmpty() @IsUUID()
  companyId: string;
}
