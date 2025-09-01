import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

/**
 * Extrai o access token de:
 * 1) Cookie 'access_token' ou 'at' (opcional — útil se no futuro quiser mandar o AT como cookie)
 * 2) Authorization: Bearer <token> (padrão atual do frontend)
 */
function accessTokenExtractor(req: Request): string | null {
  if (!req) return null;
  const fromCookie = (req.cookies?.access_token as string) || (req.cookies?.at as string);
  if (fromCookie) return fromCookie;
  return null;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
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
    // payload: { sub, email, role, companyId, iat, exp }
    const roles = payload?.role ? [payload.role] : [];
    return { ...payload, roles };
  }
}