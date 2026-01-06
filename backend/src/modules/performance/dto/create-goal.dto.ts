import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { GoalType } from '@shared/types';

export class CreateGoalDto {
    @IsString()
    userId!: string;

    @IsString()
    title!: string;

    @IsUUID()
    @IsOptional()
    parentGoalId?: string;

    @IsNumber()
    @IsOptional()
    weight?: number;

    @IsEnum(GoalType)
    @IsOptional()
    type?: GoalType;
}
