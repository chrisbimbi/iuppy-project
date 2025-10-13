import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserDeviceEntity } from './entities/user-device.entity'

class RegisterDeviceDto {
    platform!: 'web' | 'android' | 'ios'
    token!: string
    deviceId?: string
    userAgent?: string
    locale?: string
}

@UseGuards(AuthGuard('jwt'))
@Controller('v2/notifications')
export class NotificationsController {
    constructor(@InjectRepository(UserDeviceEntity) private readonly deviceRepo: Repository<UserDeviceEntity>) { }

    @Post('register-device')
    async registerDevice(@Req() req: any, @Body() body: RegisterDeviceDto) {
        const companyId = String(req.user.companyId)
        const userId = String(req.user.id || req.user.sub)

        const existing = await this.deviceRepo.findOne({ where: { companyId, token: body.token } })
        if (existing) {
            existing.userId = userId
            existing.platform = body.platform
            existing.deviceId = body.deviceId ?? existing.deviceId
            existing.userAgent = body.userAgent ?? existing.userAgent
            existing.locale = body.locale ?? existing.locale
            existing.enabled = true
            existing.disabledAt = null
            return this.deviceRepo.save(existing)
        }

        const row = this.deviceRepo.create({
            companyId, userId,
            platform: body.platform, token: body.token,
            deviceId: body.deviceId ?? null, userAgent: body.userAgent ?? null, locale: body.locale ?? null,
        })
        return this.deviceRepo.save(row)
    }
}