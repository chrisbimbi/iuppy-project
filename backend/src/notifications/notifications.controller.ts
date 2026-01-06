import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDeviceEntity } from './entities/user-device.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('v2/notifications')
export class NotificationsController {
  private readonly logger = new Logger('NotificationsController');

  constructor(
    @InjectRepository(UserDeviceEntity)
    private readonly deviceRepo: Repository<UserDeviceEntity>,
  ) {}

  /**
   * Registra/reativa um token de device para o usuário atual.
   * Idempotente por (companyId, token).
   */
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Post('register-device')
  async registerDevice(
    @Req() req: any,
    @Body() body: RegisterDeviceDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    const companyId = String(req.user.companyId);
    const userId = String(req.user.id || req.user.sub);

    const masked = this.maskToken(body.token);
    this.logger.log(
      `[register-device] company=${companyId} user=${userId} platform=${body.platform} token=${masked} deviceId=${body.deviceId ?? '-'} locale=${body.locale ?? '-'}`,
    );

    // Dedupe por (companyId, token). Se existir, apenas atualiza e reativa.
    const existing = await this.deviceRepo.findOne({
      where: { companyId, token: body.token },
    });

    if (existing) {
      existing.userId = userId;
      existing.platform = body.platform;
      existing.deviceId = body.deviceId ?? existing.deviceId;
      existing.userAgent = body.userAgent ?? userAgent ?? existing.userAgent;
      existing.locale = body.locale ?? existing.locale;
      existing.enabled = true;
      existing.disabledAt = null;
      const saved = await this.deviceRepo.save(existing);
      this.logger.log(
        `[register-device] reativado id=${saved.id} user=${saved.userId} platform=${saved.platform} token=${masked}`,
      );
      return { ok: true, id: saved.id };
    }

    const row = this.deviceRepo.create({
      companyId,
      userId,
      platform: body.platform,
      token: body.token,
      deviceId: body.deviceId ?? null,
      userAgent: body.userAgent ?? userAgent ?? null,
      locale: body.locale ?? null,
      enabled: true,
    });
    const saved = await this.deviceRepo.save(row);
    this.logger.log(
      `[register-device] criado id=${saved.id} user=${saved.userId} platform=${saved.platform} token=${masked}`,
    );
    return { ok: true, id: saved.id };
  }

  private maskToken(t: string) {
    if (!t) return '';
    if (t.length <= 12) return `${t.slice(0, 2)}***${t.slice(-2)}`;
    return `${t.slice(0, 6)}***${t.slice(-6)}`;
  }
}
