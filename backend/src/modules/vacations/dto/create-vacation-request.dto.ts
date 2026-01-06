import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { VacationType } from '@shared/types';

export class CreateVacationRequestDto {
    @IsString()
    userId!: string; // Usually injected via JWT, but for admin actions we might need this. Or for now trust request body in MVP.

    @IsDateString()
    startDate!: string;

    @IsDateString()
    endDate!: string;

    @IsNumber()
    @IsOptional()
    soldDays?: number;

    @IsBoolean()
    @IsOptional()
    request13th?: boolean;

    @IsEnum(VacationType)
    @IsOptional()
    type?: VacationType;
}
