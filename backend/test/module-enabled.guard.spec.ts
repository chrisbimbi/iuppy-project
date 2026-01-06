import test from 'node:test';
import { expect, jest } from '@jest/globals';
import { ModuleEnabledGuard } from '../src/common/guards/module-enabled.guard';
import { Reflector } from '@nestjs/core';

test('permite SuperAdmin', async () => {
  const cm = { get: jest.fn() };
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue('surveys'),
  } as any as Reflector;
  const guard = new ModuleEnabledGuard(reflector, cm as any);
  const ctx: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        params: { companyId: 'c1' },
        user: { roles: ['super_admin'] },
      }),
    }),
  };
  await expect(guard.canActivate(ctx)).resolves.toBe(true);
});

test('bloqueia quando módulo off', async () => {
  const cm = { get: jest.fn().mockResolvedValue({ enabled: true }) };
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue('surveys'),
  } as any;
  const guard = new ModuleEnabledGuard(reflector as any, cm as any);
  const ctx: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        params: { companyId: 'c1' },
        user: { roles: ['viewer'] },
      }),
    }),
  };
  await expect(guard.canActivate(ctx)).rejects.toThrow(
    'Módulo "surveys" desabilitado',
  );
});
