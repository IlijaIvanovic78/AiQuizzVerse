import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI QuizVerse API')
    .setDescription('Gamified quiz platform with AI-generated questions, real-time multiplayer, and avatar system')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Access Token', in: 'header' },
      'access-token',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Refresh Token', in: 'header' },
      'refresh-token',
    )
    .addTag('Auth', 'Authentication endpoints (register, login, 2FA, tokens)')
    .addTag('Users', 'User management')
    .addTag('Health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Get config service
  const configService = app.get(ConfigService);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('BACKEND_PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
