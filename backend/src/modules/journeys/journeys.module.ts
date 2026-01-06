import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JourneysService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { JourneyScheduler } from './journey.scheduler';
import { JourneyEntity } from './entities/journey.entity';
import { JourneyStepEntity } from './entities/journey-step.entity';
import { UserJourneyInstanceEntity } from './entities/user-journey-instance.entity';
import { StepCompletionEntity } from './entities/step-completion.entity';
import { UserEntity } from '../../users/user.entity';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AccessControlModule } from 'src/access-control/access-control.module';
import { NeuralRecommenderService } from './services/neural-recommender.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JourneyEntity,
      JourneyStepEntity,
      UserJourneyInstanceEntity,
      StepCompletionEntity,
      UserEntity,
    ]),
    NotificationsModule,
    AccessControlModule,
  ],
  controllers: [JourneysController],
  providers: [JourneysService, JourneyScheduler, NeuralRecommenderService],
  exports: [JourneysService, NeuralRecommenderService],
})
export class JourneysModule { }
