import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PdfProcessingModule } from './modules/pdf-processing/pdf-processing.module';
import { EditaisModule } from './modules/editais/editais.module';
import { QuestionsModule } from './modules/questions/questions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        connectTimeout: 3000,
        retryStrategy: () => null,
      },
    }),
    AuthModule,
    UsersModule,
    PdfProcessingModule,
    EditaisModule,
    QuestionsModule,
  ],
})
export class AppModule {}
