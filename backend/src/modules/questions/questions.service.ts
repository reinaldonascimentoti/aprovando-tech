import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getQuestions(isReleasedOnly = false) {
    return this.supabaseService.getQuestions(isReleasedOnly);
  }

  async getQualityAnalysis() {
    return this.supabaseService.getQualityAnalysis();
  }

  async getPublicStats() {
    return this.supabaseService.getPublicStats();
  }

  async importQuestions(questions: any[]) {
    return this.supabaseService.importJsonQuestions(questions);
  }

  async toggleReleaseStatus(id: string) {
    const updated = await this.supabaseService.toggleQuestionRelease(id);
    if (!updated) {
      throw new NotFoundException(`Questão ${id} não encontrada.`);
    }
    return updated;
  }

  async updateQuestion(id: string, data: any) {
    const updated = await this.supabaseService.updateQuestion(id, data);
    if (!updated) {
      throw new NotFoundException(`Questão ${id} não encontrada para atualização.`);
    }
    return updated;
  }

  async deleteQuestion(id: string) {
    const deleted = await this.supabaseService.deleteQuestion(id);
    if (!deleted) {
      throw new NotFoundException(`Questão ${id} não encontrada para exclusão.`);
    }
    return { success: true };
  }
}
