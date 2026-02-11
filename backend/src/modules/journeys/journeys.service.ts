
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThan, DataSource } from 'typeorm';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import {
  JourneyEntity,
  JourneyTriggerType,
  JourneyRestartPolicy,
} from './entities/journey.entity';
import { JourneyStepEntity, StepContentType } from './entities/journey-step.entity';
import {
  UserJourneyInstanceEntity,
  JourneyInstanceStatus,
} from './entities/user-journey-instance.entity';
import { StepCompletionEntity } from './entities/step-completion.entity';
import { FIREBASE_ADMIN } from '../../notifications/firebase-admin.provider';
import { App } from 'firebase-admin/app';
import * as ExcelJS from 'exceljs';
import * as archiver from 'archiver';
import { CommunicationsService } from '../../notifications/communications.service';
import { UserEntity } from '../../users/user.entity';
import { getStorage } from 'firebase-admin/storage';
@Injectable()
export class JourneysService {
  private readonly logger = new Logger(JourneysService.name);

  constructor(
    @InjectRepository(JourneyEntity)
    private readonly journeyRepo: Repository<JourneyEntity>,
    @InjectRepository(JourneyStepEntity)
    private readonly stepRepo: Repository<JourneyStepEntity>,
    @InjectRepository(UserJourneyInstanceEntity)
    private readonly instanceRepo: Repository<UserJourneyInstanceEntity>,
    @InjectRepository(StepCompletionEntity)
    private readonly completionRepo: Repository<StepCompletionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly communicationsService: CommunicationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    @Inject(FIREBASE_ADMIN) private readonly firebaseApp: App,
  ) { }

  // ===== Event Listeners =====

