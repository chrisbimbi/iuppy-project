import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
   * Perfil público/seguro para o /auth/me:
   * retorna os campos que o app precisa (sem password/refresh).
   */
  async findById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        groups: true,
        visibleGroups: true,
      },
    });
  }

  /**
   * Login precisa da senha -> inclui password (select:false na entity).
   */
  findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  /**
   * Refresh precisa do hash -> inclui refreshTokenHash (select:false na entity).
   */
  findByIdWithRefresh(id: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.refreshTokenHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  /**
   * Atualiza (ou limpa) o hash do refresh token.
   */
  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.userRepository.update(
      { id: userId },
      { refreshTokenHash: hash || null },
    );
  }
}