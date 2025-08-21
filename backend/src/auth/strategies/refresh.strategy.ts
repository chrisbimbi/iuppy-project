
// src/auth/strategies/refresh.strategy.ts
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function cookieExtractor(req) {
    if (req && req.cookies && req.cookies.rt) return req.cookies.rt;
    return null;
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(cfg: ConfigService) {
        super({
            jwtFromRequest: cookieExtractor,
            secretOrKey: cfg.get('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }
    async validate(req: any, payload: any) {
        return payload; // {sub, companyId, tokenType:'refresh'}
    }
}