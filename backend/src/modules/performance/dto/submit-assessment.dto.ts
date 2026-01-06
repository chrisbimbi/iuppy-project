import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
    @IsString()
    questionId!: string;

    @IsNumber()
    @IsOptional()
    score?: number;

    @IsString()
    @IsOptional()
    textAnswer?: string;
}

export class SubmitAssessmentDto {
    @IsUUID()
    formId!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnswerDto)
    answers!: AnswerDto[];
}
