import { Module } from '@nestjs/common';
import { UserSchedulesController } from './user-schedules.controller';
import { UserSchedulesService } from './user-schedules.service';
import { SupabaseService } from '../../services/supabase.service';

@Module({
  controllers: [UserSchedulesController],
  providers: [UserSchedulesService, SupabaseService],
  exports: [UserSchedulesService],
})
export class UserSchedulesModule {}
