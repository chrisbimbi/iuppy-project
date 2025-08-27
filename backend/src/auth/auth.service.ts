import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(private readonly users: UsersService, private readonly jwt: JwtService) { }

    private accessSecret = process.env.JWT_ACCESS_SECRET!;
    private refreshSecret = process.env.JWT_REFRESH_SECRET!;
    private accessTtl = process.env.JWT_ACCESS_TTL || '900s';
    private refreshTtl = process.env.JWT_REFRESH_TTL || '7d';

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
        const accessToken = await this.jwt.signAsync(payload, { secret: this.accessSecret, expiresIn: this.accessTtl });
        const refreshToken = await this.jwt.signAsync(payload, { secret: this.refreshSecret, expiresIn: this.refreshTtl });

        await this.users.updateRefreshTokenHash(user.id, await argon2.hash(refreshToken));

        res.cookie('rt', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false, // true em prod com HTTPS
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { accessToken };
    }

    async refresh(req: Request, res: Response) {
        const user = (req as any).user as { sub: string; email: string; role?: string; companyId: string; rt: string };
        const dbUser = await this.users.findByIdWithRefresh(user.sub);
        if (!dbUser?.refreshTokenHash) throw new UnauthorizedException();

        const match = await argon2.verify(dbUser.refreshTokenHash, user.rt);
        if (!match) throw new UnauthorizedException();

        const payload = { sub: dbUser.id, email: dbUser.email, role: dbUser.role, companyId: dbUser.companyId };
        const accessToken = await this.jwt.signAsync(payload, { secret: this.accessSecret, expiresIn: this.accessTtl });
        const refreshToken = await this.jwt.signAsync(payload, { secret: this.refreshSecret, expiresIn: this.refreshTtl });

        await this.users.updateRefreshTokenHash(dbUser.id, await argon2.hash(refreshToken));

        res.cookie('rt', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { accessToken };
    }

    async me(user: any) {
        // <<< normaliza para ter `id`
        return {
            id: user.sub,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        };
    }

    async logout(userId: string, res: Response) {
        await this.users.updateRefreshTokenHash(userId, null);
        res.clearCookie('rt', { path: '/auth/refresh' });
        return { ok: true };
    }
}