import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ArrayUnique,
} from 'class-validator';

const MODULE_KEYS = [
  'news',
  'channels',
  'groups',
  'surveys',
  'forms',
  'onboarding',
  'training',
  'jobs',
  'birthdays',
  'recognition',
  'quicklinks',
  'benefits',
  'vacations',
  'podcasts',
  'analytics',
  'chat',
] as const;
type ModuleKey = (typeof MODULE_KEYS)[number];

export class UpsertAccessGrantDto {
  @IsUUID() userId!: string;

  @IsIn(MODULE_KEYS as unknown as string[], { message: 'moduleKey inválido' })
  moduleKey!: ModuleKey;

  @IsIn(['ALL_SPACES', 'SPACE_IDS']) scopeType!: 'ALL_SPACES' | 'SPACE_IDS';

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  spaceIds?: string[];

  @IsBoolean() canView!: boolean;
  @IsBoolean() canEdit!: boolean;
  @IsBoolean() canManage!: boolean;
}
