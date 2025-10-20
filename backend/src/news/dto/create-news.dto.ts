import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator'
import { Type } from 'class-transformer'
import { NewsType } from '@shared/types/NewsType'
import { AudienceSelectionDto } from './audience-selection.dto'
import { NewSettingsDto } from './news-settings-dto'

export class CreateNewDto {
  // passaram a ser opcionais para não bloquear quando o backend sobrepõe pelo token
  @IsOptional() @IsUUID()
  companyId?: string

  @IsOptional() @IsUUID()
  authorId?: string

  @IsNotEmpty() @IsUUID()
  channelId!: string

  @IsNotEmpty() @IsString()
  title!: string

  @IsOptional() @IsString()
  subtitle?: string

  @IsNotEmpty() @IsString()
  content!: string

  @IsOptional() @IsEnum(NewsType)
  type?: NewsType

  @IsOptional() @IsBoolean()
  isPublished?: boolean

  @IsOptional() @IsArray()
  attachments?: { url: string; name: string }[]

  @IsOptional() @IsArray()
  highlightImages?: { url: string; altText?: string }[]

  @ValidateNested() @Type(() => NewSettingsDto)
  settings!: NewSettingsDto

  // 🔥 Seleção de audiência (fora de settings)
  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceSelectionDto)
  audience?: AudienceSelectionDto
}
