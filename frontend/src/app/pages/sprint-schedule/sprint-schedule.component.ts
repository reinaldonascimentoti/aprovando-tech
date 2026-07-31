import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-sprint-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#f7f9fc] p-4 md:p-8 max-w-6xl mx-auto">
      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between mb-6">
        <button (click)="goBack()" class="btn-neo px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span class="material-symbols-outlined !text-[18px]">arrow_back</span>
          <span>Voltar ao Painel</span>
        </button>
        <span class="bg-[#e1dfff] text-[#09006b] text-xs font-extrabold px-3 py-1 rounded-full">
          Cronograma de Sprints Interativo
        </span>
      </div>

      <!-- Main Header Card -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl md:text-3xl font-black text-[#191c1e] mb-1">
              Cronograma em Sprints - {{ edital?.title || 'Edital Concurso' }}
            </h1>
            <p class="text-xs text-[#464556]">
              Marque os assuntos já estudados para atualizar seu progresso em tempo real e dominar os tópicos de maior peso.
            </p>
          </div>

          <div class="neo-pressed p-4 rounded-2xl flex items-center gap-4 shrink-0">
            <div class="w-12 h-12 rounded-xl neo-raised flex items-center justify-center text-[#433fe5] font-bold">
              <span class="material-symbols-outlined !text-[28px]">speed</span>
            </div>
            <div>
              <p class="text-xs font-bold text-[#464556]">Progresso Geral</p>
              <h3 class="text-xl font-extrabold text-[#433fe5]">{{ overallProgress }}% Concluído</h3>
            </div>
          </div>
        </div>

        <!-- Overall Progress Bar -->
        <div class="w-full h-3 neo-pressed rounded-full overflow-hidden p-0.5">
          <div class="h-full bg-gradient-to-r from-[#433fe5] via-[#6b38d4] to-[#8455ef] rounded-full transition-all duration-500" [style.width.%]="overallProgress"></div>
        </div>
      </div>

      <!-- Sprints Timeline -->
      <div class="space-y-8">
        <div *ngFor="let sprint of sprints; let i = index" class="neo-raised rounded-3xl p-6 md:p-8 space-y-6">
          
          <!-- Sprint Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c7c4d8]/40 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl neo-pressed flex items-center justify-center text-[#433fe5] font-extrabold text-sm">
                S{{ i + 1 }}
              </div>
              <div>
                <h2 class="text-lg font-bold text-[#191c1e]">{{ sprint.title }}</h2>
                <span class="text-xs text-[#767587]">Duração recomendada: <strong>{{ sprint.duration }}</strong></span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-[#464556]">Progresso da Sprint:</span>
              <span class="text-sm font-extrabold text-[#433fe5]">{{ sprint.progress }}%</span>
              <div class="w-24 h-2.5 neo-pressed rounded-full overflow-hidden p-0.5">
                <div class="h-full bg-[#433fe5] rounded-full transition-all duration-300" [style.width.%]="sprint.progress"></div>
              </div>
            </div>
          </div>

          <!-- Sprint Topics Checkbox List -->
          <div class="space-y-3">
            <div *ngFor="let topic of sprint.topics" 
              (click)="toggleTopic(topic)"
              [class.bg-[#eefff2]]="topic.completed"
              [class.border-l-4]="topic.completed"
              [class.border-[#00845a]]="topic.completed"
              class="neo-pressed rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.002]">
              
              <div class="flex items-center gap-4">
                <!-- Neomorphic Checkbox Box -->
                <div class="w-6 h-6 rounded-lg neo-raised flex items-center justify-center transition-colors shrink-0"
                     [class.bg-[#00845a]]="topic.completed" [class.text-white]="topic.completed">
                  <span *ngIf="topic.completed" class="material-symbols-outlined !text-[18px]">check</span>
                </div>

                <div>
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-xs font-bold text-[#191c1e]" [class.line-through]="topic.completed" [class.opacity-60]="topic.completed">
                      {{ topic.name }}
                    </span>
                    <span *ngIf="topic.is_pareto" class="bg-[#e1dfff] text-[#09006b] text-[10px] font-extrabold px-2 py-0.5 rounded">
                      Foco Pareto 80/20
                    </span>
                  </div>
                  <span class="text-xs text-[#767587]">Disciplina: <strong>{{ topic.subject }}</strong> • Peso: {{ topic.weight }}</span>
                </div>
              </div>

              <div>
                <span 
                  [class.bg-[#eefff2]]="topic.completed"
                  [class.text-[#005236]]="topic.completed"
                  [class.bg-[#eceef1]]="!topic.completed"
                  [class.text-[#767587]]="!topic.completed"
                  class="text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {{ topic.completed ? 'Concluído' : 'Pendente' }}
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  `
})
export class SprintScheduleComponent implements OnInit {
  @Input() editalId = 'ed-1';
  edital: any = null;
  sprints: any[] = [];
  user: UserProfile | null = null;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.editalId = idFromRoute;
    }
    this.loadEditalSprints();
  }

  loadEditalSprints() {
    this.apiService.getEditalDetails(this.editalId).subscribe(ed => {
      this.edital = ed;
      this.sprints = ed?.pareto_data?.sprints || [];
    });
  }

  get overallProgress(): number {
    if (!this.sprints || this.sprints.length === 0) return 0;
    let totalTopics = 0;
    let completedTopics = 0;
    for (const sprint of this.sprints) {
      for (const t of sprint.topics) {
        totalTopics++;
        if (t.completed) completedTopics++;
      }
    }
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  }

  toggleTopic(topic: any) {
    this.apiService.toggleTopic(this.editalId, topic.id, this.user?.id || 'usr-2').subscribe({
      next: (res) => {
        this.edital = res.data;
        this.sprints = res.data?.pareto_data?.sprints || [];
      }
    });
  }

  goBack() {
    window.history.back();
  }
}
