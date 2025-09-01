import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    /**
     * Faz login e (importante) deixa o AuthService setar o cookie 'rt' (refresh token)
     * com httpOnly/sameSite adequado para ambiente de DEV.
     * Retorna o accessToken no body para o front guardar e mandar como Bearer.
     */
    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        // Mantemos a assinatura original do seu serviço (ele recebe o res e seta os cookies)
        return this.auth.login(dto.email, dto.password, res);
    }

    /**
     * Gera novo access token usando o refresh token vindo por cookie httpOnly 'rt'
     */
    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        return this.auth.refresh(req, res);
    }

    /**
     * Retorna dados do usuário autenticado (lido do access token).
     * O guard aceita Authorization: Bearer ... e/ou cookie 'access_token'/'at' (se você optar).
     */
    @Get('me')
    @UseGuards(JwtAccessGuard)
    async me(@Req() req: any) {
        return this.auth.me(req.user);
    }

    /**
     * Faz logout: invalida refresh token e apaga o cookie 'rt'
     */
    @Post('logout')
    @UseGuards(JwtAccessGuard)
    async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        return this.auth.logout(req.user.sub, res);
    }
}