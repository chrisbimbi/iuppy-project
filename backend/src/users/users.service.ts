import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
  ) {}

  // ===== CRUD =====
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepository.create(createUserDto);
    user.password = await argon2.hash(user.password);
    return this.userRepository.save(user);
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
        [id]
      );
      realGroupIds = groupRows.map((r: any) => r.group_id);
    } catch (e) {
      this.logger.warn(`[UsersService] Erro ao buscar grupos: ${(e as any).message}`);
    }

    try {
      // 2. Spaces: Como não há tabela de relação user-space, 
      // assumimos que o usuário tem acesso aos spaces da empresa.
      const spaceRows = await this.dataSource.query(
        `SELECT id FROM space WHERE "companyId" = $1 AND COALESCE(active, true) = true`,
        [user.companyId]
      );
      realSpaceIds = spaceRows.map((r: any) => r.id);
    } catch (e) {
      this.logger.warn(`[UsersService] Erro ao buscar spaces: ${(e as any).message}`);
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
}