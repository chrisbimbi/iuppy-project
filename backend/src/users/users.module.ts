// backend/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [
    TypeOrmModule.forFeature([UserEntity]),  // <<< exporta o repositório
    UsersService,                           // <<< se quiser usar UsersService em outros módulos
  ],
})
export class UsersModule {}