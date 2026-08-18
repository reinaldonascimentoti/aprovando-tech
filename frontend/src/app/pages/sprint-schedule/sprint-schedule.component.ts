import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { getBancaLogo, getBancaInfo, BancaInfo } from '../../utils/banca.utils';

@Component({
  selector: 'app-sprint-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] transition-colors duration-300 p-4 md:p-8 max-w-7xl mx-auto">
      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <button (click)="goBack()" class="btn-neo px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <span class="material-symbols-outlined !text-[18px]">arrow_back</span>
            <span>Voltar ao Painel</span>
          </button>
          <button (click)="themeService.toggle()" class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-[var(--on-surface)] transition-all cursor-pointer" [title]="themeService.isDark() ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'">
            <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
            <span>{{ themeService.isDark() ? 'Claro' : 'Escuro' }}</span>
          </button>
        </div>
        <span class="bg-[var(--primary-container)]/20 text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-extrabold px-3 py-1 rounded-full">
          Cronograma Semanal Inteligente
        </span>
      </div>

      <!-- Main Header Card -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl md:text-3xl font-black text-[var(--on-surface)] mb-2">
              Cronograma de Estudos - {{ edital?.title || 'Edital Concurso' }}
            </h1>
            <!-- Concurso Info Badges -->
            <div class="flex flex-wrap gap-2 mb-2" *ngIf="concursoInfo">
              <span *ngIf="concursoInfo.concurso" class="inline-flex items-center gap-1 bg-[var(--primary-container)]/20 text-[var(--primary)] border border-[var(--primary)]/30 text-[11px] font-extrabold px-3 py-1 rounded-full">
                <span class="material-symbols-outlined !text-[13px]">emoji_events</span>
                {{ concursoInfo.concurso }}
              </span>
              <span *ngIf="concursoInfo.cargo" class="inline-flex items-center gap-1 bg-[var(--secondary-container)]/20 text-[var(--secondary)] border border-[var(--secondary)]/30 text-[11px] font-extrabold px-3 py-1 rounded-full">
                <span class="material-symbols-outlined !text-[13px]">badge</span>
                {{ concursoInfo.cargo }}
              </span>
              <span *ngIf="concursoInfo.data_prova" class="inline-flex items-center gap-1 bg-[var(--tertiary-container)]/20 text-[var(--tertiary)] border border-[var(--tertiary)]/30 text-[11px] font-extrabold px-3 py-1 rounded-full">
                <span class="material-symbols-outlined !text-[13px]">event</span>
                Prova: {{ concursoInfo.data_prova }}
              </span>
              <span *ngIf="concursoInfo.banca" class="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-xs">
                <span *ngIf="getBanca(concursoInfo.banca)" class="h-4 w-7 flex items-center justify-center bg-white rounded px-0.5 shadow-xs">
                  <img [src]="getBanca(concursoInfo.banca)?.logo" [alt]="concursoInfo.banca" class="max-h-full max-w-full object-contain" />
                </span>
                <span *ngIf="!getBanca(concursoInfo.banca)" class="material-symbols-outlined !text-[13px]">shield</span>
                {{ concursoInfo.banca }}
              </span>
            </div>
            <p class="text-xs text-[var(--on-surface-variant)]">
              Organizado por subtópico com proporção 30% Teoria / 50% Exercícios / 20% Revisão. Marque os itens concluídos.
            </p>
          </div>

          <div class="neo-pressed p-4 rounded-2xl flex items-center gap-4 shrink-0">
            <div class="w-12 h-12 rounded-xl neo-raised flex items-center justify-center text-[var(--primary)] font-bold">
              <span class="material-symbols-outlined !text-[28px]">speed</span>
            </div>
            <div>
              <p class="text-xs font-bold text-[var(--on-surface-variant)]">Progresso Geral</p>
              <h3 class="text-xl font-extrabold text-[var(--primary)]">{{ overallProgress }}% Concluído</h3>
            </div>
          </div>
        </div>

        <!-- Overall Progress Bar -->
        <div class="w-full h-3 neo-pressed rounded-full overflow-hidden p-0.5">
          <div class="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[#8455ef] rounded-full transition-all duration-500" [style.width.%]="overallProgress"></div>
        </div>

        <!-- Proportion Legend -->
        <div class="flex flex-wrap gap-4 pt-2">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-[#433fe5]"></div>
            <span class="text-[11px] font-bold text-[var(--on-surface-variant)]">Teoria (30%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-[#6b38d4]"></div>
            <span class="text-[11px] font-bold text-[var(--on-surface-variant)]">Exercícios (50%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-[#00845a]"></div>
            <span class="text-[11px] font-bold text-[var(--on-surface-variant)]">Revisão (20%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-[#e65100]"></div>
            <span class="text-[11px] font-bold text-[var(--on-surface-variant)]">Revisão Espaçada</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- CRONOGRAMA POR SEMANAS (from cronograma_estudos)          -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div *ngIf="semanas.length" class="space-y-6 mb-8">
        <div *ngFor="let semana of semanas; let si = index" class="neo-raised rounded-3xl p-6 md:p-8 space-y-5">
          
          <!-- Semana Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--outline-variant)]/40 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl neo-pressed flex items-center justify-center text-[var(--primary)] font-extrabold text-sm">
                S{{ semana.numero }}
              </div>
              <div>
                <h2 class="text-base font-bold text-[var(--on-surface)]">{{ semana.titulo }}</h2>
                <span class="text-[11px] text-[var(--on-surface-variant)]">{{ semana.blocos?.length || 0 }} blocos de estudo</span>
              </div>
            </div>

            <!-- Semana Proportion Bars -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold text-[var(--on-surface-variant)]">T/E/R:</span>
                <div class="w-24 h-2 rounded-full overflow-hidden flex bg-[var(--surface-container)]">
                  <div class="h-full bg-[#433fe5]" [style.width.%]="getProportionForSemana(semana, 'teoria')"></div>
                  <div class="h-full bg-[#6b38d4]" [style.width.%]="getProportionForSemana(semana, 'exercicios')"></div>
                  <div class="h-full bg-[#00845a]" [style.width.%]="getProportionForSemana(semana, 'revisao')"></div>
                </div>
              </div>
              <span class="text-[11px] font-bold text-[var(--primary)]">{{ getSemanaProgress(si) }}%</span>
            </div>
          </div>

          <!-- Blocos de Estudo -->
          <div class="space-y-2.5">
            <div *ngFor="let bloco of semana.blocos; let bi = index" 
              (click)="toggleBloco(si, bi)"
              class="rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.001] border-l-4"
              [class.neo-pressed]="!isBlocoCompleted(si, bi)"
              [ngClass]="{
                'bg-emerald-500/15': isBlocoCompleted(si, bi),
                'border-[#433fe5]': bloco.tipo_atividade === 'teoria',
                'border-[#6b38d4]': bloco.tipo_atividade === 'exercicios',
                'border-[#00845a]': bloco.tipo_atividade === 'revisao' && !bloco.semana_revisao_espacada,
                'border-[#e65100]': bloco.tipo_atividade === 'revisao' && bloco.semana_revisao_espacada
              }">

              <div class="flex items-center gap-3 flex-1 min-w-0">
                <!-- Checkbox -->
                <div class="w-5 h-5 rounded-md neo-raised flex items-center justify-center transition-colors shrink-0"
                     [class.bg-[#00845a]]="isBlocoCompleted(si, bi)" [class.text-white]="isBlocoCompleted(si, bi)">
                  <span *ngIf="isBlocoCompleted(si, bi)" class="material-symbols-outlined !text-[14px]">check</span>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold text-[var(--on-surface)] truncate" 
                          [class.line-through]="isBlocoCompleted(si, bi)" 
                          [class.opacity-60]="isBlocoCompleted(si, bi)">
                      {{ bloco.subtopico }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span class="text-[10px] text-[var(--on-surface-variant)]">{{ bloco.disciplina }}</span>
                    <span *ngIf="bloco.semana_revisao_espacada" 
                          class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      ↻ Revisão espaçada na S{{ bloco.semana_revisao_espacada }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <!-- Carga horária -->
                <span class="neo-pressed px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-[var(--on-surface)]">
                  {{ bloco.carga_horaria }}
                </span>

                <!-- Tipo badge -->
                <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap"
                      [ngClass]="{
                        'bg-[var(--primary-container)]/20 text-[var(--primary)]': bloco.tipo_atividade === 'teoria',
                        'bg-[var(--secondary-container)]/20 text-[var(--secondary)]': bloco.tipo_atividade === 'exercicios',
                        'bg-[var(--tertiary-container)]/20 text-[var(--tertiary)]': bloco.tipo_atividade === 'revisao'
                      }">
                  {{ bloco.tipo_atividade === 'teoria' ? '📖 Teoria' : (bloco.tipo_atividade === 'exercicios' ? '✍️ Exercícios' : '🔄 Revisão') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- SPRINTS (backward compatible — fallback view)             -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div *ngIf="!semanas.length && sprints.length" class="space-y-8 mb-8">
        <div *ngFor="let sprint of sprints; let i = index" class="neo-raised rounded-3xl p-6 md:p-8 space-y-6">
          
          <!-- Sprint Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--outline-variant)]/40 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl neo-pressed flex items-center justify-center text-[var(--primary)] font-extrabold text-sm">
                S{{ i + 1 }}
              </div>
              <div>
                <h2 class="text-lg font-bold text-[var(--on-surface)]">{{ sprint.title }}</h2>
                <span class="text-xs text-[var(--on-surface-variant)]">Duração recomendada: <strong>{{ sprint.duration }}</strong></span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-[var(--on-surface-variant)]">Progresso da Sprint:</span>
              <span class="text-sm font-extrabold text-[var(--primary)]">{{ sprint.progress }}%</span>
              <div class="w-24 h-2.5 neo-pressed rounded-full overflow-hidden p-0.5">
                <div class="h-full bg-[var(--primary)] rounded-full transition-all duration-300" [style.width.%]="sprint.progress"></div>
              </div>
            </div>
          </div>

          <!-- Sprint Topics Checkbox List -->
          <div class="space-y-3">
            <div *ngFor="let topic of sprint.topics" 
              (click)="toggleTopic(topic)"
              [ngClass]="{
                'bg-emerald-500/15 border-l-4 border-[#00845a]': topic.completed,
                'neo-pressed': !topic.completed
              }"
              class="rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.002]">
              
              <div class="flex items-center gap-4">
                <!-- Neomorphic Checkbox Box -->
                <div class="w-6 h-6 rounded-lg neo-raised flex items-center justify-center transition-colors shrink-0"
                     [class.bg-[#00845a]]="topic.completed" [class.text-white]="topic.completed">
                  <span *ngIf="topic.completed" class="material-symbols-outlined !text-[18px]">check</span>
                </div>

                <div>
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-xs font-bold text-[var(--on-surface)]" [class.line-through]="topic.completed" [class.opacity-60]="topic.completed">
                      {{ topic.name }}
                    </span>
                    <span *ngIf="topic.is_pareto" class="bg-[var(--primary-container)]/20 text-[var(--primary)] text-[10px] font-extrabold px-2 py-0.5 rounded">
                      Foco Pareto 80/20
                    </span>
                  </div>
                  <span class="text-xs text-[var(--on-surface-variant)]">Disciplina: <strong>{{ topic.subject }}</strong> • Peso: {{ topic.weight }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-wrap justify-end">
                <span *ngIf="topic.usa_banco_questoes" class="inline-flex items-center gap-1 bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  <span class="material-symbols-outlined !text-[12px]">quiz</span>
                  Banco de Questões
                </span>
                <span 
                  [ngClass]="{
                    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400': topic.completed,
                    'bg-[var(--surface-container)] text-[var(--on-surface-variant)]': !topic.completed
                  }"
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
  public themeService = inject(ThemeService);
  @Input() editalId = 'ed-1';
  edital: any = null;
  paretoData: any = null;
  sprints: any[] = [];
  semanas: any[] = [];
  user: UserProfile | null = null;
  completedBlocos = new Set<string>();

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
    this.apiService.getEditalDetails(this.editalId).subscribe(res => {
      const ed = res?.data || res;
      this.edital = ed;
      let pd = ed?.pareto_data || ed;
      if (typeof pd === 'string') {
        try { pd = JSON.parse(pd); } catch (e) {}
      }
      this.paretoData = pd;
      this.semanas = pd?.cronograma_estudos?.semanas || [];
      this.sprints = pd?.sprints || [];
    });
  }

  get concursoInfo(): any {
    return this.paretoData?.concurso_info || null;
  }

  get usaBancoQuestoes(): boolean {
    return this.paretoData?.usa_banco_questoes || false;
  }

  get overallProgress(): number {
    if (this.semanas.length > 0) {
      let totalBlocos = 0;
      let completedCount = 0;
      for (let si = 0; si < this.semanas.length; si++) {
        for (let bi = 0; bi < (this.semanas[si].blocos?.length || 0); bi++) {
          totalBlocos++;
          if (this.isBlocoCompleted(si, bi)) completedCount++;
        }
      }
      return totalBlocos > 0 ? Math.round((completedCount / totalBlocos) * 100) : 0;
    }

    // Fallback to sprints
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

  getSemanaProgress(semanaIndex: number): number {
    const semana = this.semanas[semanaIndex];
    if (!semana?.blocos?.length) return 0;
    let completed = 0;
    for (let bi = 0; bi < semana.blocos.length; bi++) {
      if (this.isBlocoCompleted(semanaIndex, bi)) completed++;
    }
    return Math.round((completed / semana.blocos.length) * 100);
  }

  getProportionForSemana(semana: any, tipo: string): number {
    if (!semana?.blocos?.length) return 0;
    const total = semana.blocos.length;
    const count = semana.blocos.filter((b: any) => b.tipo_atividade === tipo).length;
    return Math.round((count / total) * 100);
  }

  toggleBloco(semanaIndex: number, blocoIndex: number) {
    const key = `${semanaIndex}-${blocoIndex}`;
    if (this.completedBlocos.has(key)) {
      this.completedBlocos.delete(key);
    } else {
      this.completedBlocos.add(key);
    }
  }

  isBlocoCompleted(semanaIndex: number, blocoIndex: number): boolean {
    return this.completedBlocos.has(`${semanaIndex}-${blocoIndex}`);
  }

  toggleTopic(topic: any) {
    this.apiService.toggleTopic(this.editalId, topic.id, this.user?.id || 'usr-2').subscribe({
      next: (res) => {
        this.edital = res.data;
        this.sprints = res.data?.pareto_data?.sprints || [];
        this.semanas = res.data?.pareto_data?.cronograma_estudos?.semanas || [];
      }
    });
  }

  goBack() {
    window.history.back();
  }

  getBanca(text: string | null | undefined): BancaInfo | null {
    return getBancaInfo(text);
  }
}
