// backend/src/modules/surveys/surveys.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SurveyEntity } from './entities/survey.entity';
import { SurveyQuestionEntity } from './entities/survey-question.entity';
import { SurveyResponseEntity } from './entities/survey-response.entity';

import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { CreateSurveyQuestionDto } from './dto/create-survey-question.dto';
import { UpdateSurveyQuestionDto } from './dto/update-survey-question.dto';
import { CreateSurveyResponseDto } from './dto/create-survey-response.dto';

import { SurveyStatisticsDto } from './dto/survey-statistics.dto';
import { QuestionStatisticsDto } from './dto/question-statistics.dto';
import { CommunicationsService } from '../../notifications/communications.service';

type StatsOpts = {
  from?: Date;
  to?: Date;
  onlyIdentified?: boolean;
  tz?: string;
};

@Injectable()
export class SurveysService {
  private readonly logger = new Logger(SurveysService.name);

  constructor(
    @InjectRepository(SurveyEntity)
    private surveysRepo: Repository<SurveyEntity>,
    @InjectRepository(SurveyQuestionEntity)
    private questionsRepo: Repository<SurveyQuestionEntity>,
    @InjectRepository(SurveyResponseEntity)
    private responsesRepo: Repository<SurveyResponseEntity>,
    private readonly comms: CommunicationsService,
  ) { }

  // --- Helpers de Audiência ---
  private async getUserIdsForAudience(
    companyId: string,
    spaceIds: string[],
    groupIds: string[] | undefined,
  ): Promise<string[]> {
    const ds = this.surveysRepo.manager.connection;

    // Se não tem filtro de Space nem de Grupo, é para TODOS (Público)
    if (
      (!spaceIds || spaceIds.length === 0) &&
      (!groupIds || groupIds?.length === 0)
    ) {
      const allUsers = await ds.query(
        `SELECT id FROM "user_entity" WHERE "companyId" = $1`,
        [companyId],
      );
      return allUsers.map((u: any) => u.id);
    }

    const allUserIds = new Set<string>();

    if (spaceIds?.length) {
      try {
        const spaceUsers = await ds.query(
          `SELECT "userId" FROM "user_space_entity" WHERE "companyId" = $1 AND "spaceId" = ANY($2::uuid[])`,
          [companyId, spaceIds],
        );
        spaceUsers.forEach((r: any) => allUserIds.add(r.userId));
      } catch (e) { }
    }

    if (groupIds?.length) {
      try {
        const groupUsers = await ds.query(
          `SELECT "userId" FROM "user_group_entity" WHERE "companyId" = $1 AND "groupId" = ANY($2::uuid[])`,
          [companyId, groupIds],
        );
        groupUsers.forEach((r: any) => allUserIds.add(r.userId));
      } catch (e) { }
    }

    return Array.from(allUserIds);
  }

  private async sendPublicationPush(survey: SurveyEntity) {
    this.logger.log(
      `[SurveyPush] Verificando disparo para Survey "${survey.title}" (ID: ${survey.id})`,
    );

    if (!survey.pushNotification) {
      this.logger.warn(`[SurveyPush] Ignorado: pushNotification = false.`);
      return;
    }

    const title = survey.pushTitle || survey.title || 'Nova Enquete';
    const body =
      survey.pushContent || 'Uma nova enquete está disponível para você.';

    try {
      const userIds = await this.getUserIdsForAudience(
        survey.companyId,
        survey.spaceIds,
        survey.groupIds,
      );

      if (userIds.length === 0) {
        this.logger.warn(
          `[SurveyPush] Cancelado: Audiência vazia (0 usuários).`,
        );
        return;
      }

      this.logger.log(
        `[SurveyPush] Disparando para ${userIds.length} usuários. Título: "${title}"`,
      );

      await this.comms.sendPush({
        companyId: survey.companyId,
        userIds: userIds,
        title: title,
        body: body,
        deepLinkMobile: `iuppy://surveys/${survey.id}`,
        kind: 'SURVEY_PUBLISHED',
        entityId: survey.id,
      });

      this.logger.log(`[SurveyPush] Enviado com sucesso!`);
    } catch (e) {
      this.logger.error(`[SurveyPush] ERRO CRÍTICO: ${String(e)}`);
    }
  }

