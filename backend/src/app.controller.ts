import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date() };
  }

  @Get('version')
  getVersion() {
    return { version: '0.0.1+commit_hash' };
  }

  @Get('feature-flags')
  getFeatureFlags() {
    return {
      'nr1': true,
      'icp': true,
      'esocial': true,
      'ai_features': true
    };
  }
}
