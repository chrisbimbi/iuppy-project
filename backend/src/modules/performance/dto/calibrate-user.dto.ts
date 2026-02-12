import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CalibrateUserDto {
    @IsString()
    userId!: string;

    @IsString()
    cycleId!: string;

    @IsString()
    quadrant!: string;

    @IsNumber()
    scoreX!: number;

    @IsNumber()
    scoreY!: number;

    @IsString()
    justification!: string;

    @IsString()
    @IsOptional()
    calibratorId?: string;
}
