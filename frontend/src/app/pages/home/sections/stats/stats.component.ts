import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { STATS, Stat } from '../../home.constants';
import { ApiService } from '../../../../services/api.service';
import { SupabaseService } from '../../../../services/supabase.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
})
export class StatsComponent implements OnInit {
  stats: Stat[] = STATS.map(s => ({ ...s }));

  constructor(
    private apiService: ApiService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  async loadStats(): Promise<void> {
    this.apiService.getPublicStats().subscribe({
      next: (data) => {
        if (data && (data.editaisCount > 0 || data.questoesCount > 0)) {
          this.applyStats(data.editaisCount, data.questoesCount, data.candidatosCount);
        } else {
          this.fallbackToSupabase();
        }
      },
      error: () => {
        this.fallbackToSupabase();
      }
    });
  }

  private async fallbackToSupabase(): Promise<void> {
    const data = await this.supabaseService.getPublicStats();
    this.applyStats(data.editaisCount, data.questoesCount, data.candidatosCount);
  }

  private applyStats(editaisCount: number, questoesCount: number, candidatosCount: number): void {
    this.stats = [
      {
        icon: 'description',
        value: editaisCount > 0 ? `${editaisCount.toLocaleString('pt-BR')}+` : '0+',
        label: 'Editais analisados'
      },
      {
        icon: 'quiz',
        value: questoesCount > 0 ? `${questoesCount.toLocaleString('pt-BR')}+` : '0+',
        label: 'Questões extraídas'
      },
      {
        icon: 'verified',
        value: '9.2/10',
        label: 'Score médio de qualidade IA'
      },
      {
        icon: 'group',
        value: candidatosCount > 0 ? `${candidatosCount.toLocaleString('pt-BR')}+` : '0+',
        label: 'Candidatos aprovados'
      }
    ];
  }
}