  @OnEvent('user.created')
  async handleUserCreated(user: UserEntity) {
    this.logger.log('Handling user.created for user ' + user.id);

    // Find active ONBOARDING journeys for this company
    const onboardingJourneys = await this.journeyRepo.find({
      where: {
        companyId: user.companyId,
        triggerType: JourneyTriggerType.ONBOARDING,
        active: true,
      },
    });

    // Reload user with groups and spaces
    const fullUser = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['memberOf', 'userSpaces'],
    });
    if (!fullUser) return;

    for (const journey of onboardingJourneys) {
      // Check target audience rules if any
      if (this.matchesAudience(fullUser, journey.targetAudience, journey.spaceId)) {
        await this.createInstanceIfNotExists(fullUser.id, journey.id);
      }
    }
  }

  @OnEvent('journey.sync_audience')
  async handleJourneySyncAudience(payload: { journeyId: string; companyId: string }) {
    this.logger.log(`Syncing audience for journey ${payload.journeyId}`);
    try {
      await this.syncAudience(payload.journeyId, payload.companyId);
    } catch (e) {
      this.logger.error(`Failed to sync audience for journey ${payload.journeyId}: ${e.message}`);
    }
  }

  // Sync Audience Logic
  async syncAudience(journeyId: string, companyId: string) {
    const journey = await this.journeyRepo.findOneBy({ id: journeyId });
    if (!journey || !journey.active) return; // Only sync if active

    this.logger.log(`Starting audience sync for journey ${journey.title} (${journey.id})`);

    // Fetch ALL users for the company
    // For large companies, this should be paginated or streamed. 
    // Assuming manageable size for now (<10k).
    const users = await this.userRepo.find({
      where: { companyId },
      relations: ['memberOf', 'userSpaces'], // Need groups and spaces for audience matching
    });

    let enrolledCount = 0;
    for (const user of users) {
      // Check if user matches
      if (this.matchesAudience(user, journey.targetAudience, journey.spaceId)) {
        // This helper handles checking if instance already exists
        await this.createInstanceIfNotExists(user.id, journey.id);
        enrolledCount++;
      }
    }

    this.logger.log(`Audience sync completed for journey ${journeyId}. Total potential enrollments checked: ${users.length}.`);
  }

  // Helper to check audience rules
  private matchesAudience(user: UserEntity, audience: any, journeySpaceId?: string): boolean {
    // 0. Check Space Membership
    if (journeySpaceId) {
      // If journey belongs to a space, user MUST be in that space (via UserSpaceEntity)
      // We assume user.userSpaces is loaded. If not, this might fail or be false negative.
      // Callers must ensure relations are loaded.
      const inSpace = user.userSpaces?.some((us) => us.spaceId === journeySpaceId);
      if (!inSpace) return false;
    }

    if (!audience) return true; // No rules = everyone (in the space if defined)

    // 1. Check Department
    if (audience.department) {
      if (user.department !== audience.department) return false;
    }

    // 2. Check Job Title
    if (audience.jobTitle) {
      if (user.jobTitle !== audience.jobTitle) return false;
    }

    // 3. Check Location
    if (audience.location) {
      if (user.location !== audience.location) return false;
    }

    // 4. Check Groups (by Name)
    if (audience.groups && Array.isArray(audience.groups) && audience.groups.length > 0) {
      if (!user.memberOf || user.memberOf.length === 0) return false;
      const userGroupNames = user.memberOf.map(g => g.name);
      // Check if user belongs to AT LEAST ONE of the target groups
      const hasMatch = audience.groups.some((targetGroup: string) => userGroupNames.includes(targetGroup));
      if (!hasMatch) return false;
    }

    return true;
  }

  // Manual trigger for testing/admin
  async checkJourneysForUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['memberOf', 'userSpaces'], // Load groups and spaces
    });
    if (!user) throw new NotFoundException('User not found');

    this.logger.log('Checking journeys for user ' + user.id + '(Groups: ' + user.memberOf?.map(g => g.name).join(', ') + ')');

    // Find active ONBOARDING journeys for this company
    const onboardingJourneys = await this.journeyRepo.find({
      where: {
        companyId: user.companyId,
        triggerType: JourneyTriggerType.ONBOARDING,
        active: true,
      },
    });

    const results = [];

    for (const journey of onboardingJourneys) {
      const match = this.matchesAudience(user, journey.targetAudience, journey.spaceId);
      this.logger.log('Journey ' + journey.title + ' (' + journey.id + ') match ? ' + match);

      if (match) {
        await this.createInstanceIfNotExists(user.id, journey.id);
        results.push({ journey: journey.title, status: 'ASSIGNED' });
      } else {
        results.push({ journey: journey.title, status: 'SKIPPED (Audience Mismatch)' });
      }
    }
    return results;
  }

  // ===== Core Logic =====

  private async createInstanceIfNotExists(userId: string, journeyId: string) {
    // Check for ANY instance (active or dropped/completed)
    const existing = await this.instanceRepo.findOne({
      where: { userId, journeyId },
    });

    if (existing) {
      if (
        existing.status === JourneyInstanceStatus.ACTIVE ||
        existing.status === JourneyInstanceStatus.COMPLETED
      ) {
        return;
      }

      // If DROPPED, check restart policy
      const journey = await this.journeyRepo.findOneBy({ id: journeyId });
      if (!journey) return;

      if (journey.restartPolicy === JourneyRestartPolicy.RESUME) {
        existing.status = JourneyInstanceStatus.ACTIVE;
        await this.instanceRepo.save(existing);
      } else {
        // RESTART
        existing.status = JourneyInstanceStatus.ACTIVE;
        existing.startDate = new Date();
        existing.currentStep = 0;
        existing.completedAt = null;
        await this.instanceRepo.save(existing);
        await this.completionRepo.delete({ instanceId: existing.id });
      }
      return;
    }

    const journey = await this.journeyRepo.findOneBy({ id: journeyId });
    if (!journey) return;

    // Determine Start Date
    let startDate = new Date();
    if (journey.triggerType === JourneyTriggerType.DATE_BASED && journey.startDate) {
      startDate = journey.startDate;
    }

    const instance = this.instanceRepo.create({
      userId,
      journeyId,
      companyId: journey.companyId,
      startDate: startDate,
      status: JourneyInstanceStatus.ACTIVE,
    });

    await this.instanceRepo.save(instance);
    this.logger.log(
      'Created journey instance ' + instance.id + ' for user ' + userId,
    );
  }

  async checkAndUnlockSteps() {
    // this.logger.log('Checking for steps to unlock...');

    // Find active instances
    const activeInstances = await this.instanceRepo.find({
      where: { status: JourneyInstanceStatus.ACTIVE },
      relations: ['journey', 'journey.steps'],
    });

    const now = new Date();

    for (const instance of activeInstances) {
      if (!instance.journey || !instance.journey.steps) continue;

      // Check Expiration
      if (instance.journey.endDate && instance.journey.endDate < now) {
        instance.status = JourneyInstanceStatus.DROPPED; // Or EXPIRED
        await this.instanceRepo.save(instance);
        continue;
      }

      // Check Start Date (for Date-Based)
      if (instance.startDate > now) continue; // Not started yet

      // Calculate Calendar Days Elapsed (Brazil Time)
      const startBrazil = this.toBrazilTime(instance.startDate);
      const nowBrazil = this.toBrazilTime(now);

      const startZero = new Date(startBrazil);
      startZero.setHours(0, 0, 0, 0);
      const nowZero = new Date(nowBrazil);
      nowZero.setHours(0, 0, 0, 0);

      const diffTime = nowZero.getTime() - startZero.getTime();
      const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const stepsToUnlock = instance.journey.steps.filter((step) => {
        if (step.delayDays !== daysElapsed) return false;

        // Check Release Time
        if (step.releaseTime) {
          const [hours, minutes] = step.releaseTime.split(':').map(Number);
          const releaseDate = new Date(nowBrazil);
          releaseDate.setHours(hours, minutes, 0, 0);
          if (nowBrazil < releaseDate) return false;
        }

        return true;
      });

      for (const step of stepsToUnlock) {
        // Check if notification already sent
        if (instance.notificationsSent.includes(step.id)) continue;

        // Add to sent list immediately to avoid duplicates
        instance.notificationsSent.push(step.id);
        await this.instanceRepo.save(instance);

        // Send Push Notification
        if (step.pushTitle && step.pushMessage) {
          try {
            await this.communicationsService.sendPush({
              companyId: instance.companyId,
              userIds: [instance.userId],
              title: step.pushTitle,
              body: step.pushMessage,
              kind: 'JOURNEY_STEP',
              entityId: step.id,
              data: {
                journeyId: instance.journeyId,
                stepId: step.id,
              },
            });
            this.logger.log('Push sent for step ' + step.id + ' to user ' + instance.userId);
          } catch (e) {
            this.logger.error('Failed to send push for step ' + step.id + ': ' + e.message);
          }
        }

        // Log availability
        this.logger.log('Step ' + step.id + ' is available for user ' + instance.userId);
      }
    }
  }

  private toBrazilTime(date: Date): Date {
    // Subtract 3 hours (in milliseconds)
    return new Date(date.getTime() - 3 * 60 * 60 * 1000);
  }

  async getStep(journeyId: string, stepId: string, userId?: string) {
    const step = await this.stepRepo.findOne({
      where: { id: stepId, journeyId },
    });
    if (!step) throw new NotFoundException('Step not found');

    let completed = false;
    if (userId) {
      const instance = await this.instanceRepo.findOne({
        where: { userId, journeyId, status: JourneyInstanceStatus.ACTIVE },
      });

      if (instance) {
        const completion = await this.completionRepo.findOne({
          where: { instanceId: instance.id, stepId },
        });
        completed = !!completion;
      }
    }

    return { ...step, completed };
  }

  async completeStep(userId: string, journeyId: string, stepId: string, data?: any) {
    // 1. Find Active Instance
    const instance = await this.instanceRepo.findOne({
      where: { userId, journeyId, status: JourneyInstanceStatus.ACTIVE },
      relations: ['journey', 'journey.steps'],
    });

    if (!instance) {
      throw new NotFoundException('Active journey instance not found');
    }

    // 2. Find Step
    const step = instance.journey.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new NotFoundException('Step not found in this journey');
    }

    // 3. Check if unlocked
    const now = new Date();
    // Optional: Check if journey started
    // if (instance.startDate > now) throw new ForbiddenException('Journey not started');

    // Calculate Calendar Days Elapsed (Brazil Time)
    const startBrazil = this.toBrazilTime(instance.startDate);
    const nowBrazil = this.toBrazilTime(now);

    const startZero = new Date(startBrazil);
    startZero.setHours(0, 0, 0, 0);
    const nowZero = new Date(nowBrazil);
    nowZero.setHours(0, 0, 0, 0);

    const diffTime = nowZero.getTime() - startZero.getTime();
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (step.delayDays > daysElapsed) {
      throw new ForbiddenException('Step is locked (days)');
    }

    // Check Release Time if it's the exact day
    if (step.delayDays === daysElapsed && step.releaseTime) {
      const [hours, minutes] = step.releaseTime.split(':').map(Number);
      const releaseDate = new Date(nowBrazil);
      releaseDate.setHours(hours, minutes, 0, 0);
      if (nowBrazil < releaseDate) {
        throw new ForbiddenException('Step is locked until ' + step.releaseTime);
      }
    }

    // 4. Check if already completed
    const existingCompletion = await this.completionRepo.findOne({
      where: { instanceId: instance.id, stepId },
    });

    if (existingCompletion) {
      return { message: 'Step already completed', points: 0 };
    }

    // 4.5. Quiz Validation & Scoring
    let quizScore = null;
    let quizPassed = true;
    if (step.contentType === 'QUIZ' && step.quizConfig) {
      const quizConfig = step.quizConfig;
      const userAnswers = data?.answers || [];

      if (!quizConfig.questions || quizConfig.questions.length === 0) {
        throw new BadRequestException('Quiz has no questions configured');
      }

      // Calculate weighted score
      let totalWeight = 0;
      let earnedWeight = 0;

      for (const question of quizConfig.questions) {
        totalWeight += question.weight || 1;

        // Find user's answer for this question
        const userAnswer = userAnswers.find((a: any) => a.questionId === question.id);
        if (!userAnswer) {
          // Question not answered - counts as wrong
          continue;
        }

        // Get correct options
        const correctOptionIds = question.options
          .filter((opt: any) => opt.isCorrect)
          .map((opt: any) => opt.id);

        // Check if user's answer is correct
        const selectedOptions = userAnswer.selectedOptions || [];

        if (question.type === 'SINGLE_CHOICE') {
          // For single choice, check if the one selected option is correct
          if (
            selectedOptions.length === 1 &&
            correctOptionIds.includes(selectedOptions[0])
          ) {
            earnedWeight += question.weight || 1;
          }
        } else if (question.type === 'MULTI_CHOICE') {
          // For multi choice, ALL correct options must be selected and NO incorrect ones
          const selectedSet = new Set(selectedOptions);
          const correctSet = new Set(correctOptionIds);

          const allCorrectSelected = correctOptionIds.every((id: string) =>
            selectedSet.has(id),
          );
          const noIncorrectSelected = selectedOptions.every((id: string) =>
            correctSet.has(id),
          );

          if (allCorrectSelected && noIncorrectSelected) {
            earnedWeight += question.weight || 1;
          }
        }
      }

      // Calculate percentage score
      quizScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
      const passingScore = quizConfig.passingScore || 70;

      if (quizScore < passingScore) {
        quizPassed = false;
        this.logger.log(
          `User ${userId} failed quiz ${stepId} with score ${quizScore}% (need ${passingScore}%)`,
        );
        throw new BadRequestException(
          `Quiz score ${quizScore}% is below passing score of ${passingScore}%`,
        );
      }

      this.logger.log(
        `User ${userId} passed quiz ${stepId} with score ${quizScore}% (need ${passingScore}%)`,
      );
    }

    // 5. Record Completion
    const completionData = data ? { ...data } : {};
    if (quizScore !== null) {
      completionData.quizScore = quizScore;
      completionData.quizPassed = quizPassed;
    }

    const completion = this.completionRepo.create({
      instanceId: instance.id,
      stepId,
      completedAt: new Date(),
      data: completionData,
    });
    await this.completionRepo.save(completion);

    // 6. Award XP (Gamification)
    await this.userRepo.increment({ id: instance.userId }, 'xp', 10);

    // 7. Emit Event for Gamification
    this.eventEmitter.emit('journey.step_completed', {
      userId: instance.userId,
      journeyId: instance.journeyId,
      stepId,
      gamificationId: instance.journey.gamificationId,
      timestamp: new Date(),
    });

    // 8. Update Progress
    const completedCount = await this.completionRepo.count({
      where: { instanceId: instance.id },
    });
    instance.currentStep = completedCount;

    // 9. Check Journey Completion
    const allSteps = instance.journey.steps;
    if (completedCount >= allSteps.length) {
      instance.status = JourneyInstanceStatus.COMPLETED;
      instance.completedAt = new Date();

      this.eventEmitter.emit('journey.completed', {
        userId: instance.userId,
        journeyId: instance.journeyId,
        timestamp: new Date(),
      });
    }

    await this.instanceRepo.save(instance);

    const responseData: any = { message: 'Step completed', points: 10 };
    if (quizScore !== null) {
      responseData.quizScore = quizScore;
      responseData.quizPassed = quizPassed;
    }

    return responseData;
  }

  // ===== CRUD & Progress =====

  async createForm(companyId: string, createdBy: string, dto: any) {
    // ... (Existing create logic adapted)
    // Note: The controller calls createForm, but here it was named 'create' in previous file.
    // I will stick to 'create' to match controller if it calls 'create'.
    // Wait, controller calls 'create' in previous file? 
    // Let's check controller. It calls 'create'.
    return this.create(dto);
  }

  async create(createJourneyDto: any) {
    const journey = this.journeyRepo.create(createJourneyDto);
    const saved = (await this.journeyRepo.save(journey) as unknown) as JourneyEntity;

    // If active on creation, sync audience immediately (async)
    if (saved.active) {
      this.eventEmitter.emit('journey.sync_audience', {
        journeyId: saved.id,
        companyId: saved.companyId,
      });
    }

    return saved;
  }

  async findAll(companyId: string, allowedSpaceIds?: string[]) {
    const qb = this.journeyRepo.createQueryBuilder('j');
    qb.where('j.companyId = :companyId', { companyId });

    if (allowedSpaceIds && allowedSpaceIds.length > 0) {
      // Filter by allowed spaces OR global journeys (spaceId is null)
      // If an admin is restricted to a space, they can usually see global journeys too?
      // Let's assume strict for now: Only see journeys in their allowed spaces.
      // If they need to see global, they should be CompanyAdmin.
      // Wait, if I am Space Admin, I might want to assign a Global Journey?
      // Let's stick to strict filtering for "Management" lists.
      qb.andWhere('j.spaceId IN (:...allowedSpaceIds)', { allowedSpaceIds });
    }

    return qb.getMany();
  }

  async findOne(id: string) {
    const journey = await this.journeyRepo.findOne({
      where: { id },
      relations: ['steps'],
      order: {
        steps: {
          orderIndex: 'ASC',
        },
      },
    });
    if (!journey) throw new NotFoundException('Journey ' + id + ' not found');
    return journey;
  }

  async update(id: string, updateJourneyDto: any) {
    const journey = await this.journeyRepo.findOne({
      where: { id },
      relations: ['steps'],
    });

    if (!journey) throw new NotFoundException('Journey ' + id + ' not found');

    // Update main fields
    Object.assign(journey, {
      title: updateJourneyDto.title,
      description: updateJourneyDto.description,
      triggerType: updateJourneyDto.triggerType,
      targetGroupId: updateJourneyDto.targetGroupId,
      targetAudience: updateJourneyDto.targetAudience,
      startDate: updateJourneyDto.startDate,
      endDate: updateJourneyDto.endDate,
      restartPolicy: updateJourneyDto.restartPolicy,
      active: updateJourneyDto.active,
      gamificationId: updateJourneyDto.gamificationId,
      isNr1: updateJourneyDto.isNr1,
    });



    const saved = await this.journeyRepo.save(journey);

    // If updated to active, trigger sync
    if (saved.active) {
      this.eventEmitter.emit('journey.sync_audience', {
        journeyId: saved.id,
        companyId: saved.companyId,
      });
    }

    // Sync Steps
    if (updateJourneyDto.steps) {
      const incomingSteps = updateJourneyDto.steps;
      const existingSteps = journey.steps;

      // 1. Delete steps not in incoming list
      const incomingIds = incomingSteps.filter((s: any) => s.id).map((s: any) => s.id);
      const stepsToDelete = existingSteps.filter(
        (s) => !incomingIds.includes(s.id),
      );
      if (stepsToDelete.length > 0) {
        await this.stepRepo.remove(stepsToDelete);
      }

      // 2. Create or Update steps
      let stepsAdded = false;

      // Check if the total number of steps increased or if we are adding new steps
      // A better way is to check if we are saving any step that wasn't in the existing steps list
      const existingStepIds = existingSteps.map(s => s.id);

      for (const stepDto of incomingSteps) {
        let existingStep = null;
        if (stepDto.id) {
          existingStep = existingSteps.find((s) => s.id === stepDto.id);
        }

        if (existingStep) {
          // Update
          Object.assign(existingStep, {
            title: stepDto.title,
            delayDays: stepDto.delayDays,
            releaseTime: stepDto.releaseTime,
            contentType: stepDto.contentType,
            mediaType: stepDto.mediaType,
            mediaUrl: stepDto.mediaUrl,
            videoConfig: stepDto.videoConfig,
            requireAck: stepDto.requireAck,
            formConfig: stepDto.formConfig,
            pollConfig: stepDto.pollConfig,
            quizConfig: stepDto.quizConfig,
            contentPayload: stepDto.contentPayload,
            orderIndex: stepDto.orderIndex,
            smartFields: stepDto.smartFields,
            pushTitle: stepDto.pushTitle,
            pushMessage: stepDto.pushMessage,
          });
          await this.stepRepo.save(existingStep);
        } else {
          // Create (either no ID or ID not found in DB)
          // If stepDto.id is present but not in existingSteps, it's effectively a new step for this journey
          // (e.g. if client generated UUID or if it's a copy)

          const newStep = this.stepRepo.create({
            ...stepDto,
            id: undefined, // Let DB generate ID to be safe, or use stepDto.id if we trust it
            formConfig: stepDto.formConfig,
            pollConfig: stepDto.pollConfig,
            journeyId: journey.id,
          });
          await this.stepRepo.save(newStep);
          stepsAdded = true;
        }
      }

      // Also check if we had incoming steps that were NOT in existing steps (by ID)
      // This covers the case where the client sends a new step WITH an ID that isn't in the DB yet
      // (though the logic above handles 'else' for not found in existingSteps)

      // If steps were added, reactivate COMPLETED instances
      if (stepsAdded) {
        this.logger.log('Steps added to journey ' + id + '. Reactivating COMPLETED instances.');
        await this.instanceRepo.update(
          { journeyId: id, status: JourneyInstanceStatus.COMPLETED },
          { status: JourneyInstanceStatus.ACTIVE }
        );
      }
    }

    return this.findOne(id);
  }

  async updateStepMedia(
    stepId: string,
    mediaUrl: string,
    thumbnailUrl?: string,
    metadata?: any,
    companyId?: string
  ) {
    const step = await this.stepRepo.findOne({
      where: { id: stepId },
      relations: ['journey', 'journey.company']
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    // Security: Validate companyId if provided
    if (companyId) {
      const expectedCompanyId = step.journey.company.id;

      if (companyId !== expectedCompanyId) {
        this.logger.error(
          `Company ID mismatch for step ${stepId}! Expected: ${expectedCompanyId}, Got: ${companyId}`
        );
        throw new ForbiddenException('Company ID mismatch - security violation');
      }

      // Additional validation: Extract companyId from Firebase Storage URL
      const urlCompanyId = this.extractCompanyIdFromUrl(mediaUrl);
      if (urlCompanyId && urlCompanyId !== expectedCompanyId) {
        this.logger.error(
          `URL company mismatch for step ${stepId}! Expected: ${expectedCompanyId}, URL contains: ${urlCompanyId}`
        );
        throw new ForbiddenException('Invalid video URL - company mismatch');
      }
    }

    step.mediaUrl = mediaUrl;

    step.videoConfig = {
      ...(step.videoConfig || {}),
      processed: true,
      processedAt: new Date(),
      metadata: metadata,
      thumbnailUrl: thumbnailUrl  // Store thumbnail in videoConfig
    };

    return this.stepRepo.save(step);
  }

  /**
   * Helper: Extract companyId from Firebase Storage URL
   * @param url Firebase Storage URL
   * @returns companyId or null
   */
  private extractCompanyIdFromUrl(url: string): string | null {
    try {
      // Decode URL to get path: /{companyId}/journeys/steps/...
      const decodedUrl = decodeURIComponent(url);

      // Match UUID pattern at start of path
      const match = decodedUrl.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/journeys\//i);

      return match ? match[1] : null;
    } catch (e) {
      this.logger.warn(`Failed to extract companyId from URL: ${url}`);
      return null;
    }
  }

  async getProgress(userId: string) {
    try {
      const instances = await this.instanceRepo.find({
        where: {
          userId,
          status: In([JourneyInstanceStatus.ACTIVE, JourneyInstanceStatus.COMPLETED])
        },
        relations: ['journey', 'journey.steps'],
      });

      const result = [];
      const now = new Date();

      for (const instance of instances) {
        // Safety check for missing journey
        if (!instance.journey) {
          this.logger.warn('Instance ' + instance.id + ' has no journey.Skipping.');
          continue;
        }

        // Filter out expired or not started
        if (instance.journey.endDate && instance.journey.endDate < now) {
          continue;
        }
        if (instance.startDate > now) {
          continue;
        }

        const completions = await this.completionRepo.find({
          where: { instanceId: instance.id },
        });
        const completionMap = new Set(completions.map((c) => c.stepId));

        // Calculate Calendar Days Elapsed (Brazil Time)
        const startBrazil = this.toBrazilTime(instance.startDate);
        const nowBrazil = this.toBrazilTime(now);

        const startZero = new Date(startBrazil);
        startZero.setHours(0, 0, 0, 0);
        const nowZero = new Date(nowBrazil);
        nowZero.setHours(0, 0, 0, 0);

        const diffTime = nowZero.getTime() - startZero.getTime();
        const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const steps = instance.journey.steps || []; // Handle null steps
        const stepsWithStatus = steps
          .map((step) => {
            let isLocked = step.delayDays > daysElapsed;

            // Check Release Time if it's the exact day
            if (!isLocked && step.delayDays === daysElapsed && step.releaseTime) {
              const [hours, minutes] = step.releaseTime.split(':').map(Number);
              const releaseDate = new Date(nowBrazil);
              releaseDate.setHours(hours, minutes, 0, 0);
              if (nowBrazil < releaseDate) {
                isLocked = true;
              }
            }

            return {
              ...step,
              completed: completionMap.has(step.id),
              locked: isLocked,
            };
          })
          .sort((a, b) => {
            // Sort DESCENDING (Future First)
            if (a.delayDays !== b.delayDays) {
              return b.delayDays - a.delayDays;
            }
            const timeA = a.releaseTime || '00:00';
            const timeB = b.releaseTime || '00:00';
            if (timeA !== timeB) {
              return timeB.localeCompare(timeA);
            }
            return b.orderIndex - a.orderIndex;
          });

        const totalSteps = steps.length;
        const completedSteps = completionMap.size;
        let progress = totalSteps > 0 ? completedSteps / totalSteps : 0;

        // Only force 100% if truly completed AND no new steps pending (though status should be ACTIVE if new steps exist)
        if (instance.status === JourneyInstanceStatus.COMPLETED && progress < 1) {
          // This handles legacy cases where it was marked completed but now has more steps.
          // Ideally, the update logic above fixes this, but for read-safety:
          // Let's NOT force it to 1 if there are uncompleted steps.
          // progress = 1; // REMOVED
        }

        result.push({
          ...instance,
          progress,
          journey: {
            ...instance.journey,
            steps: stepsWithStatus,
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error in getProgress for user ' + userId + ': ' + error.message, error.stack);
      throw error; // Re-throw to let Nest handle it, but now we have logs
    }
  }

  async remove(id: string) {
    // 1. Find instances to get IDs
    const instances = await this.instanceRepo.find({ where: { journeyId: id } });
    const instanceIds = instances.map(i => i.id);

    // 2. Delete completions for these instances
    if (instanceIds.length > 0) {
      await this.completionRepo.delete({ instanceId: In(instanceIds) });
      // 3. Delete instances
      await this.instanceRepo.delete({ journeyId: id });
    }

    // 4. Delete steps
    await this.stepRepo.delete({ journeyId: id });

    // 5. Delete journey
    return this.journeyRepo.delete(id);
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);

    // 1. Create New Journey (Exclude ID and Steps to prevent reference issues)
    const { id: _id, steps: _steps, createdAt: _c, updatedAt: _u, ...journeyData } = original;

    const newJourney = this.journeyRepo.create({
      ...journeyData,
      title: original.title + ' (Copy)',
      active: false,
    });

    const savedJourney = await this.journeyRepo.save(newJourney);

    // 2. Duplicate Steps
    if (original.steps && original.steps.length > 0) {
      const newSteps = original.steps.map((step) => {
        const { id: _sid, journeyId: _jid, createdAt: _sc, updatedAt: _su, ...stepData } = step;
        return this.stepRepo.create({
          ...stepData,
          journeyId: savedJourney.id,
        });
      });
      await this.stepRepo.save(newSteps);
    }

    return this.findOne(savedJourney.id);
  }

  // ===== Analytics =====

  async getJourneyStats(journeyId: string) {
    const totalEnrolled = await this.instanceRepo.count({ where: { journeyId } });
    const active = await this.instanceRepo.count({ where: { journeyId, status: JourneyInstanceStatus.ACTIVE } });
    const completed = await this.instanceRepo.count({ where: { journeyId, status: JourneyInstanceStatus.COMPLETED } });
    const dropped = await this.instanceRepo.count({ where: { journeyId, status: JourneyInstanceStatus.DROPPED } });

    // Started: Users with at least 1 step completed OR status is COMPLETED
    const started = await this.instanceRepo.createQueryBuilder('i')
      .where('i.journeyId = :journeyId', { journeyId })
      .andWhere('(i.currentStep > 0 OR i.status = :completedStatus)', { completedStatus: JourneyInstanceStatus.COMPLETED })
      .getCount();

    // Avg Completion Time (only for completed)
    const completedInstances = await this.instanceRepo.find({
      where: { journeyId, status: JourneyInstanceStatus.COMPLETED },
      select: ['startDate', 'completedAt'],
    });

    let avgCompletionTime = 'N/A';
    if (completedInstances.length > 0) {
      const totalTimeMs = completedInstances.reduce((acc, curr) => {
        if (curr.completedAt && curr.startDate) {
          return acc + (curr.completedAt.getTime() - curr.startDate.getTime());
        }
        return acc;
      }, 0);
      const avgMs = totalTimeMs / completedInstances.length;
      const avgDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
      avgCompletionTime = avgDays + ' days';
    }

    return {
      totalEnrolled,
      started,
      active,
      completed,
      dropped,
      avgCompletionTime,
    };
  }

  async getGeneralStats() {
    const totalActiveJourneys = await this.journeyRepo.count({ where: { active: true } });

    // Total Users Impacted (Sum of enrolled users across all journeys)
    const totalImpactedUsers = await this.instanceRepo.count();

    // Total Completions
    const totalCompletions = await this.instanceRepo.count({ where: { status: JourneyInstanceStatus.COMPLETED } });

    return {
      totalActiveJourneys,
      totalImpactedUsers,
      totalCompletions,
    };
  }

  async getStepStats(journeyId: string) {
    const journey = await this.findOne(journeyId);
    if (!journey || !journey.steps) return [];

    const totalEnrolled = await this.instanceRepo.count({ where: { journeyId } });
    if (totalEnrolled === 0) {
      return journey.steps.map(s => ({
        id: s.id,
        title: s.title,
        type: s.contentType,
        completionRate: '0%',
        avgTime: 'N/A',
        contentStats: null,
      }));
    }

    const stats = [];
    for (const step of journey.steps) {
      const completions = await this.completionRepo.count({ where: { stepId: step.id } });
      const rate = Math.round((completions / totalEnrolled) * 100);

      let contentStats = null;

      // Video Stats (Views = Completions)
      if (step.contentType === 'VIDEO' || step.mediaType === 'VIDEO') {
        contentStats = {
          type: 'VIDEO',
          views: completions,
        };
      }

      // Form Stats (Inline only now)
      if (step.contentType === 'FORM' && step.formConfig) {
        const submissionCount = await this.completionRepo.count({ where: { stepId: step.id } });
        contentStats = {
          type: 'FORM',
          submissions: submissionCount,
        };
      }

      // Poll Stats (Inline only now)
      if (step.contentType === 'POLL' && step.pollConfig) {
        const responseCount = await this.completionRepo.count({ where: { stepId: step.id } });
        contentStats = {
          type: 'POLL',
          votes: responseCount,
        };
      }

      stats.push({
        id: step.id,
        title: step.title,
        type: step.contentType,
        completionRate: rate + '% ',
        avgTime: 'N/A',
        contentStats,
      });
    }
    return stats;
  }

  async getUserProgress(journeyId: string) {
    const instances = await this.instanceRepo.find({
      where: { journeyId },
      relations: ['user', 'journey', 'journey.steps'],
      order: { updatedAt: 'DESC' },
    });

    return instances.map(i => {
      const totalSteps = i.journey?.steps?.length || 0;
      const progress = totalSteps > 0 ? Math.round((i.currentStep / totalSteps) * 100) : 0;

      // Find current step title
      let currentStepTitle = 'Completed';
      if (i.status !== JourneyInstanceStatus.COMPLETED && i.journey?.steps) {
        // Sort steps to find the one at currentStep index
        const sortedSteps = i.journey.steps.sort((a, b) => a.orderIndex - b.orderIndex);
        const step = sortedSteps[i.currentStep] || sortedSteps[sortedSteps.length - 1];
        currentStepTitle = step ? step.title : 'Unknown';
      }

      return {
        id: i.userId,
        name: i.user?.name || i.user?.email || 'Unknown User',
        status: i.status,
        currentStep: i.status === JourneyInstanceStatus.COMPLETED ? 'All' : currentStepTitle,
        progress: progress + '% ',
        lastActive: i.updatedAt.toISOString().split('T')[0],
      };
    });
  }

  async getStepAnalytics(journeyId: string, stepId: string) {
    const step = await this.stepRepo.findOne({ where: { id: stepId, journeyId } });
    if (!step) throw new NotFoundException('Step not found');

    const completions = await this.completionRepo.find({
      where: { stepId },
    });

    const totalSubmissions = completions.length;
    const result = {
      type: step.contentType,
      totalSubmissions,
      questions: [] as any[],
    };

    if (step.contentType === 'POLL' && step.pollConfig) {
      // Aggregate Poll
      const options = step.pollConfig.options || [];
      const votes: Record<string, number> = {};

      // Initialize votes
      options.forEach((opt: any) => votes[opt.id] = 0);

      completions.forEach(c => {
        const answer = c.data?.answer; // Assuming { answer: optionId }
        if (answer && votes[answer] !== undefined) {
          votes[answer]++;
        }
      });

      result.questions.push({
        id: 'poll',
        label: step.pollConfig.question,
        type: 'choice',
        answers: Object.entries(votes).map(([id, count]) => {
          const opt = options.find((o: any) => o.id === id);
          return {
            label: opt ? opt.text : id,
            count,
            percentage: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0
          };
        })
      });
    } else if (step.contentType === 'FORM' && step.formConfig) {
      // Aggregate Form
      const fields = step.formConfig.fields || [];

      fields.forEach((field: any) => {
        const qStats = {
          id: field.id,
          label: field.label,
          type: field.type,
          answers: [] as any[],
          textAnswers: [] as string[],
        };

        if (['text', 'textarea', 'short_text', 'long_text', 'email', 'number', 'date', 'time', 'file'].includes(field.type)) {
          // List answers
          qStats.textAnswers = completions
            .map(c => {
              const val = c.data?.[field.id];
              if (field.type === 'file' && val) {
                if (Array.isArray(val)) return val.map(f => f.name || 'File').join(', ');
                return val.name || 'File';
              }
              return val;
            })
            .filter(val => val !== undefined && val !== null && val !== '')
            .slice(0, 50); // Limit to 50
        } else if (['select', 'radio', 'checkbox'].includes(field.type)) {
          // Count answers
          const counts: Record<string, number> = {};
          const options = field.options || [];

          completions.forEach(c => {
            const val = c.data?.[field.id];
            if (Array.isArray(val)) {
              val.forEach(v => counts[v] = (counts[v] || 0) + 1);
            } else if (val) {
              counts[val] = (counts[val] || 0) + 1;
            }
          });

          qStats.answers = Object.entries(counts).map(([optVal, count]) => {
            // Try to find label if options exist (for select/radio)
            // If options are strings, optVal is the label. If objects, we need to match value.
            let label = optVal;
            if (options.length > 0 && typeof options[0] === 'object') {
              const found = options.find((o: any) => o.value === optVal);
              if (found) label = found.label;
            }

            return {
              label,
              count,
              percentage: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0
            };
          });
        }

        result.questions.push(qStats);
      });
    }

    return result;
  }

  async getStepSubmissions(journeyId: string, stepId: string) {
    const step = await this.stepRepo.findOne({ where: { id: stepId, journeyId } });
    if (!step) throw new NotFoundException('Step not found');

    const completions = await this.completionRepo.find({
      where: { stepId },
      relations: ['instance', 'instance.user'],
      order: { completedAt: 'DESC' },
    });

    // Check if this is a quiz step to include quiz-specific data
    const isQuiz = step?.contentType === 'QUIZ';

    const signedCompletions = await Promise.all(completions.map(async c => {
      const data = { ...c.data };
      if (data) {
        for (const key of Object.keys(data)) {
          const val = data[key];
          if (typeof val === 'object' && val !== null && (val.storagePath || val.path)) {
            try {
              const storagePath = val.storagePath || val.path;
              const bucket = getStorage(this.firebaseApp).bucket();
              const file = bucket.file(storagePath);
              const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60, // 1 hour
              });
              data[key] = { ...val, url };
            } catch (e) {
              console.error('[getStepSubmissions] Error signing URL for path:', val.storagePath || val.path, e);
            }
          } else if (Array.isArray(val)) {
            const newArr = await Promise.all(val.map(async (item: any) => {
              if (typeof item === 'object' && item !== null && (item.storagePath || item.path)) {
                try {
                  const storagePath = item.storagePath || item.path;
                  const bucket = getStorage(this.firebaseApp).bucket();
                  const file = bucket.file(storagePath);
                  const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 1000 * 60 * 60,
                  });
                  return { ...item, url };
                } catch (e) {
                  console.error('[getStepSubmissions] Error signing URL for array item:', item.storagePath || item.path, e);
                  return item;
                }
              }
              return item;
            }));
            data[key] = newArr;
          }
        }
      }

      return {
        id: c.id,
        userId: c.instance?.userId,
        userName: c.instance?.user?.name || c.instance?.user?.email || 'Unknown User',
        userEmail: c.instance?.user?.email,
        completedAt: c.completedAt,
        data,
        // Quiz-specific fields
        ...(isQuiz && {
          quizScore: c.data?.quizScore,
          quizPassed: c.data?.quizPassed,
          answers: c.data?.answers,
        }),
      };
    }));

    return signedCompletions;
  }

  async getQuizResults(journeyId: string, stepId: string) {
    // Verify step is a quiz
    const step = await this.stepRepo.findOne({
      where: { id: stepId, journeyId },
      relations: ['journey']
    });

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    if (step.contentType !== 'QUIZ') {
      throw new BadRequestException('This step is not a quiz');
    }

    // Get all submissions
    const submissions = await this.getStepSubmissions(journeyId, stepId);

    // Calculate summary statistics
    const totalAttempts = submissions.length;
    const passedCount = submissions.filter((s) => s.quizPassed).length;
    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

    const scores = submissions.map((s) => s.quizScore || 0);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      step: {
        id: step.id,
        title: step.title,
        passingScore: step.quizConfig?.passingScore || 70,
        totalQuestions: step.quizConfig?.questions?.length || 0,
      },
      summary: {
        totalAttempts,
        passedCount,
        failedCount: totalAttempts - passedCount,
        passRate,
        averageScore,
      },
      submissions: submissions.map((s) => ({
        userId: s.userId,
        userName: s.userName,
        userEmail: s.userEmail,
        score: s.quizScore,
        passed: s.quizPassed,
        completedAt: s.completedAt,
      })),
    };
  }

  async exportStepSubmissions(journeyId: string, stepId: string, res: any) {
    const submissions = await this.getStepSubmissions(journeyId, stepId);
    const step = await this.stepRepo.findOne({ where: { id: stepId } });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Submissions');

    // Headers
    const headers = ['User', 'Date'];
    const fieldMap = new Map<string, string>();
    (step?.formConfig?.fields || []).forEach((f: any) => {
      headers.push(f.label);
      fieldMap.set(f.id, f.label);
    });
    worksheet.addRow(headers);

    // Rows
    submissions.forEach(sub => {
      const row = [sub.userName, sub.completedAt.toISOString()];
      (step?.formConfig?.fields || []).forEach((f: any) => {
        let val = sub.data?.[f.id];
        if (typeof val === 'object' && val !== null) {
          if (val.url) val = val.url; // Use signed URL for export if available
          else if (val.name) val = val.name;
          else val = JSON.stringify(val);
        }
        row.push(val);
      });
      worksheet.addRow(row);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename = submissions_' + stepId + '.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  async downloadStepAttachments(journeyId: string, stepId: string, res: any) {
    console.log(`[downloadStepAttachments] Starting for journey=${journeyId}, step=${stepId}`);
    const submissions = await this.getStepSubmissions(journeyId, stepId);
    console.log(`[downloadStepAttachments] Found ${submissions.length} submissions`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename = attachments_' + stepId + '.zip');

    archive.pipe(res);

    let fileCount = 0;

    for (const sub of submissions) {
      if (!sub.data) continue;
      for (const key of Object.keys(sub.data)) {
        const val = sub.data[key];
        const processFile = async (item: any) => {
          if (typeof item === 'object' && item !== null && (item.storagePath || item.path)) {
            try {
              const storagePath = item.storagePath || item.path;
              console.log(`[downloadStepAttachments] Processing file: ${storagePath}`);

              const bucket = getStorage(this.firebaseApp).bucket();
              const file = bucket.file(storagePath);

              const [exists] = await file.exists();
              if (!exists) {
                console.warn(`[downloadStepAttachments] File does not exist: ${storagePath}`);
                return;
              }

              const [buffer] = await file.download();
              const ext = storagePath.split('.').pop();
              // Filename is already standardized by mobile app, but we can ensure uniqueness
              const filename = item.name || item.originalName || sub.userName + '_' + key + '.' + ext;
              archive.append(buffer, { name: filename });
              fileCount++;
            } catch (e) {
              console.error('Error downloading file for zip', e);
            }
          }
        };

        if (Array.isArray(val)) {
          for (const item of val) await processFile(item);
        } else {
          await processFile(val);
        }
      }
    }

    console.log(`[downloadStepAttachments] Finalizing archive with ${fileCount} files`);
    await archive.finalize();
  }

  async getStepAnalyticsStats(journeyId: string, stepId: string) {
    const step = await this.stepRepo.findOne({ where: { id: stepId, journeyId } });
    if (!step) throw new NotFoundException('Step not found');

    const completions = await this.completionRepo.find({
      where: { stepId },
      relations: ['instance', 'instance.user'],
      order: { completedAt: 'ASC' },
    });

    const totalSubmissions = completions.length;
    const uniqueUsers = new Set(completions.map(c => c.instance?.userId)).size;

    // Series (Activity over time)
    const activityMap = new Map<string, number>();
    completions.forEach(c => {
      const date = c.completedAt.toISOString().split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });
    const activitySeries = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, submissions: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Heatmap (Day of week x Hour)
    const heatmapMap = new Map<string, number>();
    completions.forEach(c => {
      const d = c.completedAt;
      const key = d.getDay() + '-' + d.getHours();
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    });
    const heatmap = Array.from(heatmapMap.entries()).map(([key, count]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, count };
    });

    // Word Cloud (Global)
    const textFields = (step.formConfig?.fields || [])
      .filter((f: any) => ['text', 'textarea', 'long_text', 'short_text'].includes(f.type))
      .map((f: any) => f.id);

    const allText = completions
      .flatMap(c => textFields.map((fid: string) => c.data?.[fid]))
      .filter(t => typeof t === 'string' && t.length > 0)
      .join(' ');

    // Simple word frequency (mocking a proper NLP library for now)
    const words: string[] = allText.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 3) wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
    const topWords = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    return {
      form: { title: step.title, defaultLocale: 'pt-BR' }, // Mocking form structure
      kpis: {
        submissions: totalSubmissions,
        uniqueUsers,
        totalQuestions: step.formConfig?.fields?.length || 0,
        firstResponseMsP50: 0, // Placeholder
        pendingForRh: 0,
        rhReplies: 0,
      },
      series: { activity: activitySeries, rh: [], notifications: [] },
      heatmap,
      globalWordCloud: { topWords, bigrams: [], trigrams: [] },
      segments: { byAudience: [], bySpace: [], byGroup: [] }, // Placeholder
      reminders: [],
    };
  }

  async getStepAnalyticsFields(journeyId: string, stepId: string) {
    const step = await this.stepRepo.findOne({ where: { id: stepId, journeyId } });
    if (!step) throw new NotFoundException('Step not found');

    const completions = await this.completionRepo.find({ where: { stepId } });
    const fields = step.formConfig?.fields || [];

    return fields.map((field: any) => {
      const stats: any = {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        metrics: { total: completions.length },
      };

      if (['select', 'radio', 'checkbox', 'single_choice', 'multi_choice'].includes(field.type)) {
        const counts: Record<string, number> = {};
        completions.forEach(c => {
          const val = c.data?.[field.id];
          if (Array.isArray(val)) val.forEach(v => counts[v] = (counts[v] || 0) + 1);
          else if (val) counts[val] = (counts[val] || 0) + 1;
        });

        stats.distribution = {
          choices: Object.entries(counts).map(([value, count]) => {
            // Try to find label
            const opt = field.options?.find((o: any) => o.value === value || o.id === value);
            return { value: opt ? opt.label || opt.text : value, count };
          })
        };
      }

      return stats;
    });
  }

  async getDashboardStats(companyId: string) {
    const activeJourneys = await this.journeyRepo.count({ where: { companyId, active: true } });
    const totalInstances = await this.instanceRepo.count({ where: { companyId } });
    const completedInstances = await this.instanceRepo.count({ where: { companyId, status: JourneyInstanceStatus.COMPLETED } });

    // Started instances (currentStep > 0)
    const startedInstances = await this.instanceRepo.count({
      where: { companyId, currentStep: MoreThan(0) as any }
    });

    // 1. Calculate Advancing vs Behind and Avg Completion
    // We need to fetch instances and their journeys to know the expected step
    const instances = await this.instanceRepo.find({
      where: { companyId, status: JourneyInstanceStatus.ACTIVE },
      relations: ['journey', 'journey.steps']
    });

    let advancing = 0;
    let behind = 0;
    let totalProgressPercent = 0;
    const now = new Date();

    for (const instance of instances) {
      if (!instance.journey || !instance.journey.steps) continue;

      const totalSteps = instance.journey.steps.length;
      if (totalSteps === 0) continue;

      // Completion Percent for this instance
      totalProgressPercent += (instance.currentStep / totalSteps);

      // Expected steps based on delayDays
      const daysElapsed = Math.floor((now.getTime() - instance.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const expectedSteps = instance.journey.steps.filter(s => s.delayDays <= daysElapsed).length;

      if (instance.currentStep >= expectedSteps) {
        advancing++;
      } else {
        behind++;
      }
    }

    const avgCompletionPercent = totalInstances > 0
      ? Math.round((totalProgressPercent / totalInstances) * 100)
      : 0;

    // 2. Average Video Views
    // Count completions where step is VIDEO
    const videoCompletions = await this.completionRepo.createQueryBuilder('c')
      .innerJoin('c.step', 's')
      .innerJoin('s.journey', 'j')
      .where('j.companyId = :companyId', { companyId })
      .andWhere('s.contentType = :type', { type: StepContentType.VIDEO })
      .getCount();

    const avgVideoViews = startedInstances > 0
      ? Number((videoCompletions / startedInstances).toFixed(1))
      : 0;

    // 3. Top 5 Journeys
    const topJourneysRaw = await this.instanceRepo.createQueryBuilder('i')
      .select('i.journeyId', 'journeyId')
      .addSelect('COUNT(i.id)', 'count')
      .where('i.companyId = :companyId', { companyId })
      .groupBy('i.journeyId')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const topJourneys = await Promise.all(topJourneysRaw.map(async (r) => {
      const journey = await this.journeyRepo.findOneBy({ id: r.journeyId });
      return {
        id: r.journeyId,
        title: journey ? journey.title : 'Unknown',
        enrollments: Number(r.count)
      };
    }));

    return {
      activeJourneys,
      totalInstances,
      startedInstances,
      completedInstances,
      advancing,
      behind,
      avgCompletionPercent,
      avgVideoViews,
      topJourneys
    };
  }
}
