import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Set global prefix
  app.setGlobalPrefix('v1');

  // Serve static files for rapor PDFs
  // PDFs are stored in backend/rapor folder
  const raporPath = join(__dirname, '..', '..', 'rapor');
  app.useStaticAssets(raporPath, {
    prefix: '/rapor',
  });

  // Use cookie parser
  app.use(cookieParser());

  // Dynamic CORS configuration from environment variable
  const corsOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : [
        'http://localhost:3000',
        'http://localhost:4000',
        'http://localhost:5173', // Vite default
      ];

  // Enable CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie'],
  });

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger setup - only in development mode
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('HCQ API Documentation')
      .setDescription('API documentation for the HCQ project')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document);
    console.log(
      `📚 Swagger documentation available at: http://localhost:${process.env.PORT || 3000}/api/v1/docs`,
    );
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
}

void bootstrap();
