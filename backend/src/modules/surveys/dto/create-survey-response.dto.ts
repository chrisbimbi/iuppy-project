// backend/src/modules/surveys/dto/create-survey-response.dto.ts
import { IsNotEmpty, IsUUID, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
    @IsNotEmpty() @IsUUID()
    questionId: string;

    @IsNotEmpty()
    answer: string | string[] | number;
}

export class CreateSurveyResponseDto {
    @IsNotEmpty() @IsUUID()
    surveyId: string;

    @IsOptional() @IsUUID()
    userId?: string;

    @IsArray() @ValidateNested({ each: true }) @Type(() => AnswerDto)
    answers: AnswerDto[];
}