  // --- Surveys CRUD ---
  async create(companyId: string, dto: CreateSurveyDto): Promise<SurveyEntity> {
    const normalized = this.normalizePayload(dto);
    const survey = this.surveysRepo.create({ ...normalized, companyId });
    await this.surveysRepo.save(survey);

    if (survey.status === 'published') {
      await this.sendPublicationPush(survey);
    }
    return survey;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateSurveyDto,
  ): Promise<SurveyEntity> {
    this.logger.log(
      `[SurveyUpdate] Recebido update para ${id}. Status DTO: ${dto.status}`,
    );

    const survey = await this.findOne(companyId, id);
    const oldStatus = survey.status;

    const normalized = this.normalizePayload({
      ...(survey as any),
      ...dto,
    } as CreateSurveyDto);
    Object.assign(survey, normalized);

    await this.surveysRepo.save(survey);

    // Lógica de Gatilho
    const isPublished = survey.status === 'published';
    const statusChanged = oldStatus !== 'published';
    const intentToPublish = dto.status === 'published';
    const pushActivated = survey.pushNotification === true;

    this.logger.log(
      `[SurveyUpdate] isPublished=${isPublished}, statusChanged=${statusChanged}, intent=${intentToPublish}, push=${pushActivated}`,
    );

    if (isPublished && (statusChanged || intentToPublish) && pushActivated) {
      this.logger.log(`[SurveyUpdate] Condição de Push atendida. Enviando...`);
      await this.sendPublicationPush(survey);
    }

    return survey;
  }

  // ... (MANTENHA O RESTO IGUAL) ...

  async findAll(
    companyId: string,
    filters?: {
      spaceId?: string;
      spaceIds?: string[];
      includeGlobal?: boolean;
      visibility?: string;
      allowedSpaceIds?: string[];
      userId?: string;
    },
  ): Promise<SurveyEntity[]> {
    const qb = this.surveysRepo.createQueryBuilder('s')
      .where('s.companyId = :companyId', { companyId })
      .leftJoinAndSelect('s.questions', 'q')
      .orderBy('s.createdAt', 'DESC');

    // 1. Visibility Filter
    if (filters?.visibility === 'all') {
      // No filter
    } else if (filters?.visibility) {
      qb.andWhere('s.visibility = :vis', { vis: filters.visibility });
    } else {
      qb.andWhere('s.visibility != :vis', { vis: 'journey_only' });
    }

    // 2. Admin Scoping (allowedSpaceIds)
    if (filters?.allowedSpaceIds && filters.allowedSpaceIds.length > 0) {
      // Postgres array overlap: s.spaceIds && allowedSpaceIds
      qb.andWhere('s.spaceIds && :allowedSpaceIds', { allowedSpaceIds: filters.allowedSpaceIds });
    }

    // 3. App Segmentation (userId)
    if (filters?.userId) {
      const { spaceIds, groupIds } = await this.getUserGroupsAndSpaces(filters.userId);

      // We need to handle the case where user has no spaces or groups
      const safeSpaceIds = spaceIds || [];
      const safeGroupIds = groupIds || [];

      // Postgres && with empty array works (returns false), but we need to pass empty array if null
      // We can't easily pass arrays to raw SQL in QB without parameters, so let's use parameters.
      // But we need to be careful with parameter indices if we add multiple params.
      // Actually, we can just use :safeSpaceIds and :safeGroupIds.

      qb.andWhere(
        `(
          s.visibility = 'public' OR 
          (
            s.visibility = 'specific_groups' AND (
              (s.spaceIds IS NOT NULL AND s.spaceIds && :safeSpaceIds) OR
              (s.groupIds IS NOT NULL AND s.groupIds && :safeGroupIds)
            )
          )
        )`,
        { safeSpaceIds, safeGroupIds }
      );
    }

    // 4. Legacy Space Filter (from query params)
    // This is likely used by the App or CMS to filter by specific space context.
    // If we already filtered by allowedSpaceIds, this further restricts it.
    const spaceId = filters?.spaceId;
    const spaceIds = filters?.spaceIds;

    if (spaceId) {
      qb.andWhere('s.spaceIds @> ARRAY[:spaceId]', { spaceId });
    } else if (spaceIds && spaceIds.length > 0) {
      // Original logic was: return rows.filter((s) => (s.spaceIds || []).some((id) => set.has(id)));
      // This means "Survey has AT LEAST ONE of the requested spaces".
      // Postgres overlap operator && does exactly this.
      qb.andWhere('s.spaceIds && :filterSpaceIds', { filterSpaceIds: spaceIds });
    }

    return qb.getMany();
  }

