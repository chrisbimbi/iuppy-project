import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'

import { SurveyEntity } from './entities/survey.entity'
import { SurveyQuestionEntity } from './entities/survey-question.entity'
import { SurveyResponseEntity } from './entities/survey-response.entity'

import { CreateSurveyDto } from './dto/create-survey.dto'
import { UpdateSurveyDto } from './dto/update-survey.dto'
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto'
import { UpdateSurveyQuestionDto } from './dto/update-survey-question.dto'
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto'

import { SurveyStatisticsDto } from './dto/survey-statistics.dto'
import { QuestionStatisticsDto } from './dto/question-statistics.dto'

type ListFilters = {
    spaceId?: string
    spaceIds?: string[]
    /** quando houver filtro por space(s), inclui também as surveys “globais” (spaceIds vazio ou null) */
    includeGlobal?: boolean
}

@Injectable()
export class SurveysService {
    constructor(
        @InjectRepository(SurveyEntity)
        private surveysRepo: Repository<SurveyEntity>,
        @InjectRepository(SurveyQuestionEntity)
        private questionsRepo: Repository<SurveyQuestionEntity>,
        @InjectRepository(SurveyResponseEntity)
        private responsesRepo: Repository<SurveyResponseEntity>,
    ) { }

    // --- Surveys CRUD ---
    async create(companyId: string, dto: CreateSurveyDto): Promise<SurveyEntity> {
        const normalized = this.normalizePayload(dto)
        const survey = this.surveysRepo.create({ ...normalized, companyId })
        return this.surveysRepo.save(survey)
    }

    /**
     * Lista surveys da empresa, com filtro opcional por space.
     * Regras:
     *  - sem filtro de space => retorna todas as surveys da company
     *  - com spaceId/spaceIds => retorna as que tenham interseção com esses spaces
     *  - includeGlobal=true => além das acima, inclui as surveys com spaceIds vazio/null
     */
    async findAll(companyId: string, filters?: ListFilters): Promise<SurveyEntity[]> {
        const qb = this.surveysRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.questions', 'q')
            .where('s.companyId = :companyId', { companyId })
            .orderBy('s.createdAt', 'DESC')

        const spaceId = filters?.spaceId?.trim()
        const spaceIds = filters?.spaceIds?.filter(Boolean)
        const includeGlobal = !!filters?.includeGlobal

        const hasSpaceFilter = !!(spaceId || (spaceIds && spaceIds.length))

        if (hasSpaceFilter) {
            qb.andWhere(
                new Brackets((w) => {
                    if (spaceId) {
                        // um único space
                        w.where(':spaceId = ANY(s.spaceIds)', { spaceId })
                    }
                    if (spaceIds?.length) {
                        // vários spaces (interseção)
                        // o pg aceita array param; fazemos cast explícito pra text[]
                        w[spaceId ? 'orWhere' : 'where']('s.spaceIds && :spaceIds::text[]', {
                            // para o pg driver, um array JS vira um array SQL automaticamente
                            spaceIds,
                        })
                    }
                    if (includeGlobal) {
                        // surveys sem nenhum space associado
                        w.orWhere('(s.spaceIds IS NULL OR array_length(s.spaceIds, 1) = 0)')
                    }
                }),
            )
        }
        // Sem filtro de space: não aplicamos nada extra. (includeGlobal não altera, pois já retornamos tudo)

        return qb.getMany()
    }

    async findOne(companyId: string, id: string): Promise<SurveyEntity> {
        const survey = await this.surveysRepo.findOne({
            where: { companyId, id },
            relations: ['questions'],
        })
        if (!survey) throw new NotFoundException(`Survey ${id} not found`)
        return survey
    }

    async update(
        companyId: string,
        id: string,
        dto: UpdateSurveyDto,
    ): Promise<SurveyEntity> {
        const survey = await this.findOne(companyId, id)
        const normalized = this.normalizePayload({ ...(survey as any), ...dto } as CreateSurveyDto)
        Object.assign(survey, normalized)
        return this.surveysRepo.save(survey)
    }

    async remove(companyId: string, id: string): Promise<void> {
        const survey = await this.findOne(companyId, id)
        await this.surveysRepo.remove(survey)
    }

    // --- normalização do payload (condições business/UX) ---
    private normalizePayload<T extends Partial<CreateSurveyDto>>(dto: T): T {
        const out: any = { ...dto }

        // groupIds: apenas em specific_groups; senão, vazio
        if (out.visibility !== 'specific_groups') {
            out.groupIds = []
        } else if (!Array.isArray(out.groupIds)) {
            out.groupIds = []
        }

        // schedule / expire
        const now = new Date()
        if (!out.scheduleSurvey) {
            out.startsAt = (out.startsAt ? new Date(out.startsAt) : now).toISOString()
        }
        if (!out.expireSurvey) {
            out.endsAt = null
        }

        // status default
        if (!out.status) out.status = 'draft'

        // garantir booleanos (caso frontend não envie algo)
        out.notifyUsers = !!out.notifyUsers
        out.emailNotification = !!out.emailNotification
        out.inAppNotification = !!out.inAppNotification
        out.pushNotification = !!out.pushNotification
        out.acknowledgementRequired = !!out.acknowledgementRequired
        out.scheduleSurvey = !!out.scheduleSurvey
        out.expireSurvey = !!out.expireSurvey
        out.isAnonymous = !!out.isAnonymous

        return out
    }

