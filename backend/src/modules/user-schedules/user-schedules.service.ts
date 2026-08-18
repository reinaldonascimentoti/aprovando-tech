import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class UserSchedulesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getUserSchedule(userId: string, editalId: string) {
    return this.supabaseService.getUserSchedule(userId, editalId);
  }

  async getUserSchedules(userId: string) {
    return this.supabaseService.getUserSchedules(userId);
  }

  async upsertUserSchedule(
    userId: string,
    editalId: string,
    payload: { horas_por_dia?: number; dias_por_semana?: number; data_prova?: string },
  ) {
    return this.supabaseService.upsertUserSchedule(userId, editalId, payload);
  }

  async deleteUserSchedule(userId: string, editalId: string) {
    return this.supabaseService.deleteUserSchedule(userId, editalId);
  }
}
