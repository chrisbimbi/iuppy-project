import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    // Hooks do entity fazem o hash com argon2
    const user = this.userRepository.create(createUserDto)
    return await this.userRepository.save(user)
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find()
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ id })
    if (!user) throw new NotFoundException(`User with id ${id} not found`)
    return user
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } })
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    // Se vier password em texto, o hook do entity vai hashear
    await this.userRepository.update(id, updateUserDto as any)
    return this.findOne(id)
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id)
  }
}