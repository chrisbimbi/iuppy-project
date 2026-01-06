import { IsString } from 'class-validator';

export class CalibrateUserDto {
    @IsString()
    userId!: string;

    @IsString()
    cycleId!: string;

    @IsString()
    newQuadrant!: string;

    @IsString()
    justification!: string;
}
