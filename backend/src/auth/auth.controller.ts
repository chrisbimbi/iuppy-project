import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        return this.auth.login(dto.email, dto.password, res);
    }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        return this.auth.refresh(req, res);
    }

    @Get('me')
    @UseGuards(JwtAccessGuard)
    async me(@Req() req: any) {
        return this.auth.me(req.user);
    }

    @Post('logout')
    @UseGuards(JwtAccessGuard)
    async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        return this.auth.logout(req.user.sub, res);
    }
}