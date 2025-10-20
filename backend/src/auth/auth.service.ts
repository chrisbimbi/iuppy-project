// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';

type SameSiteOpt = boolean | 'lax' | 'strict' | 'none';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private accessSecret = process.env.JWT_ACCESS_SECRET!;
  private refreshSecret = process.env.JWT_REFRESH_SECRET!;
  private accessTtl = process.env.JWT_ACCESS_TTL || '900s';
  private refreshTtl = process.env.JWT_REFRESH_TTL || '7d';

  // 🔧 cookies controlados por env
  private cookieSameSite: SameSiteOpt =
    ((process.env.REFRESH_COOKIE_SAMESITE as SameSiteOpt) ?? 'lax');
  private cookieSecure = (process.env.REFRESH_COOKIE_SECURE ?? 'false') === 'true';
  private cookieDomain = process.env.COOKIE_DOMAIN || undefined;

  private setRefreshCookie(res: Response, refreshToken: string) {
    // maxAge ~ JWT_REFRESH_TTL; usamos 90d ~ 7776000000ms quando não parseamos string
    const defaultMaxAgeMs = 90 * 24 * 60 * 60 * 1000;
    res.cookie('rt', refreshToken, {
      httpOnly: true,
      sameSite: this.cookieSameSite,
      secure: this.cookieSecure,
      domain: this.cookieDomain,
      path: '/auth/refresh',
      // se quiser sincronizar exatamente com o TTL do JWT, pode calcular e pôr aqui.
      maxAge: defaultMaxAgeMs,
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.password, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.validateUser(email, password);

    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl, // ✅ agora 48h (via .env)
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl, // 30–90d
    });

    await this.users.updateRefreshTokenHash(user.id, await argon2.hash(refreshToken));

    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  async refresh(req: Request, res: Response) {
    const user = (req as any).user as {
      sub: string; email: string; role?: string; companyId: string; rt: string;
    };

    const dbUser = await this.users.findByIdWithRefresh(user.sub);
    if (!dbUser?.refreshTokenHash) throw new UnauthorizedException();

    const match = await argon2.verify(dbUser.refreshTokenHash, user.rt);
    if (!match) throw new UnauthorizedException();

    const payload = { sub: dbUser.id, email: dbUser.email, role: dbUser.role, companyId: dbUser.companyId };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl, // ✅ 48h
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl,
    });

    await this.users.updateRefreshTokenHash(dbUser.id, await argon2.hash(refreshToken));

    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  async me(user: any) {
    const u = await this.users.findById(user.sub);
    if (!u) throw new UnauthorizedException();
    return {
      id: u.id, email: u.email, role: u.role, companyId: u.companyId,
      name: u.name ?? null, displayName: u.displayName ?? null, avatarUrl: u.avatarUrl ?? null,
      groups: Array.isArray(u.groups) ? u.groups : [],
      visibleGroups: Array.isArray(u.visibleGroups) ? u.visibleGroups : [],
    };
  }

  async logout(userId: string, res: Response) {
    await this.users.updateRefreshTokenHash(userId, null);
    res.clearCookie('rt', { path: '/auth/refresh', domain: this.cookieDomain });
    return { ok: true };
  }
}