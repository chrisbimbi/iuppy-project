// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Body() _dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        // user vem do LocalStrategy
        // @ts-ignore
        const user = (res.req as any).user;
        const { accessToken, refreshToken } = this.auth.issueTokens(user);
        res.cookie('rt', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return { accessToken };
    }

    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    refresh(@Res({ passthrough: true }) res: Response) {
        // @ts-ignore
        const payload = (res.req as any).user;
        const { sub, companyId } = payload;
        const user = { id: sub, companyId, role: 'viewer' }; // role não vem no refresh; pegue do BD se necessário
        const { accessToken, refreshToken } = this.auth.issueTokens(user);
        res.cookie('rt', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return { accessToken };
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('rt', { path: '/' });
        return { ok: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Res({ passthrough: true }) res: Response) {
        // @ts-ignore
        const payload = (res.req as any).user; // { sub, companyId, roles }
        return payload;
    }
}