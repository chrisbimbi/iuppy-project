import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.login(dto.email, dto.password, res);
  }

  @Post('firebase')
  async firebaseLogin(
    @Body('idToken') idToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.firebaseLogin(idToken, res);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.refresh(req, res);
  }

  @Get('me')
  @UseGuards(JwtAccessGuard) // aceita Authorization: Bearer ou cookie 'at'
  async me(@Req() req: any) {
    return this.auth.me(req.user);
  }

  @Patch('me')
  @UseGuards(JwtAccessGuard)
  async updateMe(@Req() req: any, @Body() body: any) {
    return this.auth.updateMe(req.user.sub, body);
  }

  @Post('logout')
  @UseGuards(JwtAccessGuard)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.auth.logout(req.user.sub, res);
  }

  @Post('lookup')
  async lookup(@Body('email') email: string) {
    return this.auth.lookupPhone(email);
  }

  @Post('otp/email/request')
  async requestEmailOtp(@Body('email') email: string) {
    return this.auth.requestEmailOtp(email);
  }

  @Post('otp/email/verify')
  async verifyEmailOtp(
    @Body('email') email: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.verifyEmailOtp(email, code, res);
  }

  @Post('login-by-id')
  async loginById(
    @Body('identifier') identifier: string,
    @Body('idToken') idToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.loginByIdAndPhone(identifier, idToken, res);
  }
}
