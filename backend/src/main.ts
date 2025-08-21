import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(cookieParser())

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }))

  // CORS com credenciais (para o CMS/SPA)
  const origins = (process.env.CMS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  app.enableCors({
    origin: origins,
    credentials: true,
  })

  const port = Number(process.env.PORT || 3000)
  await app.listen(port)
  console.log(`API up on :${port} | CORS origins:`, origins)
}
bootstrap()