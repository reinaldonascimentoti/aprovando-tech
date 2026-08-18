import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';

import { UsersModule } from './modules/users/users.module';
import { PdfProcessingModule } from './modules/pdf-processing/pdf-processing.module';
import { EditaisModule } from './modules/editais/editais.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { UserSchedulesModule } from './modules/user-schedules/user-schedules.module';

const env = process.env.NODE_ENV || 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${env}.local`,
        `.env.${env}`,
        '.env.local',
        '.env',
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', '127.0.0.1');
        const port = Number(configService.get<string | number>('REDIS_PORT', 6379));
        const password = configService.get<string>('REDIS_PASSWORD');
        const isTls = configService.get<string>('REDIS_TLS') === 'true';

        return {
          connection: {
            host,
            port,
            ...(password ? { password } : {}),
            ...(isTls ? { tls: {} } : {}),
            connectTimeout: 5000,
            retryStrategy: (times) => {
              if (times > 3) return null;
              return Math.min(times * 500, 2000);
            },
          },
        };
      },
    }),
    AuthModule,
    UsersModule,
    PdfProcessingModule,
    EditaisModule,
    QuestionsModule,
    UserSchedulesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}


