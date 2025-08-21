// src/auth/guards/refresh-auth.guard.ts
import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
@Injectable()
export class RefreshAuthGuard extends AuthGuard('jwt-refresh') { }