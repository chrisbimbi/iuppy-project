import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePerformanceCycleDto {
    @IsNotEmpty()
    @IsString()
    companyId: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    participantsFilter?: any;

    @IsOptional()
    @IsString()
    templateId?: string;

    @IsOptional()
    @IsBoolean()
    includeCalibration?: boolean;
}
