import { Module } from '@nestjs/common';
import { FeedV2Service } from './feed.service';
import { FeedV2Controller } from './feed.controller';

@Module({
    imports: [],
    controllers: [FeedV2Controller],
    providers: [FeedV2Service],
    exports: [FeedV2Service],
})
export class FeedV2Module { }