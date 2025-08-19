// backend/src/modules/surveys/surveys.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    ParseBoolPipe,
    DefaultValuePipe,
} from '@nestjs/common'
import { SurveysService } from './surveys.service'

import { CreateSurveyDto } from './dto/create-survey.dto'
import { UpdateSurveyDto } from './dto/update-survey.dto'
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto'
import { UpdateSurveyQuestionDto } from './dto/update-survey-question.dto'
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto'

@Controller('modules/:companyId/surveys')
export class SurveysController {
    constructor(private readonly surveysService: SurveysService) { }

    @Post()
    create(
        @Param('companyId') companyId: string,
        @Body() dto: CreateSurveyDto,
    ) {
        return this.surveysService.create(companyId, dto)
    }

    /**
     * Query params:
     * - spaceId=abc
     * - spaceIds=id1,id2,id3
     * - includeGlobal=true | false
     */
    @Get()
    findAll(
        @Param('companyId') companyId: string,
        @Query('spaceId') spaceId?: string,
        @Query('spaceIds') spaceIdsStr?: string,
        @Query('includeGlobal', new DefaultValuePipe(false), ParseBoolPipe)
        includeGlobal?: boolean,
    ) {
        const spaceIds = spaceIdsStr
            ? spaceIdsStr.split(',').map((s) => s.trim()).filter(Boolean)
            : undefined

        return this.surveysService.findAll(companyId, {
            spaceId,
            spaceIds,
            includeGlobal,
        })
    }

    @Get(':id')
    findOne(
        @Param('companyId') companyId: string,
        @Param('id') id: string,
    ) {
        return this.surveysService.findOne(companyId, id)
    }

    @Patch(':id')
    update(
        @Param('companyId') companyId: string,
        @Param('id') id: string,
        @Body() dto: UpdateSurveyDto,
    ) {
        return this.surveysService.update(companyId, id, dto)
    }

    @Delete(':id')
    remove(
        @Param('companyId') companyId: string,
        @Param('id') id: string,
    ) {
        return this.surveysService.remove(companyId, id)
    }

    // --- Questions ---
    @Post(':surveyId/questions')
    addQuestion(
        @Param('companyId') companyId: string,
        @Param('surveyId') surveyId: string,
        @Body() dto: CreateSurveyQuestionDto,
    ) {
        return this.surveysService.addQuestion(companyId, surveyId, dto)
    }

    @Patch('questions/:id')
    updateQuestion(
        @Param('companyId') companyId: string,
        @Param('id') id: string,
        @Body() dto: UpdateSurveyQuestionDto,
    ) {
        return this.surveysService.updateQuestion(companyId, id, dto)
    }

    @Delete('questions/:id')
    removeQuestion(
        @Param('companyId') companyId: string,
        @Param('id') id: string,
    ) {
        return this.surveysService.removeQuestion(companyId, id)
    }

    // --- Responses ---
    // Mantém compatível com DTO que carrega o surveyId no body
    @Post('responses')
    addResponse(
        @Param('companyId') companyId: string,
        @Body() dto: CreateSurveyResponseDto,
    ) {
        return this.surveysService.addResponse(companyId, dto)
    }

    // Listar respostas de uma survey específica
    @Get(':surveyId/responses')
    findResponses(
        @Param('companyId') companyId: string,
        @Param('surveyId') surveyId: string,
    ) {
        return this.surveysService.findResponses(companyId, surveyId)
    }

    // --- Statistics ---
    @Get(':surveyId/statistics')
    getSurveyStatistics(
        @Param('companyId') companyId: string,
        @Param('surveyId') surveyId: string,
    ) {
        return this.surveysService.getSurveyStatistics(companyId, surveyId)
    }

    @Get(':surveyId/questions/:questionId/statistics')
    getQuestionStatistics(
        @Param('companyId') companyId: string,
        @Param('surveyId') surveyId: string,
        @Param('questionId') questionId: string,
    ) {
        return this.surveysService.getQuestionStatistics(
            companyId,
            surveyId,
            questionId,
        )
    }
}
