import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { describe, it, expect, beforeAll } from '@jest/globals'

describe('Companies (e2e)', () => {
    let app: INestApplication
    beforeAll(async () => {
        const { AppModule } = await import('../src/app.module')
        const { Test } = await import('@nestjs/testing')
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        app = moduleFixture.createNestApplication()
        await app.init()
    })

    it('provisiona tenant (SuperAdmin)', async () => {
        const token = 'FAKE_SUPERADMIN_JWT'
        const res = await request(app.getHttpServer())
            .post('/platform/companies')
            .set('Authorization', `Bearer ${token}`)
            .send({ companyId: 'acme', modules: [{ key: 'surveys', enabled: true }] })
            .expect(201)
        expect(res.body.companyId).toBe('acme')
    })
})

// Removed custom beforeAll and expect implementations as they are now imported from Jest

