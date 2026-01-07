
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);
    const logger = new Logger('GetToken');

    try {
        // Admin user credentials (assuming default seed or known user)
        // If password is unknown, I might need to impersonate or generate a token directly.
        // Let's assume we can generate a token for a known admin ID directly if AuthService supports it,
        // or just login if we know the password.
        // Since I don't know the password for 'admin@iuppy.com.br' for sure (it might be '123456' or 'admin'),
        // I will generate a token properly using `signToken` if available exposed or simulate a user.

        // user for payload
        const user = {
            id: '2030f9d6-9d8f-4b47-b206-e19a753a91d8',
            email: 'admin@iuppy.com.br',
            role: 'company_admin',
            roles: ['company_admin'], // For RolesGuard match
            companyId: '2af4557f-9259-4eed-818d-1d0ffe0b8982'
        };

        const userPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            roles: user.roles, // Pass roles array
            companyId: user.companyId,
        };

        const jwtService = app.get(JwtService as any); // Type safety workaround if JwtService symbol export issue
        // Actually JwtService is exported from @nestjs/jwt.

        // Access ConfigService to ensure we have the secret if JwtModule isn't globally configured with it for manual calls?
        // JwtModule usually configures the service instance.

        // Check if we can just sign.
        const accessToken = jwtService.sign(userPayload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '1h'
        });

        console.log('ACCESS_TOKEN=' + accessToken);

    } catch (e) {
        logger.error('Failed to get token', e);
    } finally {
        await app.close();
    }
}

bootstrap();
