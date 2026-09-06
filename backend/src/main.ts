import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const nodeEnv = configService.get<string>('NODE_ENV', process.env.NODE_ENV || 'development');
  const port = Number(configService.get<string | number>('PORT', process.env.PORT || 3000));
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN', process.env.CORS_ORIGIN);

  // Aumenta o limite do body parser para aceitar JSONs grandes com muitas questões (até 50MB)
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Configuração de CORS dinâmica e robusta
  app.enableCors({
    origin: (origin, callback) => {
      // Permite requisições sem header origin (ex: healthchecks internos, server-to-server, curl)
      if (!origin) return callback(null, true);

      // Se CORS_ORIGIN for '*' ou bater com domínios autorizados
      if (
        corsOriginEnv === '*' ||
        origin.includes('linkpc.net') ||
        origin.includes('aprovandotech') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      if (corsOriginEnv) {
        const allowedList = corsOriginEnv.split(',').map((o) => o.trim());
        if (allowedList.includes(origin)) {
          return callback(null, true);
        }
      }

      logger.warn(`CORS bloqueou requisição da origem: ${origin}`);
      return callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Range'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`🚀 Aprovando Tech Backend is running!`);
  logger.log(`🌍 Environment: ${nodeEnv.toUpperCase()}`);
  logger.log(`🔗 URL: http://localhost:${port}`);
  logger.log(`====================================================`);
}
bootstrap();