  // Helper to get user groups and spaces (duplicated from FormsService, should be shared but keeping local for now)
  private async getUserGroupsAndSpaces(userId: string) {
    const ds = this.surveysRepo.manager.connection;
    let groupIds: string[] = [];
    let spaceIds: string[] = [];

    try {
      const groups = await ds.query(
        `SELECT group_id FROM user_group_members WHERE user_id = $1::uuid`,
        [userId],
      );
      groupIds = groups.map((g: any) => g.group_id);

      const spaces = await ds.query(
        `SELECT id FROM space WHERE "companyId" = (SELECT "companyId" FROM user_entity WHERE id = $1::uuid) AND COALESCE(active,true)=true`,
        [userId],
      );
      spaceIds = spaces.map((s: any) => s.id);
    } catch (e) {
      this.logger.warn(
        `Erro ao recuperar grupos/spaces do usuário ${userId}: ${e}`,
      );
    }

    return { groupIds, spaceIds };
  }

  async findOne(companyId: string, id: string): Promise<SurveyEntity> {
    const survey = await this.surveysRepo.findOne({
      where: { companyId, id },
      relations: ['questions'],
    });
    if (!survey) throw new NotFoundException(`Survey ${id} not found`);
    return survey;
  }

  async remove(companyId: string, id: string): Promise<void> {
    const survey = await this.findOne(companyId, id);
    await this.surveysRepo.remove(survey);
  }

  // --- normalização do payload ---
  private normalizePayload<T extends Partial<CreateSurveyDto>>(dto: T): T {
    const out: any = { ...dto };

    if (out.visibility !== 'specific_groups') {
      out.groupIds = [];
    } else if (!Array.isArray(out.groupIds)) {
      out.groupIds = [];
    }

    const now = new Date();
    if (!out.scheduleSurvey) {
      out.startsAt = (
        out.startsAt ? new Date(out.startsAt) : now
      ).toISOString();
    }
    if (!out.expireSurvey) {
      out.endsAt = null;
    }

    if (!out.status) out.status = 'draft';

    // Garante booleanos
    out.notifyUsers = !!out.notifyUsers;
    out.emailNotification = !!out.emailNotification;
    out.inAppNotification = !!out.inAppNotification;
    out.pushNotification = !!out.pushNotification;
    out.acknowledgementRequired = !!out.acknowledgementRequired;
    out.scheduleSurvey = !!out.scheduleSurvey;
    out.expireSurvey = !!out.expireSurvey;
    out.isAnonymous = !!out.isAnonymous;

    return out;
  }

  // --- Questions CRUD ---
  async addQuestion(
    companyId: string,
    surveyId: string,
    dto: CreateSurveyQuestionDto,
  ): Promise<SurveyQuestionEntity> {
    const survey = await this.findOne(companyId, surveyId);
    const q = this.questionsRepo.create({ ...dto, survey });
    return this.questionsRepo.save(q);
  }

  async updateQuestion(
    companyId: string,
    id: string,
    dto: UpdateSurveyQuestionDto,
  ): Promise<SurveyQuestionEntity> {
    const question = await this.questionsRepo.findOne({
      where: { id },
      relations: ['survey'],
    });
    if (!question || question.survey.companyId !== companyId) {
      throw new ForbiddenException();
    }
    Object.assign(question, dto);
    return this.questionsRepo.save(question);
  }

  async reorderQuestions(
    companyId: string,
    surveyId: string,
    pairs: Array<{ id: string; order: number }>,
  ): Promise<void> {
    const survey = await this.findOne(companyId, surveyId);
    const ids = new Set(pairs.map((p) => p.id));
    const belongs = survey.questions.every(
      (q) => ids.has(q.id) || !ids.has(q.id),
    );
    if (!belongs) throw new ForbiddenException();

    const byId = new Map(pairs.map((p) => [p.id, p.order]));
    for (const q of survey.questions) {
      const newOrder = byId.get(q.id);
      if (typeof newOrder === 'number') q.order = newOrder;
    }
    await this.questionsRepo.save(survey.questions);
  }

