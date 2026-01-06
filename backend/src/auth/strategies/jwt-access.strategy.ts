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
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
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
    // req.user => { id, sub, email, role, companyId, roles, iat, exp }
    return { ...payload, id: payload.sub, roles };
  }
}
