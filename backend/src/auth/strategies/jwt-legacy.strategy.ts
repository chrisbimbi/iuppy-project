import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

function accessTokenExtractor(req: Request): string | null {
  if (!req) return null;
  const fromCookie =
    (req.cookies?.access_token as string) || (req.cookies?.at as string);
  return fromCookie || null;
}

@Injectable()
export class JwtLegacyStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => accessTokenExtractor(req),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const roles = payload?.role ? [payload.role] : [];
    return { ...payload, roles };
  }
}
