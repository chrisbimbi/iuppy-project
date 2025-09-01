import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));

  // CORS para o frontend Vite em http://localhost:5173 com credenciais
  const origin = process.env.CMS_ORIGIN || 'http://localhost:5173';
  app.enableCors({ origin, credentials: true });

  const prefix = (process.env.API_GLOBAL_PREFIX || '').trim();
  if (prefix) app.setGlobalPrefix(prefix);

  const port = parseInt(process.env.API_PORT || '3000', 10);
  await app.listen(port);
}
bootstrap();