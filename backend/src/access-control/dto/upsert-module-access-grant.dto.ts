// backend/src/modules/access-control/dto/upsert-access-grant.dto.ts
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID, ArrayUnique } from 'class-validator'
import { ModuleKey } from '@shared/types'

export class UpsertAccessGrantDto {
  @IsUUID()
  userId!: string

  @IsString()
  moduleKey!: ModuleKey

  @IsIn(['ALL_SPACES', 'SPACE_IDS'])
  scopeType!: 'ALL_SPACES' | 'SPACE_IDS'

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  spaceIds?: string[]

  @IsBoolean()
  canView!: boolean

  @IsBoolean()
  canEdit!: boolean

  @IsBoolean()
  canManage!: boolean
}