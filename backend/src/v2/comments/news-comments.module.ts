import { Module } from '@nestjs/common';
import { NewsCommentsControllerV2 } from './news-comments.controller';
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';
import { CommentCounterAdapterV2 } from './comment-counter.adapter';

@Module({
  controllers: [NewsCommentsControllerV2],
  providers: [SchemaIntrospectorV2, CommentCounterAdapterV2],
  exports: [],
})
export class NewsCommentsModuleV2 {}
