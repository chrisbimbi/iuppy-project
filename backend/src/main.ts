import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // cookies + validação
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS (frontend Vite) com credenciais
  const origin = process.env.CMS_ORIGIN || 'http://localhost:5173';
  app.enableCors({ origin, credentials: true });

  // Prefixo global opcional
  const prefix = (process.env.API_GLOBAL_PREFIX || '').trim();
  if (prefix) app.setGlobalPrefix(prefix);

  // Swagger (documentação)
  const swaggerCfg = new DocumentBuilder()
    .setTitle('Iuppy API V2')
    .setDescription('Endpoints da V2 (News, Feed, Analytics, etc.)')
    .setVersion('2.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'bearer',
    )
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerCfg);
  // Observação: o path "/docs" funciona com ou sem prefixo global.
SwaggerModule.setup('docs', app, swaggerDoc, {
  swaggerOptions: { persistAuthorization: true },
  useGlobalPrefix: true,
});
  // Porta (default 4000 conforme seu ambiente)
  const port = parseInt(process.env.API_PORT || '4000', 10);
  await app.listen(port);
}
bootstrap();