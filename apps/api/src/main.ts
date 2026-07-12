import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  // Security
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  // Trust proxy (behind Nginx)
  app.set('trust proxy', 1);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Body limits
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/api/public/',
  });

  // Swagger (only in development)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('LearnHub API')
      .setDescription('Educational Platform REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const prismaService = app.get(PrismaService);

  const shutdown = async (signal: string) => {
    Logger.log(`Received ${signal}. Starting graceful shutdown...`, 'Bootstrap');
    await prismaService.$disconnect();
    await app.close();
    Logger.log('Application shut down gracefully.', 'Bootstrap');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Start server
  const port = configService.get<number>('API_PORT') || 3001;
  await app.listen(port);
  Logger.log(`🚀 LearnHub API running on port ${port}`, 'Bootstrap');
  if (!isProduction) {
    Logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}

bootstrap();
