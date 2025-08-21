// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private users: UsersService,
        private jwt: JwtService,
        private cfg: ConfigService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.users.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const ok = await argon2.verify(user.password, password);
        if (!ok) throw new UnauthorizedException('Invalid credentials');
        return user;
    }

    private signAccess(user: any) {
        const payload = {
            sub: user.id,
            companyId: user.companyId,
            roles: [user.role], // compatível com seu guard
        };
        return this.jwt.sign(payload, {
            secret: this.cfg.get('JWT_ACCESS_SECRET'),
            expiresIn: this.cfg.get('JWT_ACCESS_TTL') || '900s',
        });
    }

    private signRefresh(user: any) {
        const payload = { sub: user.id, companyId: user.companyId, tokenType: 'refresh' };
        return this.jwt.sign(payload, {
            secret: this.cfg.get('JWT_REFRESH_SECRET'),
            expiresIn: this.cfg.get('JWT_REFRESH_TTL') || '7d',
        });
    }

    issueTokens(user: any) {
        return {
            accessToken: this.signAccess(user),
            refreshToken: this.signRefresh(user),
        };
    }
}