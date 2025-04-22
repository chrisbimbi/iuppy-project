import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsController } from './news.controller';
import { NewEntity } from './news.entity';
import { NewsService } from './news.service';

@Module({
  imports: [TypeOrmModule.forFeature([NewEntity])],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
