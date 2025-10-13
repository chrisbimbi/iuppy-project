import { IsIn, IsOptional, IsString } from 'class-validator'

export class RegisterDeviceDto {
  @IsString()
  @IsIn(['web', 'android', 'ios'])
  platform!: 'web' | 'android' | 'ios'

  @IsString()
  token!: string

  @IsOptional()
  @IsString()
  deviceId?: string

  @IsOptional()
  @IsString()
  userAgent?: string

  @IsOptional()
  @IsString()
  locale?: string
}