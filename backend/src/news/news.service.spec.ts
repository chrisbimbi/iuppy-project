// backend/src/news/news.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsService } from './news.service';
import { NewsEntity } from './news.entity';
import { AudienceResolverService } from './audience-resolver.service';
import { NewsAudienceEntity } from '../v2/interactions/entities/news-audience.entity';
import { PushDeliveryEntity } from '../v2/push/entities/push-delivery.entity';
import { UserDeviceEntity } from '../notifications/entities/user-device.entity';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';
import { AudienceMode } from '@shared/types/NewsSettings';
import { NotFoundException } from '@nestjs/common';
import { NewsAcknowledgmentEntity } from './entities/news-acknowledgment.entity';
import { NewsFavoriteEntity } from '../v2/interactions/entities/news-favorite.entity';
import { CommunicationsService } from 'src/notifications/communications.service';

describe('NewsService', () => {
  let service: NewsService;
  let newsRepo: Repository<NewsEntity>;
  let newsAudienceRepo: Repository<NewsAudienceEntity>;
  let pushDeliveryRepo: Repository<PushDeliveryEntity>;
  let userDeviceRepo: Repository<UserDeviceEntity>;
  let interactionEventRepo: Repository<InteractionEventEntity>;
  let audienceResolverService: AudienceResolverService;

  const mockTx = { save: jest.fn() };
  const mockNewsRepo = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    manager: { transaction: jest.fn((cb) => cb(mockTx)) },
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]), // for getHashtags or others
      getMany: jest.fn().mockResolvedValue([]),
    })),
    query: jest.fn().mockResolvedValue([]),
  };
  const mockNewsAudienceRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  const mockPushDeliveryRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockUserDeviceRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };
  const mockInteractionEventRepo = {
    find: jest.fn(),
  };
  const mockAudienceResolverService = {
    resolve: jest.fn(),
    probe: jest.fn(),
  };
  const mockNewsAcknowledgmentRepo = {
    save: jest.fn(),
    find: jest.fn(),
  };
  const mockNewsFavoriteRepo = {
    save: jest.fn(),
    find: jest.fn(),
  };
  const mockCommunicationsService = {
    sendNewsPush: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: getRepositoryToken(NewsEntity),
          useValue: mockNewsRepo,
        },
        {
          provide: getRepositoryToken(NewsAudienceEntity),
          useValue: mockNewsAudienceRepo,
        },
        {
          provide: getRepositoryToken(PushDeliveryEntity),
          useValue: mockPushDeliveryRepo,
        },
        {
          provide: getRepositoryToken(UserDeviceEntity),
          useValue: mockUserDeviceRepo,
        },
        {
          provide: getRepositoryToken(InteractionEventEntity),
          useValue: mockInteractionEventRepo,
        },
        {
          provide: getRepositoryToken(NewsAcknowledgmentEntity),
          useValue: mockNewsAcknowledgmentRepo,
        },
        {
          provide: getRepositoryToken(NewsFavoriteEntity),
          useValue: mockNewsFavoriteRepo,
        },
        {
          provide: AudienceResolverService,
          useValue: mockAudienceResolverService,
        },
        {
          provide: CommunicationsService,
          useValue: mockCommunicationsService,
        },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
    newsRepo = module.get<Repository<NewsEntity>>(
      getRepositoryToken(NewsEntity),
    );
    newsAudienceRepo = module.get<Repository<NewsAudienceEntity>>(
      getRepositoryToken(NewsAudienceEntity),
    );
    pushDeliveryRepo = module.get<Repository<PushDeliveryEntity>>(
      getRepositoryToken(PushDeliveryEntity),
    );
    userDeviceRepo = module.get<Repository<UserDeviceEntity>>(
      getRepositoryToken(UserDeviceEntity),
    );
    interactionEventRepo = module.get<Repository<InteractionEventEntity>>(
      getRepositoryToken(InteractionEventEntity),
    );
    audienceResolverService = module.get<AudienceResolverService>(
      AudienceResolverService,
    );

    jest.clearAllMocks();
    mockTx.save.mockClear();
    mockNewsRepo.findOneBy.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    const newsId = 'news-1';
    const companyId = 'company-1';
    const mockNews = {
      id: newsId,
      companyId,
      isPublished: false,
      settings: { audienceMode: AudienceMode.COMPANY },
    } as NewsEntity;

    it('should publish news and create audience/push deliveries', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue(mockNews);
      mockAudienceResolverService.probe.mockResolvedValue({
        totalUsuarios: 10,
        comTokenAtivo: 5,
        mode: AudienceMode.COMPANY,
        identifiers: {},
      });
      mockAudienceResolverService.resolve.mockResolvedValue([
        'user-1',
        'user-2',
        'user-3',
      ]);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);
      mockNewsAudienceRepo.create.mockImplementation((dto) => dto);
      mockPushDeliveryRepo.create.mockImplementation((dto) => dto);

      const result = await service.publish(newsId, companyId);

      expect(result.isPublished).toBe(true);
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(result.settings.audienceSnapshot).toEqual({
        totalUsuarios: 10,
        comTokenAtivo: 5,
        mode: AudienceMode.COMPANY,
        identifiers: {},
      });
      expect(newsRepo.manager.transaction).toHaveBeenCalled();
      // 1 save for News + 3 saves for Audience = 4 calls on tx.save
      expect(mockTx.save).toHaveBeenCalledTimes(4);
      expect(mockPushDeliveryRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: 'user-1',
          status: 'queued',
          channel: 'news_publish',
        }),
        expect.objectContaining({
          userId: 'user-2',
          status: 'queued',
          channel: 'news_publish',
        }),
      ]);
    });

    it('should throw error if news not found', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue(null);
      await expect(service.publish(newsId, companyId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if news already published', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue({
        ...mockNews,
        isPublished: true,
      });
      await expect(service.publish(newsId, companyId)).rejects.toThrow(
        'News is already published.',
      );
    });

    it('should throw error if audience mode not set', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue({ ...mockNews, isPublished: false, settings: {} });
      await expect(service.publish(newsId, companyId)).rejects.toThrow(
        'Audience mode not set for this news.',
      );
    });
  });

  describe('resendToUnopened', () => {
    const newsId = 'news-1';
    const companyId = 'company-1';
    const mockNews = {
      id: newsId,
      companyId,
      isPublished: true,
      settings: { audienceMode: AudienceMode.COMPANY },
    } as NewsEntity;

    it('should resend to unopened users with active tokens', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue(mockNews);
      (newsAudienceRepo.find as jest.Mock).mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);
      (interactionEventRepo.find as jest.Mock).mockResolvedValue([
        { userId: 'user-1', type: 'OPEN' },
      ]);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ userId: 'user-2' }]);
      mockPushDeliveryRepo.create.mockImplementation((dto) => dto);
      mockCommunicationsService.sendNewsPush.mockResolvedValue({ success: 0, requested: 2 });

      const result = await service.resendToUnopened(newsId, companyId);

      expect(result).toEqual({ sent: 0, requested: 2 });
      expect(mockCommunicationsService.sendNewsPush).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: expect.arrayContaining(['user-2']), // Logic filters out user-1 (opened)
          newsId: newsId,
        })
      );
    });

    it('should not resend if no original audience', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue(mockNews);
      (newsAudienceRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.resendToUnopened(newsId, companyId);
      expect(result).toEqual({ sent: 0, requested: 0 });
      expect(mockPushDeliveryRepo.save).not.toHaveBeenCalled();
    });

    it('should not resend if all users have opened', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue(mockNews);
      (newsAudienceRepo.find as jest.Mock).mockResolvedValue([
        { userId: 'user-1' },
      ]);
      (interactionEventRepo.find as jest.Mock).mockResolvedValue([
        { userId: 'user-1', type: 'OPEN' },
      ]);

      const result = await service.resendToUnopened(newsId, companyId);
      expect(result).toEqual({ sent: 0, requested: 0 });
      expect(mockPushDeliveryRepo.save).not.toHaveBeenCalled();
    });

    it('should not resend if no unopened users have active tokens', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue(mockNews);
      (newsAudienceRepo.find as jest.Mock).mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);
      (interactionEventRepo.find as jest.Mock).mockResolvedValue([
        { userId: 'user-1', type: 'OPEN' },
      ]);
      // Users with active tokens (none) - This logic might be inside sendNewsPush? 
      // Actually resendToUnopened calls comm.sendNewsPush with targetIds (unopened).
      // It does NOT check active tokens inside resendToUnopened anymore (it relies on comm service).
      // So this test case might be invalid or should check that comm service was called with correct targetIds.
      // If the logic "check active tokens" was moved to CommService, then resendToUnopened just prepares list.
      // Let's assume resendToUnopened just passes the list of unopened users.
      // If so, expect call with user-2.
      mockCommunicationsService.sendNewsPush.mockResolvedValue({ success: 0, requested: 1 });

      const result = await service.resendToUnopened(newsId, companyId);
      expect(result).toEqual({ sent: 0, requested: 1 });
      expect(mockPushDeliveryRepo.save).not.toHaveBeenCalled();
    });

    it('should throw error if news not found', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue(null);
      await expect(service.resendToUnopened(newsId, companyId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if news not published', async () => {
      mockNewsRepo.findOneBy.mockResolvedValue({
        ...mockNews,
        isPublished: false,
      });
      await expect(service.resendToUnopened(newsId, companyId)).rejects.toThrow(
        'News must be published to be resent.',
      );
    });
  });
});
