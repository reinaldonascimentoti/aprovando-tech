import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pareto-analysis',
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
        <span class="bg-[#e9ddff] text-[#5516be] text-xs font-extrabold px-3 py-1 rounded-full">
          Algoritmo Pareto 80/20 Ativo
        </span>
      </div>

      <!-- Main Edital Pareto Header -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl md:text-3xl font-black text-[#191c1e] mb-1">{{ edital?.title || 'Análise de Edital' }}</h1>
            <p class="text-xs text-[#464556]">Identificação dos 20% das matérias de maior retorno para otimização de tempo de estudo.</p>
          </div>
          <a [routerLink]="['/sprints', editalId]" class="btn-mesh px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">calendar_month</span>
            <span>Acessar Cronograma em Sprints</span>
          </a>
        </div>

        <div class="p-4 rounded-2xl bg-[#eefff2] border border-[#6ffbbe] text-xs text-[#005236] flex items-start gap-3">
          <span class="material-symbols-outlined text-[#00845a] !text-[20px] shrink-0">lightbulb</span>
          <p>{{ paretoData?.relevance_summary || '80% dos pontos da prova concentram-se no núcleo vital de matérias abaixo.' }}</p>
        </div>
      </div>

      <!-- Pareto 80/20 Key Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div class="neo-raised rounded-3xl p-6 flex flex-col justify-center items-center text-center">
          <span class="text-xs font-bold text-[#464556] mb-1">Matérias Vitais (20%)</span>
          <span class="text-4xl font-black text-[#433fe5]">{{ paretoData?.high_priority_subjects || 2 }}</span>
          <span class="text-[11px] text-[#767587] mt-1">Disciplinas com alta recorrência</span>
        </div>

        <div class="neo-raised rounded-3xl p-6 flex flex-col justify-center items-center text-center">
          <span class="text-xs font-bold text-[#464556] mb-1">Cobertura Estimada de Pontos</span>
          <span class="text-4xl font-black text-[#00845a]">{{ paretoData?.coverage_percentage || 82 }}%</span>
          <span class="text-[11px] text-[#767587] mt-1">Pontuação garantida com 20% de esforço</span>
        </div>

        <div class="neo-raised rounded-3xl p-6 flex flex-col justify-center items-center text-center">
          <span class="text-xs font-bold text-[#464556] mb-1">Disciplinas Analisadas</span>
          <span class="text-4xl font-black text-[#6b38d4]">{{ paretoData?.total_subjects || 6 }}</span>
          <span class="text-[11px] text-[#767587] mt-1">Total de conteúdos do edital</span>
        </div>
      </div>

      <!-- Pareto Priority Ranking Table -->
      <div class="neo-raised rounded-3xl p-6 md:p-8">
        <h2 class="text-lg font-bold text-[#191c1e] mb-4 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#433fe5]">format_list_bulleted</span>
          <span>Ranking de Relevância por Matéria</span>
        </h2>

        <div class="space-y-4">
          <div *ngFor="let subject of paretoData?.subjects" class="neo-pressed rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1 max-w-lg">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-[#191c1e]">{{ subject.name }}</h3>
                <span 
                  [class.bg-[#e1dfff]]="subject.priority.includes('Alta')"
                  [class.text-[#2b20d2]]="subject.priority.includes('Alta')"
                  [class.bg-[#eceef1]]="!subject.priority.includes('Alta')"
                  [class.text-[#464556]]="!subject.priority.includes('Alta')"
                  class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md">
                  {{ subject.priority }}
                </span>
              </div>
              <p class="text-xs text-[#767587]">Status: <strong>{{ subject.status }}</strong></p>
            </div>

            <div class="sm:w-64 space-y-1">
              <div class="flex justify-between items-center text-xs font-bold">
                <span class="text-[#464556]">Relevância Histórica</span>
                <span class="text-[#433fe5]">{{ subject.weight }}%</span>
              </div>
              <div class="w-full h-3 neo-pressed rounded-full overflow-hidden p-0.5">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  [class.bg-gradient-to-r]="true"
                  [class.from-[#433fe5]]="true"
                  [class.to-[#8455ef]]="true"
                  [style.width.%]="subject.weight">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Call to action button -->
        <div class="mt-8 pt-6 border-t border-[#c7c4d8]/40 flex justify-center">
          <a [routerLink]="['/sprints', editalId]" class="btn-mesh px-8 py-4 rounded-2xl text-base font-bold flex items-center gap-2">
            <span>Iniciar Sprints de Estudo Baseadas neste Pareto</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
      </div>

    </div>
  `
})
export class ParetoAnalysisComponent implements OnInit {
  @Input() editalId = 'ed-1';
  edital: any = null;
  paretoData: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.editalId = idFromRoute;
    }
    this.loadParetoDetails();
  }

  loadParetoDetails() {
    this.apiService.getEditalDetails(this.editalId).subscribe(ed => {
      this.edital = ed;
      this.paretoData = ed?.pareto_data;
    });
  }

  goBack() {
    window.history.back();
  }
}
