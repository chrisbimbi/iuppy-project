import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import * as argon2 from 'argon2'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // ===== CRUD =====
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepository.create(createUserDto)
    user.password = await argon2.hash(user.password)
    return this.userRepository.save(user)
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find()
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ id })
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`)
    }
    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password)
    }
    await this.userRepository.update(id, updateUserDto as any)
    return this.findOne(id)
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id)
  }

  // ===== Helpers usados pelo Auth =====

  /**
   * Busca usuário por e-mail incluindo a coluna `password`.
   * (Na entidade, `password` está com select:false, por isso usamos addSelect)
   */
  findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne()
  }

  /**
   * Busca usuário por id incluindo a coluna `refreshTokenHash`.
   */
  findByIdWithRefresh(id: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.refreshTokenHash')
      .where('u.id = :id', { id })
      .getOne()
  }

  /**
   * Atualiza o hash do refresh token (ou remove ao deslogar).
   */
  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.userRepository.update({ id: userId }, { refreshTokenHash: hash || null })
  }
}