import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Global prefix
    app.setGlobalPrefix('api');
    // CORS
    app.enableCors({
        origin: 'http://localhost:3000',
        credentials: true,
    });
    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('LearnHub API')
        .setDescription('Educational Platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    // Start server
    const port = process.env.API_PORT || 3001;
    await app.listen(port);
    console.log(`🚀 LearnHub API is running on: http://localhost:${port}/api`);
    console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
