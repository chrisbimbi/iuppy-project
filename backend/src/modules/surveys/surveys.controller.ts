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
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { AccessControlService } from 'src/access-control/access-control.service';
import { Role } from '@shared/types';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';

import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto';
import { UpdateSurveyQuestionDto } from './dto/update-survey-question.dto';
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto';

@Controller('modules/:companyId/surveys')
@UseGuards(JwtAccessGuard)
export class SurveysController {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly accessControlService: AccessControlService,
  ) { }

  @Post()
  create(@Param('companyId') companyId: string, @Body() dto: CreateSurveyDto) {
    return this.surveysService.create(companyId, dto);
  }

  /**
   * Query params:
   * - spaceId=abc
   * - spaceIds=id1,id2,id3
   * - includeGlobal=true | false
   */
  @Get()
  async findAll(
    @Req() req: any,
    @Param('companyId') companyId: string,
    @Query('spaceId') spaceId?: string,
    @Query('spaceIds') spaceIdsStr?: string,
    @Query('includeGlobal', new DefaultValuePipe(false), ParseBoolPipe)
    includeGlobal?: boolean,
    @Query('visibility') visibility?: string,
  ) {
    // Validate Company ID
    const user = req.user;
    if (user.companyId !== companyId) {
      // Allow super_admin to access any company? Usually yes, but let's stick to token companyId for safety unless explicitly handled.
      // If user.companyId is missing (e.g. super_admin global), we might allow.
      // For now, enforce match for safety.
      if (user.role !== Role.SuperAdmin && user.companyId !== companyId) {
        throw new ForbiddenException('Company ID mismatch');
      }
    }

    const role = user.role;
    const userId = user.id || user.sub;
    let allowedSpaceIds: string[] | undefined;
    let filterUserId: string | undefined;

    if (role === Role.User) {
      // App User: Apply Segmentation
      filterUserId = userId;
    } else {
      // Admin: Check ACL
      const caps = await this.accessControlService.capabilities(companyId, { id: userId, role });
      const surveysCaps = caps.modules.surveys;

      if (!surveysCaps?.canView) {
        return [];
      }

      if (surveysCaps.scopeType === 'SPACE_IDS') {
        allowedSpaceIds = surveysCaps.spaceIds;
      }
    }

    const spaceIds = spaceIdsStr
      ? spaceIdsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      : undefined;

    return this.surveysService.findAll(companyId, {
      spaceId,
      spaceIds,
      includeGlobal,
      visibility,
      allowedSpaceIds,
      userId: filterUserId,
    });
  }

  @Get(':id')
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.surveysService.findOne(companyId, id);
  }

  @Patch(':id')
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSurveyDto,
  ) {
    return this.surveysService.update(companyId, id, dto);
  }

  @Delete(':id')
  remove(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.surveysService.remove(companyId, id);
  }

  // --- Questions ---
  @Post(':surveyId/questions')
  addQuestion(
    @Param('companyId') companyId: string,
    @Param('surveyId') surveyId: string,
    @Body() dto: CreateSurveyQuestionDto,
  ) {
    return this.surveysService.addQuestion(companyId, surveyId, dto);
  }

  @Patch('questions/:id')
  updateQuestion(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSurveyQuestionDto,
  ) {
    return this.surveysService.updateQuestion(companyId, id, dto);
  }

  @Patch(':surveyId/questions/reorder')
  reorderQuestions(
    @Param('companyId') companyId: string,
    @Param('surveyId') surveyId: string,
    @Body() payload: Array<{ id: string; order: number }>,
  ) {
    return this.surveysService.reorderQuestions(companyId, surveyId, payload);
  }

  @Delete('questions/:id')
  removeQuestion(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.surveysService.removeQuestion(companyId, id);
  }

  // --- Responses ---
  @Post('responses')
  addResponse(
    @Param('companyId') companyId: string,
    @Body() dto: CreateSurveyResponseDto,
    @Req() req: any,
  ) {
    // Inject userId from token if not present (critical for Gamification/XP)
    if (!dto.userId && req.user?.id) {
      dto.userId = req.user.id;
    }
    return this.surveysService.addResponse(companyId, dto);
  }

  @Get(':surveyId/responses')
  findResponses(
    @Param('companyId') companyId: string,
    @Param('surveyId') surveyId: string,
  ) {
    return this.surveysService.findResponses(companyId, surveyId);
  }

  // --- Statistics (com filtros) ---
  @Get(':surveyId/statistics')
  getSurveyStatistics(
    @Param('companyId') companyId: string,
    @Param('surveyId') surveyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('onlyIdentified', new DefaultValuePipe(false), ParseBoolPipe)
    onlyIdentified?: boolean,
    @Query('tz') tz?: string,
  ) {
    return this.surveysService.getSurveyStatistics(companyId, surveyId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      onlyIdentified,
      tz: tz || 'UTC',
    });
  }

  @Get(':surveyId/questions/:questionId/statistics')
  getQuestionStatistics(
    @Param('companyId') companyId: string,
    @Param('surveyId') surveyId: string,
    @Param('questionId') questionId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('onlyIdentified', new DefaultValuePipe(false), ParseBoolPipe)
    onlyIdentified?: boolean,
    @Query('tz') tz?: string,
  ) {
    return this.surveysService.getQuestionStatistics(
      companyId,
      surveyId,
      questionId,
      {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        onlyIdentified,
        tz: tz || 'UTC',
      },
    );
  }
}
