import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../users/user.entity';
import { GamificationController } from './gamification.controller';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    controllers: [GamificationController],
})
export class GamificationModule { }
