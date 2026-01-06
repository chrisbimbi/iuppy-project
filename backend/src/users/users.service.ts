import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  // ===== CRUD =====
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepository.create(createUserDto);
    user.password = await argon2.hash(user.password);
    const savedUser = await this.userRepository.save(user);
    this.eventEmitter.emit('user.created', savedUser);
    return savedUser;
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    if ((updateUserDto as any).password) {
      (updateUserDto as any).password = await argon2.hash(
        (updateUserDto as any).password,
      );
    }
    await this.userRepository.update(id, updateUserDto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  // ===== Helpers usados pelo Auth =====

  /**
   * Perfil público/seguro para o /auth/me.
   */
  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        visibleGroups: true,
      },
    });

    if (!user) return null;

    let realGroupIds: string[] = [];
    let realSpaceIds: string[] = [];

    try {
      // 1. Grupos: Busca na tabela de relacionamento REAL (user_group_members)
      // Usamos alias simples e cast para garantir
      const groupRows = await this.dataSource.query(
        `SELECT group_id FROM user_group_members WHERE user_id = $1`,
        [id],
      );
      realGroupIds = groupRows.map((r: any) => r.group_id);
    } catch (e) {
      this.logger.warn(
        `[UsersService] Erro ao buscar grupos: ${(e as any).message}`,
      );
    }

    try {
      // 2. Spaces: Como não há tabela de relação user-space,
      // assumimos que o usuário tem acesso aos spaces da empresa.
      const spaceRows = await this.dataSource.query(
        `SELECT id FROM space WHERE "companyId" = $1 AND COALESCE(active, true) = true`,
        [user.companyId],
      );
      realSpaceIds = spaceRows.map((r: any) => r.id);
    } catch (e) {
      this.logger.warn(
        `[UsersService] Erro ao buscar spaces: ${(e as any).message}`,
      );
    }

    return {
      ...user,
      groups: realGroupIds,
      spaceIds: realSpaceIds,
    };
  }

  findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  findByIdWithRefresh(id: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.refreshTokenHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.userRepository.update(
      { id: userId },
      { refreshTokenHash: hash || null },
    );
  }

  async updateLoginStats(userId: string) {
    if (!userId) return;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`[UsersService] User ${userId} not found for stats update`);
      return;
    }

    const now = new Date();
    user.lastLoginAt = now;
    if (!user.firstLoginAt) {
      user.firstLoginAt = now;
    }

    try {
      await this.userRepository.save(user);
      this.logger.log(`[UsersService] Updated login stats for ${userId}: lastLoginAt=${now}`);
    } catch (e) {
      this.logger.error(`[UsersService] Failed to update login stats for ${userId}`, e);
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async updateOtp(userId: string, code: string | null, expiresAt: Date | null) {
    await this.userRepository.update(userId, {
      otpCode: code,
      otpExpiresAt: expiresAt,
    });
  }

  async findByEmailWithOtp(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.otpCode')
      .addSelect('u.otpExpiresAt')
      .where('u.email = :email', { email })
      .getOne();
  }

  async findByIdentifier(identifier: string) {
    // Search by Email OR SyncKey (Matricula) OR CPF (in customAttributes)
    // Note: Searching in JSONB customAttributes can be tricky depending on DB, 
    // but here we try basic fields first.
    return this.userRepository.findOne({
      where: [
        { email: identifier },
        { syncKey: identifier },
        // { customAttributes: { cpf: identifier } } // TypeORM jsonb query might need raw query
      ],
    });
  }

  async updatePhone(userId: string, phone: string) {
    await this.userRepository.update(userId, { phone });
  }
}