    // --- Questions CRUD ---
    async addQuestion(
        companyId: string,
        surveyId: string,
        dto: CreateSurveyQuestionDto,
    ): Promise<SurveyQuestionEntity> {
        const survey = await this.findOne(companyId, surveyId)
        const q = this.questionsRepo.create({ ...dto, survey })
        return this.questionsRepo.save(q)
    }

    async updateQuestion(
        companyId: string,
        id: string,
        dto: UpdateSurveyQuestionDto,
    ): Promise<SurveyQuestionEntity> {
        const question = await this.questionsRepo.findOne({
            where: { id },
            relations: ['survey'],
        })
        if (!question || question.survey.companyId !== companyId) {
            throw new ForbiddenException()
        }
        Object.assign(question, dto)
        return this.questionsRepo.save(question)
    }

    async removeQuestion(companyId: string, id: string): Promise<void> {
        const question = await this.questionsRepo.findOne({
            where: { id },
            relations: ['survey'],
        })
        if (!question || question.survey.companyId !== companyId) {
            throw new ForbiddenException()
        }
        await this.questionsRepo.remove(question)
    }

    // --- Responses CRUD ---
    async addResponse(
        companyId: string,
        dto: CreateSurveyResponseDto,
    ): Promise<SurveyResponseEntity> {
        const survey = await this.findOne(companyId, dto.surveyId)
        const resp = this.responsesRepo.create({ ...dto, survey })
        return this.responsesRepo.save(resp)
    }

    findResponses(
        companyId: string,
        surveyId: string,
    ): Promise<SurveyResponseEntity[]> {
        return this.responsesRepo.find({
            where: { survey: { companyId, id: surveyId } },
        })
    }

    // --- Estatísticas ---
    async getQuestionStatistics(
        companyId: string,
        surveyId: string,
        questionId: string,
    ): Promise<QuestionStatisticsDto> {
        const question = await this.questionsRepo.findOne({
            where: { id: questionId },
            relations: ['survey'],
        })
        if (
            !question ||
            question.survey.companyId !== companyId ||
            question.survey.id !== surveyId
        ) {
            throw new ForbiddenException()
        }

        const allResponses = await this.responsesRepo.find({
            where: { survey: { companyId, id: surveyId } },
        })
        const totalRespondents = allResponses.length

        const rawAnswers = allResponses
            .map((r) => r.answers.find((a) => a.questionId === questionId))
            .filter((a) => !!a)
            .map((a) => a!.answer)

        const stats: any = { questionId, totalRespondents }

        switch (question.type) {
            case 'text':
                stats.answers = rawAnswers as string[]
                break
            case 'single':
            case 'multi': {
                const flat = (rawAnswers as (string | string[])[]).flatMap((v) =>
                    Array.isArray(v) ? v : [v],
                )
                stats.options = flat.reduce((acc, val: string) => {
                    acc[val] = (acc[val] || 0) + 1
                    return acc
                }, {} as Record<string, number>)
                break
            }
            case 'stars':
            case 'scale': {
                const nums = rawAnswers as number[]
                stats.distribution = nums.reduce((acc, val) => {
                    acc[val] = (acc[val] || 0) + 1
                    return acc
                }, {} as Record<number, number>)
                stats.average =
                    nums.reduce((sum, v) => sum + v, 0) / (nums.length || 1)
                break
            }
            case 'nps': {
                const nums = rawAnswers as number[]
                stats.distribution = nums.reduce((acc, val) => {
                    acc[val] = (acc[val] || 0) + 1
                    return acc
                }, {} as Record<number, number>)
                const promoters = nums.filter((v) => v >= 9).length
                const detractors = nums.filter((v) => v <= 6).length
                const npsScore = ((promoters - detractors) / (nums.length || 1)) * 100
                stats.npsScore = Number(npsScore.toFixed(2))
                break
            }
            default:
                throw new NotFoundException('Tipo de pergunta desconhecido')
        }

        return stats as QuestionStatisticsDto
    }

    async getSurveyStatistics(
        companyId: string,
        surveyId: string,
    ): Promise<SurveyStatisticsDto> {
        const survey = await this.findOne(companyId, surveyId)
        const allResponses = await this.responsesRepo.find({
            where: { survey: { companyId, id: surveyId } },
        })
        const totalResponses = allResponses.length

        const questions = await Promise.all(
            survey.questions.map((q) =>
                this.getQuestionStatistics(companyId, surveyId, q.id),
            ),
        )

        return { surveyId, totalResponses, questions }
    }

    async reorderQuestions(
        companyId: string,
        surveyId: string,
        items: { id: string; order: number }[],
    ): Promise<void> {
        // valida survey pertence à empresa
        const survey = await this.findOne(companyId, surveyId)

        if (!Array.isArray(items) || items.length === 0) return

        const map = new Map(items.map(i => [i.id, i.order]))
        const qs = await this.questionsRepo.find({
            where: { survey: { id: survey.id, companyId } },
        })

        // aplica apenas nos ids válidos desta survey
        qs.forEach(q => {
            const newOrder = map.get(q.id)
            if (typeof newOrder === 'number') {
                q.order = newOrder
            }
        })

        // salva em batch
        await this.questionsRepo.save(qs)
    }
}
