import { IsOptional, IsEnum, IsString, Length, IsBoolean } from 'class-validator';

export class UpdateEsocialConfigDto {
    @IsOptional()
    @IsEnum(['homologacao', 'producao'])
    environment?: 'homologacao' | 'producao';

    @IsOptional()
    @IsString()
    medicoNome?: string;

    @IsOptional()
    @IsString()
    medicoCpf?: string;

    @IsOptional()
    @IsString()
    medicoCrm?: string;

    @IsOptional()
    @Length(2, 2)
    medicoUf?: string;

    @IsOptional()
    @IsString()
    engenheiroNome?: string;

    @IsOptional()
    @IsString()
    engenheiroCpf?: string;

    @IsOptional()
    @IsString()
    engenheiroCrea?: string;

    @IsOptional()
    @Length(2, 2)
    engenheiroUf?: string;
}

export class ToggleEsocialDto {
    @IsBoolean()
    enabled: boolean;
}

export class UploadCertificateDto {
    @IsString()
    password: string;
}
