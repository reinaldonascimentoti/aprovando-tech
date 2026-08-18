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

  // Configuração de CORS dinâmica baseada no ambiente
  let allowedOrigins: boolean | string | string[] | RegExp = true;
  if (corsOriginEnv) {
    if (corsOriginEnv.includes(',')) {
      allowedOrigins = corsOriginEnv.split(',').map((o) => o.trim());
    } else if (corsOriginEnv === '*') {
      allowedOrigins = true;
    } else {
      allowedOrigins = corsOriginEnv;
    }
  } else if (nodeEnv === 'production') {
    // Em produção, se não definido explicitamente, pode receber array de origens ou permitir com log de aviso
    logger.warn('CORS_ORIGIN não definido em ambiente de produção. Usando padrão restrito.');
    allowedOrigins = ['https://aprovandotech.com.br', 'https://app.aprovandotech.com.br'];
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
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

