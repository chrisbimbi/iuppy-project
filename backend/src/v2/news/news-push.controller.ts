import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { NewsPushServiceV2 } from './news-push.service'

@UseGuards(AuthGuard('jwt'))
@Controller('v2/news')
export class NewsPushControllerV2 {
  constructor(private readonly svc: NewsPushServiceV2) {}

  /**
   * Dispara push imediato da notícia.
   * Body opcional:
   *  - onlyNotOpened?: boolean
   *  - testUserId?: string
   *  - overrideTitle?: string
   *  - overrideBody?: string
   */
  @Post(':id/push')
  async push(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const companyId = req.user.companyId as string
    return this.svc.send(companyId, id, {
      onlyNotOpened: body?.onlyNotOpened === true || body?.onlyNotOpened === '1',
      testUserId: body?.testUserId || undefined,
      overrideTitle: body?.overrideTitle || undefined,
      overrideBody: body?.overrideBody || undefined,
    })
  }
}