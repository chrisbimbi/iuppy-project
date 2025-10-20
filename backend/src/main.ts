import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';

function parseOrigins(env?: string): string[] {
  return (env || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

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

  // CORS com credenciais (suporta múltiplas origens via CMS_ORIGIN=orig1,orig2)
  const allowedOrigins = parseOrigins(process.env.CMS_ORIGIN) || ['http://localhost:5173'];
  app.enableCors({
    origin: (origin, callback) => {
      // permitir ferramentas locais (curl, mobile, server-to-server) sem origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed: ${origin}`), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });

  // Prefixo global opcional
  const prefix = (process.env.API_GLOBAL_PREFIX || '').trim();
  if (prefix) app.setGlobalPrefix(prefix);

  // Swagger
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
  SwaggerModule.setup('docs', app, swaggerDoc, {
    swaggerOptions: { persistAuthorization: true },
    useGlobalPrefix: true,
  });

  const port = parseInt(process.env.API_PORT || '3000', 10);
  await app.listen(port);
}
bootstrap();