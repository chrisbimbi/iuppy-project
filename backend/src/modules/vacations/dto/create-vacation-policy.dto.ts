import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVacationPolicyDto {
    @IsNotEmpty()
    @IsString()
    companyId: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNumber()
    minDaysAntecedence: number;

    @IsBoolean()
    allowFractioning: boolean;

    @IsOptional()
    @IsBoolean()
    allowCashAllowance?: boolean;

    @IsOptional()
    @IsNumber()
    sellingLimitDays?: number;

    @IsOptional()
    @IsString()
    sellingTiming?: string;

    @IsOptional()
    @IsBoolean()
    allow13thAdvance?: boolean;

    @IsOptional()
    @IsString()
    approvalFlow?: string;

    @IsOptional()
    @IsNumber()
    approvalSlaDays?: number;
}