  async removeQuestion(companyId: string, id: string): Promise<void> {
    const question = await this.questionsRepo.findOne({
      where: { id },
      relations: ['survey'],
    });
    if (!question || question.survey.companyId !== companyId) {
      throw new ForbiddenException();
    }
    await this.questionsRepo.remove(question);
  }

  // --- Responses CRUD ---
  async addResponse(
    companyId: string,
    dto: CreateSurveyResponseDto,
  ): Promise<SurveyResponseEntity> {
    const survey = await this.findOne(companyId, dto.surveyId);
    const resp = this.responsesRepo.create({ ...dto, survey });
    return this.responsesRepo.save(resp);
  }

  findResponses(
    companyId: string,
    surveyId: string,
  ): Promise<SurveyResponseEntity[]> {
    return this.responsesRepo.find({
      where: { survey: { companyId, id: surveyId } },
    });
  }

  // --- Helpers de TZ (sem libs) ---
  private partsInTz(date: Date, timeZone: string) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
    });
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
    const weekdayShort = get('weekday'); // Sun..Sat
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return {
      dayKey: `${get('year')}-${get('month')}-${get('day')}`, // YYYY-MM-DD
      hour: Number(get('hour')),
      dow: map[weekdayShort] ?? 0,
    };
  }

  // --- Estatísticas helpers ---
  private distinctLatestByUser<
    T extends { userId?: string; submittedAt?: Date | string },
  >(rows: T[]): T[] {
    const map = new Map<string, T>();
    for (const r of rows) {
      if (!r.userId) continue;
      const key = r.userId;
      const curr = map.get(key);
      const currTs = curr
        ? new Date(curr.submittedAt as any).getTime()
        : -Infinity;
      const rTs = r.submittedAt
        ? new Date(r.submittedAt as any).getTime()
        : -Infinity;
      if (!curr || rTs >= currTs) map.set(key, r);
    }
    return Array.from(map.values());
  }

  private filterResponses(
    all: SurveyResponseEntity[],
    { from, to, onlyIdentified }: StatsOpts,
  ): SurveyResponseEntity[] {
    let rows = all;
    if (from)
      rows = rows.filter(
        (r) => r.submittedAt && new Date(r.submittedAt) >= from,
      );
    if (to)
      rows = rows.filter((r) => r.submittedAt && new Date(r.submittedAt) <= to);
    if (onlyIdentified) {
      rows = rows.filter((r) => !!r.userId);
      rows = this.distinctLatestByUser(rows);
    }
    return rows;
  }

  private static readonly PT_STOPWORDS = new Set<string>([
    'a',
    'o',
    'as',
    'os',
    'um',
    'uma',
    'uns',
    'umas',
    'de',
    'da',
    'do',
    'das',
    'dos',
    'e',
    'é',
    'em',
    'no',
    'na',
    'nos',
    'nas',
    'para',
    'pra',
    'por',
    'com',
    'sem',
    'entre',
    'sobre',
    'que',
    'se',
    'mas',
    'ou',
    'como',
    'já',
    'também',
    'muito',
    'muita',
    'muitos',
    'muitas',
    'eu',
    'tu',
    'ele',
    'ela',
    'nós',
    'vos',
    'eles',
    'elas',
    'meu',
    'minha',
    'meus',
    'minhas',
    'seu',
    'sua',
    'seus',
    'suas',
    'isso',
    'isto',
    'aquilo',
    'aqui',
    'ali',
    'lá',
    'depois',
    'antes',
    'ontem',
    'hoje',
    'amanhã',
  ]);

  private tokensFrom(text: string): string[] {
    const cleaned = (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const toks = cleaned.match(/[a-zà-ú0-9]+/gi) || [];
    return toks
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !SurveysService.PT_STOPWORDS.has(t));
  }

  private topWordsFrom(answers: string[], limit = 20) {
    const freq = new Map<string, number>();
    for (const raw of answers) {
      const tokens = this.tokensFrom(raw || '');
      for (const tok of tokens) {
        freq.set(tok, (freq.get(tok) || 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }

  private topNgramsFrom(answers: string[], n: 2 | 3, limit = 30) {
    const freq = new Map<string, number>();
    for (const raw of answers) {
      const tokens = this.tokensFrom(raw || '');
      for (let i = 0; i <= tokens.length - n; i++) {
        const key = tokens.slice(i, i + n).join(' ');
        freq.set(key, (freq.get(key) || 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([phrase, count]) => ({ phrase, count }));
  }

  private numericStats(nums: number[]) {
    if (!nums.length) return {};
    const sorted = [...nums].sort((a, b) => a - b);
    const avg = nums.reduce((s, v) => s + v, 0) / nums.length;
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const p = (p: number) => {
      if (sorted.length === 1) return sorted[0];
      const idx = (sorted.length - 1) * p;
      const lo = Math.floor(idx),
        hi = Math.ceil(idx);
      if (lo === hi) return sorted[lo];
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    const p25 = p(0.25);
    const p75 = p(0.75);
    const variance =
      nums.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / nums.length;
    const stddev = Math.sqrt(variance);
    return {
      average: Number(avg.toFixed(2)),
      median: Number(median.toFixed(2)),
      p25: Number(p25.toFixed(2)),
      p75: Number(p75.toFixed(2)),
      stddev: Number(stddev.toFixed(2)),
      min: Math.min(...sorted),
      max: Math.max(...sorted),
    };
  }

  // --- Estatística por pergunta ---
  async getQuestionStatistics(
    companyId: string,
    surveyId: string,
    questionId: string,
    opts: StatsOpts = {},
  ): Promise<QuestionStatisticsDto> {
    const question = await this.questionsRepo.findOne({
      where: { id: questionId },
      relations: ['survey'],
    });
    if (
      !question ||
      question.survey.companyId !== companyId ||
      question.survey.id !== surveyId
    ) {
      throw new ForbiddenException();
    }

    const allResponses = await this.responsesRepo.find({
      where: { survey: { companyId, id: surveyId } },
    });
    const responses = this.filterResponses(allResponses, opts);
    const totalRespondents = responses.length;

    const rawForThisQ = responses
      .map((r) => r.answers.find((a) => a.questionId === questionId))
      .filter(Boolean) as { questionId: string; answer: any }[];

    const answeredCount = rawForThisQ.length;
    const skippedCount = Math.max(totalRespondents - answeredCount, 0);

    const stats: QuestionStatisticsDto = {
      questionId,
      questionText: question.questionText,
      type: question.type as any,
      totalRespondents,
      answeredCount,
      skippedCount,
    };

    const rawAnswers = rawForThisQ.map((a) => a!.answer);

    switch (question.type) {
      case 'text': {
        const texts = (rawAnswers as string[]).filter(
          (x) => typeof x === 'string',
        ) as string[];
        stats.answers = texts;
        stats.topWords = this.topWordsFrom(texts, 50);
        stats.bigrams = this.topNgramsFrom(texts, 2, 30);
        stats.trigrams = this.topNgramsFrom(texts, 3, 30);
        break;
      }
      case 'single':
      case 'multi': {
        const flat = (rawAnswers as (string | string[])[]).flatMap((v) =>
          Array.isArray(v) ? v : [v],
        );
        const counts = flat.reduce(
          (acc, val: string) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
        stats.options = counts;
        if (flat.length > 0) {
          const pct: Record<string, string> = {};
          Object.keys(counts).forEach((k) => {
            pct[k] = `${((counts[k] / flat.length) * 100).toFixed(1)}%`;
          });
          stats.optionsPct = pct;
        }
        break;
      }
      case 'stars':
      case 'scale': {
        const nums = (rawAnswers as number[]).filter((v) => Number.isFinite(v));
        stats.distribution = nums.reduce(
          (acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        );
        Object.assign(stats, this.numericStats(nums));
        break;
      }
      case 'nps': {
        const nums = (rawAnswers as number[]).filter((v) => Number.isFinite(v));
        stats.distribution = nums.reduce(
          (acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        );
        const promoters = nums.filter((v) => v >= 9).length;
        const passives = nums.filter((v) => v >= 7 && v <= 8).length;
        const detractors = nums.filter((v) => v <= 6).length;
        const total = nums.length || 1;
        const npsScore = ((promoters - detractors) / total) * 100;
        stats.promoters = promoters;
        stats.passives = passives;
        stats.detractors = detractors;
        stats.npsScore = Number(npsScore.toFixed(2));
        break;
      }
      default:
        throw new NotFoundException('Tipo de pergunta desconhecido');
    }

    return stats;
  }

  // --- Estatística da survey ---
  async getSurveyStatistics(
    companyId: string,
    surveyId: string,
    opts: StatsOpts = {},
  ): Promise<SurveyStatisticsDto> {
    const tz = opts.tz || 'UTC';
    const survey = await this.findOne(companyId, surveyId);
    const allResponses = await this.responsesRepo.find({
      where: { survey: { companyId, id: surveyId } },
    });
    const responses = this.filterResponses(allResponses, opts);
    const totalResponses = responses.length;

    // janela temporal & anonimato (continuam em UTC)
    let windowFrom: string | undefined;
    let windowTo: string | undefined;
    let anonymousRate: number | undefined;
    if (responses.length) {
      const ts = responses
        .map((r) =>
          r.submittedAt ? new Date(r.submittedAt).getTime() : undefined,
        )
        .filter(Boolean) as number[];
      if (ts.length) {
        windowFrom = new Date(Math.min(...ts)).toISOString();
        windowTo = new Date(Math.max(...ts)).toISOString();
      }
      const anon = responses.filter((r) => !r.userId).length;
      anonymousRate = Number(((anon / responses.length) * 100).toFixed(1));
    }

    // série temporal (por dia) -> **na TZ**
    const byDay = new Map<string, number>();
    for (const r of responses) {
      const d = r.submittedAt ? new Date(r.submittedAt) : null;
      const key = d ? this.partsInTz(d, tz).dayKey : 'sem_data';
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }
    const responsesOverTime = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // heatmap dia x hora -> **na TZ**
    const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const r of responses) {
      if (!r.submittedAt) continue;
      const p = this.partsInTz(new Date(r.submittedAt), tz);
      heat[p.dow][p.hour] = (heat[p.dow][p.hour] || 0) + 1;
    }
    const responsesHeatmap = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        responsesHeatmap.push({ day, hour, count: heat[day][hour] });
      }
    }

    // agregados numéricos
    const questions = await Promise.all(
      survey.questions.map((q) =>
        this.getQuestionStatistics(companyId, surveyId, q.id, opts),
      ),
    );

    let allNps: number[] = [];
    let allStars: number[] = [];
    let allScale: number[] = [];

    for (const q of questions) {
      const expand = (dist?: Record<number, number>) => {
        if (!dist) return [] as number[];
        const arr: number[] = [];
        Object.entries(dist).forEach(([k, v]) => {
          for (let i = 0; i < v; i++) arr.push(Number(k));
        });
        return arr;
      };
      if (q.type === 'nps') allNps = allNps.concat(expand(q.distribution));
      if (q.type === 'stars')
        allStars = allStars.concat(expand(q.distribution));
      if (q.type === 'scale')
        allScale = allScale.concat(expand(q.distribution));
    }

    let npsOverall: SurveyStatisticsDto['npsOverall'] | undefined;
    if (allNps.length) {
      const promoters = allNps.filter((v) => v >= 9).length;
      const passives = allNps.filter((v) => v >= 7 && v <= 8).length;
      const detractors = allNps.filter((v) => v <= 6).length;
      const npsScore = ((promoters - detractors) / allNps.length) * 100;
      npsOverall = {
        promoters,
        passives,
        detractors,
        npsScore: Number(npsScore.toFixed(2)),
      };
    }

    const starsAverage = allStars.length
      ? Number(
        (allStars.reduce((s, v) => s + v, 0) / allStars.length).toFixed(2),
      )
      : undefined;
    const scaleAverage = allScale.length
      ? Number(
        (allScale.reduce((s, v) => s + v, 0) / allScale.length).toFixed(2),
      )
      : undefined;

    // completionRate: % que respondeu TODAS as perguntas
    let completionRate: number | undefined;
    if (responses.length && survey.questions.length) {
      const full = responses.filter((r) =>
        survey.questions.every((q) =>
          r.answers.some(
            (a) =>
              a.questionId === q.id &&
              a.answer !== undefined &&
              a.answer !== null,
          ),
        ),
      ).length;
      completionRate = Number(((full / responses.length) * 100).toFixed(1));
    }

    return {
      surveyId,
      totalResponses,
      anonymousRate,
      completionRate,
      windowFrom,
      windowTo,
      responsesOverTime,
      responsesHeatmap,
      npsOverall,
      starsAverage,
      scaleAverage,
      questions,
    };
  }
}
