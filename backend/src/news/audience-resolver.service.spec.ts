import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudienceResolverService } from './audience-resolver.service';
import { UserDeviceEntity } from '../notifications/entities/user-device.entity';
import { CompanyEntity } from '../companies/company.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { Channel } from '../channels/channel.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import { AudienceMode } from '@shared/types/NewsSettings';

describe('AudienceResolverService', () => {
  let service: AudienceResolverService;
  let userDeviceRepo: Repository<UserDeviceEntity>;
  let companyRepo: Repository<CompanyEntity>;
  let spaceRepo: Repository<SpaceEntity>;
  let channelRepo: Repository<Channel>;
  let groupRepo: Repository<GroupEntity>;
  let userRepo: Repository<UserEntity>;

  const mockUserDeviceRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };
  const mockCompanyRepo = {};
  const mockSpaceRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
  };
  const mockChannelRepo = {
    find: jest.fn().mockResolvedValue([]),
  };
  const mockGroupRepo = {
    find: jest.fn().mockResolvedValue([]),
  };
  const mockUserRepo = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudienceResolverService,
        {
          provide: getRepositoryToken(UserDeviceEntity),
          useValue: mockUserDeviceRepo,
        },
        {
          provide: getRepositoryToken(CompanyEntity),
          useValue: mockCompanyRepo,
        },
        {
          provide: getRepositoryToken(SpaceEntity),
          useValue: mockSpaceRepo,
        },
        {
          provide: getRepositoryToken(Channel),
          useValue: mockChannelRepo,
        },
        {
          provide: getRepositoryToken(GroupEntity),
          useValue: mockGroupRepo,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<AudienceResolverService>(AudienceResolverService);
    userDeviceRepo = module.get<Repository<UserDeviceEntity>>(
      getRepositoryToken(UserDeviceEntity),
    );
    companyRepo = module.get<Repository<CompanyEntity>>(
      getRepositoryToken(CompanyEntity),
    );
    spaceRepo = module.get<Repository<SpaceEntity>>(
      getRepositoryToken(SpaceEntity),
    );
    channelRepo = module.get<Repository<Channel>>(getRepositoryToken(Channel));
    groupRepo = module.get<Repository<GroupEntity>>(
      getRepositoryToken(GroupEntity),
    );
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolve', () => {
    const companyId = 'company-1';

    it('should resolve for COMPANY mode', async () => {
      mockUserRepo.find.mockResolvedValueOnce([
        { id: 'user-1' },
        { id: 'user-2' },
      ]);
      const result = await service.resolve(companyId, AudienceMode.COMPANY, {});
      expect(result).toEqual(['user-1', 'user-2']);
      expect(mockUserRepo.find).toHaveBeenCalledWith({
        where: { companyId, isActive: true },
        select: ['id'],
      });
    });

    it('should resolve for SPACE mode', async () => {
      const spaceId = 'space-1';
      mockSpaceRepo.findOne.mockResolvedValueOnce({
        id: spaceId,
        companyId,
        targetGroupIds: ['group-1'],
      });
      mockGroupRepo.find.mockResolvedValueOnce([
        { id: 'group-1', members: [{ id: 'user-3' }, { id: 'user-4' }] },
      ]);
      const result = await service.resolve(companyId, AudienceMode.SPACE, {
        spaceId,
      });
      expect(result).toEqual(['user-3', 'user-4']);
      expect(mockSpaceRepo.findOne).toHaveBeenCalledWith({
        where: { id: spaceId, companyId },
      });
      expect(mockGroupRepo.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object), companyId },
        relations: ['members'],
      });
    });

    it('should resolve for CHANNEL mode', async () => {
      const channelIds = ['channel-1'];
      mockChannelRepo.find.mockResolvedValueOnce([
        {
          id: 'channel-1',
          companyId,
          groupIds: ['group-a'],
          spaceIds: ['space-a'],
        },
      ]);
      mockGroupRepo.find.mockResolvedValueOnce([
        { id: 'group-a', members: [{ id: 'user-c' }] },
      ]);
      mockSpaceRepo.find.mockResolvedValueOnce([
        { id: 'space-a', companyId, targetGroupIds: ['group-b'] },
      ]);
      mockGroupRepo.find.mockResolvedValueOnce([
        { id: 'group-b', members: [{ id: 'user-d' }] },
      ]);

      const result = await service.resolve(companyId, AudienceMode.CHANNEL, {
        channelIds,
      });
      expect(result).toEqual(['user-c', 'user-d']);
      expect(mockChannelRepo.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object), companyId },
      });
    });

    it('should resolve for GROUPS mode', async () => {
      const groupIds = ['group-x', 'group-y'];
      mockGroupRepo.find.mockResolvedValueOnce([
        { id: 'group-x', members: [{ id: 'user-x1' }] },
        { id: 'group-y', members: [{ id: 'user-y1' }, { id: 'user-y2' }] },
      ]);
      const result = await service.resolve(companyId, AudienceMode.GROUPS, {
        groupIds,
      });
      expect(result).toEqual(['user-x1', 'user-y1', 'user-y2']);
      expect(mockGroupRepo.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object), companyId },
        relations: ['members'],
      });
    });

    it('should throw error for unsupported mode', async () => {
      await expect(
        service.resolve(companyId, 'INVALID_MODE' as AudienceMode, {}),
      ).rejects.toThrow('Audience mode INVALID_MODE not supported.');
    });
  });

  describe('probe', () => {
    const companyId = 'company-1';

    it('should return correct probe results', async () => {
      jest
        .spyOn(service, 'resolve')
        .mockResolvedValueOnce(['user-1', 'user-2', 'user-3']);
      mockUserDeviceRepo
        .createQueryBuilder()
        .getRawMany.mockResolvedValueOnce([
          { userId: 'user-1' },
          { userId: 'user-3' },
        ]);

      const result = await service.probe(companyId, AudienceMode.COMPANY, {});
      expect(result).toEqual({
        totalUsuarios: 3,
        comTokenAtivo: 2,
        mode: AudienceMode.COMPANY,
        identifiers: {},
      });
      expect(service.resolve).toHaveBeenCalledWith(
        companyId,
        AudienceMode.COMPANY,
        {},
      );
      expect(
        mockUserDeviceRepo.createQueryBuilder().where,
      ).toHaveBeenCalledWith('device.companyId = :companyId', { companyId });
      expect(
        mockUserDeviceRepo.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('device.userId IN (:...eligibleUserIds)', {
        eligibleUserIds: ['user-1', 'user-2', 'user-3'],
      });
      expect(
        mockUserDeviceRepo.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('device.enabled = :enabled', { enabled: true });
    });
  });
});
