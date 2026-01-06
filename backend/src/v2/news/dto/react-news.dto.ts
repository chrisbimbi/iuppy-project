import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const REACTIONS = [
  'like',
  'love',
  'clap',
  'smile',
  'neutral',
  'angry',
] as const;
export type ReactionType = (typeof REACTIONS)[number];

export class NewsReactDto {
  @ApiProperty({ enum: REACTIONS })
  @IsIn(REACTIONS as unknown as string[])
  reaction!: ReactionType;
}
