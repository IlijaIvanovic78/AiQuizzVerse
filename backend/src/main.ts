import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter';

const DEFAULT_PORT = 3000;
// The Angular dev server proxies every browser request, so the real client IP
// (used by the login rate limit) arrives in X-Forwarded-For from a local address.
const TRUSTED_PROXIES = 'loopback, uniquelocal';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', TRUSTED_PROXIES);
  const config = app.get(ConfigService);

  app.enableCors({ origin: config.getOrThrow<string>('FRONTEND_URL'), credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableShutdownHooks();
  setUpSwagger(app);

  const port = config.get<string>('BACKEND_PORT') ?? DEFAULT_PORT;
  await app.listen(port);
  Logger.log(`API ready on port ${port}, docs at /api/docs`, 'Bootstrap');
}

function setUpSwagger(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI QuizVerse API')
    .setDescription('Study game: AI quizzes, learning paths, mistakes review, duels and a shop')
    .setVersion('2.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
}

void bootstrap();
