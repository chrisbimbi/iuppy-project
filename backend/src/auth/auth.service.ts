// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';

type SameSiteOpt = boolean | 'lax' | 'strict' | 'none';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) { }

  private accessSecret = process.env.JWT_ACCESS_SECRET!;
  private refreshSecret = process.env.JWT_REFRESH_SECRET!;
  private accessTtl = process.env.JWT_ACCESS_TTL || '900s';
  private refreshTtl = process.env.JWT_REFRESH_TTL || '7d';

  // 🔧 cookies controlados por env
  private cookieSameSite: SameSiteOpt =
    (process.env.REFRESH_COOKIE_SAMESITE as SameSiteOpt) ?? 'lax';
  private cookieSecure =
    (process.env.REFRESH_COOKIE_SECURE ?? 'false') === 'true';
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

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl, // ✅ agora 48h (via .env)
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl, // 30–90d
    });

    await this.users.updateRefreshTokenHash(
      user.id,
      await argon2.hash(refreshToken),
    );
    await this.users.updateLoginStats(user.id);

    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  async refresh(req: Request, res: Response) {
    const user = (req as any).user as {
      sub: string;
      email: string;
      role?: string;
      companyId: string;
      rt: string;
    };

    const dbUser = await this.users.findByIdWithRefresh(user.sub);
    if (!dbUser?.refreshTokenHash) throw new UnauthorizedException();

    const match = await argon2.verify(dbUser.refreshTokenHash, user.rt);
    if (!match) throw new UnauthorizedException();

    const payload = {
      sub: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      companyId: dbUser.companyId,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl, // ✅ 48h
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl,
    });

    await this.users.updateRefreshTokenHash(
      dbUser.id,
      await argon2.hash(refreshToken),
    );
    await this.users.updateLoginStats(dbUser.id);

    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  async me(user: any) {
    const u = await this.users.findById(user.sub);
    if (!u) throw new UnauthorizedException();
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      companyId: u.companyId,
      name: u.name ?? null,
      displayName: u.displayName ?? null,
      avatarUrl: u.avatarUrl ?? null,
      groups: Array.isArray(u.groups) ? u.groups : [],
      visibleGroups: Array.isArray(u.visibleGroups) ? u.visibleGroups : [],
    };
  }

  async updateMe(userId: string, data: any) {
    // Validate allowed fields
    const allowed = ['displayName', 'avatarUrl', 'customAttributes', 'role', 'department', 'jobTitle', 'phone']; // Role/Dept usually admin only, but for now allowing if user sends (or filter strictly)
    // Actually, per user request: "Os campos não são obrigatórios na edição! Nenhum!".
    // So we just update what is sent, but for security, let's filter sensitive fields like password.

    const updateData: any = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    // Merge customAttributes usually? Or replace?
    // Prisma/TypeORM json update is usually replace.
    // But we can do a merge logic if needed. For now assume replace or merge in service.
    if (data.customAttributes !== undefined) updateData.customAttributes = data.customAttributes;

    // Let's call users service to update
    await this.users.update(userId, updateData);

    const u = await this.users.findById(userId);
    return this.me({ sub: u!.id });
  }

  async logout(userId: string, res: Response) {
    await this.users.updateRefreshTokenHash(userId, null);
    res.clearCookie('rt', { path: '/auth/refresh', domain: this.cookieDomain });
    return { ok: true };
  }
  async firebaseLogin(idToken: string, res: Response) {
    try {
      // 1. Verify ID Token via Firebase Admin
      // Note: We are using the default app instance which should be initialized in main.ts or a module
      const decoded = await import('firebase-admin').then(admin => admin.auth().verifyIdToken(idToken));
      const { email, uid, picture, name } = decoded;

      if (!email) {
        throw new UnauthorizedException('Firebase user has no email');
      }

      // 2. Find or Create User
      // For now, we only allow existing users (invited via Web) or auto-create if that's the policy.
      // Given the requirements "Invite user if not logged in", we assume users are pre-created or we strictly match by email.
      // Let's match by email.
      let user = await this.users.findByEmail(email);

      if (!user) {
        // Option: Auto-create user if open registration is allowed, OR fail.
        // For a corporate app, usually we fail if not invited.
        // However, if the user is logging in via Phone, we might need to link phone number.
        // Let's assume for now we match by email. If phone auth doesn't provide email, this flow needs adjustment.
        // If using Phone Auth, Firebase might not return email unless linked.
        // If the user uses Google Sign-In via Firebase, email is present.

        // If the requirement is "Login via Phone", we need to match by Phone Number.
        // Let's check if we have phone number in UserEntity.
        if (decoded.phone_number) {
          user = await this.users.findByPhone(decoded.phone_number);
        }

        if (!user) {
          throw new UnauthorizedException('User not found. Please contact HR.');
        }
      }

      // 3. Generate Tokens (Same as login)
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      };

      const accessToken = await this.jwt.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: this.accessTtl,
      });

      const refreshToken = await this.jwt.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtl,
      });

      await this.users.updateRefreshTokenHash(
        user.id,
        await argon2.hash(refreshToken),
      );
      await this.users.updateLoginStats(user.id);

      this.setRefreshCookie(res, refreshToken);

      return { accessToken };

    } catch (e) {
      console.error('Firebase Login Error:', e);
      throw new UnauthorizedException('Invalid Firebase Token');
    }
  }

  async lookupPhone(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('E-mail não encontrado.');
    }
    if (!user.phone) {
      throw new UnauthorizedException('Usuário sem celular cadastrado. Contate o RH.');
    }
    return { phone: user.phone };
  }

  // ===== OTP EMAIL =====

  async requestEmailOtp(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Security: Don't reveal if user exists?
      // For internal app, returning error is helpful.
      throw new UnauthorizedException('E-mail não encontrado.');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save to DB
    await this.users.updateOtp(user.id, code, expiresAt);

    // Send Email
    await this.mail.sendOtp(email, code);

    return { message: 'Código enviado para o e-mail.' };
  }

  async verifyEmailOtp(email: string, code: string, res: Response) {
    const user = await this.users.findByEmailWithOtp(email);
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException('Nenhum código solicitado.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new UnauthorizedException('Código expirado.');
    }

    if (user.otpCode !== code) {
      throw new UnauthorizedException('Código inválido.');
    }

    // Clear OTP
    await this.users.updateOtp(user.id, null, null);

    // Login
    return this.generateTokens(user, res);
  }

  // ===== LOGIN BY ID (CPF/Matricula) + FIREBASE TOKEN =====

  async loginByIdAndPhone(identifier: string, idToken: string, res: Response) {
    console.log(`[AuthService] LoginById attempt: identifier=${identifier}`);

    // 1. Verify Firebase Token
    let decoded;
    try {
      decoded = await import('firebase-admin').then(admin => admin.auth().verifyIdToken(idToken));
      console.log(`[AuthService] Firebase Token verified. Phone: ${decoded.phone_number}`);
    } catch (e) {
      console.error('[AuthService] Firebase Token verification failed:', e);
      throw new UnauthorizedException('Token Firebase inválido.');
    }

    const phone = decoded.phone_number;
    if (!phone) {
      console.error('[AuthService] No phone in token');
      throw new UnauthorizedException('Token Firebase sem número de telefone.');
    }

    // 2. Find User by Identifier (CPF or Matricula)
    // We assume identifier is passed. We need to search by CPF or Matricula.
    // UserEntity doesn't have explicit CPF/Matricula columns shown, but maybe customAttributes?
    // Or maybe we search by 'syncKey' or 'email' (if identifier is email).
    // The requirement says "CPF or Matricula".
    // Let's assume we search in 'customAttributes' or a generic search.
    // For now, let's assume 'identifier' matches 'syncKey' (often used for Matricula) or we add a search method.

    const user = await this.users.findByIdentifier(identifier);
    if (!user) {
      console.error(`[AuthService] User not found for identifier: ${identifier}`);
      throw new UnauthorizedException('Usuário não encontrado com este identificador.');
    }
    console.log(`[AuthService] User found: ${user.email} (${user.id})`);

    // 3. Verify if user's phone matches (Optional? User said "Não vamos buscar o telefone cadastrado")
    // "Não vamos buscar o telefone cadastrado no banco, pq possivelmente não teremos essa informação."
    // So we TRUST the identifier + possession of the phone.
    // BUT we should probably link the phone to the user if it's missing?

    if (!user.phone) {
      console.log(`[AuthService] Updating user phone to ${phone}`);
      await this.users.updatePhone(user.id, phone);
    }

    // Login
    return this.generateTokens(user, res);
  }

  private async generateTokens(user: any, res: Response) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl,
    });

    await this.users.updateRefreshTokenHash(
      user.id,
      await argon2.hash(refreshToken),
    );
    await this.users.updateLoginStats(user.id);

    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }
}
