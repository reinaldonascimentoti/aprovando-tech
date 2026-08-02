import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pareto-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#f7f9fc] p-4 md:p-8 max-w-7xl mx-auto">
      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between mb-6">
        <button (click)="goBack()" class="btn-neo px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span class="material-symbols-outlined !text-[18px]">arrow_back</span>
          <span>Voltar ao Painel</span>
        </button>
        <span class="bg-[#e9ddff] text-[#5516be] text-xs font-extrabold px-3 py-1 rounded-full">
          Pareto 3 Camadas (Macro → Meso → Micro)
        </span>
      </div>

      <!-- Main Edital Pareto Header -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl md:text-3xl font-black text-[#191c1e] mb-1">{{ edital?.title || 'Análise de Edital' }}</h1>
            <p class="text-xs text-[#464556]">Análise Pareto 80/20 em 3 camadas: Disciplinas → Tópicos → Subtópicos com custo-benefício.</p>
          </div>
          <a [routerLink]="['/sprints', editalId]" class="btn-mesh px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">calendar_month</span>
            <span>Ver Cronograma Semanal</span>
          </a>
        </div>

        <div class="p-4 rounded-2xl bg-[#eefff2] border border-[#6ffbbe] text-xs text-[#005236] flex items-start gap-3">
          <span class="material-symbols-outlined text-[#00845a] !text-[20px] shrink-0">lightbulb</span>
          <p>{{ paretoData?.relevance_summary || '82% dos pontos da prova concentram-se no núcleo vital de matérias abaixo.' }}</p>
        </div>
      </div>

      <!-- Pareto 3-Layer Key Metrics Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div class="neo-raised rounded-2xl p-5 flex flex-col justify-center items-center text-center">
          <span class="text-[11px] font-bold text-[#464556] mb-1">Disciplinas</span>
          <span class="text-3xl font-black text-[#6b38d4]">{{ paretoData?.total_subjects || 0 }}</span>
          <span class="text-[10px] text-[#767587] mt-0.5">Analisadas</span>
        </div>
        <div class="neo-raised rounded-2xl p-5 flex flex-col justify-center items-center text-center">
          <span class="text-[11px] font-bold text-[#464556] mb-1">Prioritárias (20%)</span>
          <span class="text-3xl font-black text-[#433fe5]">{{ paretoData?.high_priority_subjects || 0 }}</span>
          <span class="text-[10px] text-[#767587] mt-0.5">Foco Pareto</span>
        </div>
        <div class="neo-raised rounded-2xl p-5 flex flex-col justify-center items-center text-center">
          <span class="text-[11px] font-bold text-[#464556] mb-1">Cobertura</span>
          <span class="text-3xl font-black text-[#00845a]">{{ paretoData?.coverage_percentage || 0 }}%</span>
          <span class="text-[10px] text-[#767587] mt-0.5">Dos pontos</span>
        </div>
        <div class="neo-raised rounded-2xl p-5 flex flex-col justify-center items-center text-center">
          <span class="text-[11px] font-bold text-[#464556] mb-1">Tópicos 🔥</span>
          <span class="text-3xl font-black text-[#ba1a1a]">{{ paretoData?.total_hot_topics || 0 }}</span>
          <span class="text-[10px] text-[#767587] mt-0.5">Quentes</span>
        </div>
        <div class="neo-raised rounded-2xl p-5 flex flex-col justify-center items-center text-center">
          <span class="text-[11px] font-bold text-[#464556] mb-1">Subtópicos ⚡</span>
          <span class="text-3xl font-black text-[#006847]">{{ paretoData?.total_high_cb_subtopics || 0 }}</span>
          <span class="text-[10px] text-[#767587] mt-0.5">Alto custo-benefício</span>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- CAMADA 1 — MAPA DE PRIORIDADES (Disciplinas)              -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8">
        <h2 class="text-lg font-bold text-[#191c1e] mb-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#433fe5]">layers</span>
          <span>Camada 1 — Mapa de Prioridades (Macro)</span>
        </h2>
        <p class="text-xs text-[#767587] mb-6">Clique em uma disciplina para expandir os tópicos (Camada 2) e subtópicos (Camada 3).</p>

        <!-- Disciplinas Table Header -->
        <div class="hidden md:grid grid-cols-12 gap-2 px-5 py-2 text-[11px] font-bold text-[#464556] uppercase border-b border-[#c7c4d8]/40 mb-3">
          <div class="col-span-4">Disciplina</div>
          <div class="col-span-2 text-center">% Questões</div>
          <div class="col-span-2 text-center">Prioridade</div>
          <div class="col-span-2 text-center">% do Tempo</div>
          <div class="col-span-2 text-center">Barra</div>
        </div>

        <!-- Disciplina Rows (Accordion) -->
        <div class="space-y-3">
          <div *ngFor="let disc of disciplinas; let i = index">
            <!-- Disciplina Row -->
            <div 
              (click)="toggleDisciplina(i)" 
              class="neo-pressed rounded-2xl p-4 md:p-5 cursor-pointer transition-all hover:scale-[1.002]"
              [class.border-l-4]="disc.prioridade === 'PRIORITÁRIA'"
              [class.border-[#433fe5]]="disc.prioridade === 'PRIORITÁRIA'">
              
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2 items-center">
                <div class="col-span-4 flex items-center gap-3">
                  <span class="material-symbols-outlined !text-[18px] text-[#433fe5] transition-transform duration-200" 
                        [class.rotate-90]="expandedDisciplinas.has(i)">
                    chevron_right
                  </span>
                  <div>
                    <h3 class="text-sm font-bold text-[#191c1e]">{{ disc.nome }}</h3>
                    <span class="text-[10px] text-[#767587] md:hidden">{{ disc.percentual_questoes }}% questões • {{ disc.percentual_tempo }}% tempo</span>
                  </div>
                </div>
                <div class="col-span-2 text-center hidden md:block">
                  <span class="text-sm font-extrabold text-[#191c1e]">{{ disc.percentual_questoes }}%</span>
                </div>
                <div class="col-span-2 text-center hidden md:block">
                  <span 
                    class="text-[11px] font-extrabold px-3 py-1 rounded-full"
                    [ngClass]="{
                      'bg-[#e1dfff] text-[#2b20d2]': disc.prioridade === 'PRIORITÁRIA',
                      'bg-[#e9ddff] text-[#5516be]': disc.prioridade === 'COMPLEMENTAR',
                      'bg-[#eceef1] text-[#767587]': disc.prioridade === 'RESIDUAL'
                    }">
                    {{ disc.prioridade }}
                  </span>
                </div>
                <div class="col-span-2 text-center hidden md:block">
                  <span class="text-sm font-bold text-[#6b38d4]">{{ disc.percentual_tempo }}%</span>
                </div>
                <div class="col-span-2 hidden md:block">
                  <div class="w-full h-2.5 neo-pressed rounded-full overflow-hidden p-0.5">
                    <div 
                      class="h-full rounded-full transition-all duration-500 bg-gradient-to-r"
                      [ngClass]="{
                        'from-[#433fe5] to-[#8455ef]': disc.prioridade === 'PRIORITÁRIA',
                        'from-[#6b38d4] to-[#d0bcff]': disc.prioridade === 'COMPLEMENTAR',
                        'from-[#767587] to-[#c7c4d8]': disc.prioridade === 'RESIDUAL'
                      }"
                      [style.width.%]="disc.percentual_questoes">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ═══════════════════════════════════════════════════ -->
            <!-- CAMADA 2 — TÓPICOS (Meso) — Expanded content      -->
            <!-- ═══════════════════════════════════════════════════ -->
            <div *ngIf="expandedDisciplinas.has(i)" class="ml-4 md:ml-8 mt-2 space-y-2 animate-fadeIn">
              
              <!-- Tópicos Header -->
              <div class="hidden md:grid grid-cols-12 gap-2 px-4 py-1.5 text-[10px] font-bold text-[#464556] uppercase">
                <div class="col-span-4">Tópico</div>
                <div class="col-span-2 text-center">Frequência Histórica</div>
                <div class="col-span-2 text-center">Temperatura</div>
                <div class="col-span-2 text-center">Ordem</div>
                <div class="col-span-2 text-center">Subtópicos</div>
              </div>

              <div *ngFor="let topico of disc.camada_2_topicos; let j = index">
                <!-- Tópico Row -->
                <div 
                  (click)="toggleTopico(i, j); $event.stopPropagation()"
                  class="neo-raised rounded-xl p-3 md:p-4 cursor-pointer transition-all hover:scale-[1.001]"
                  [class.border-l-3]="topico.temperatura === 'QUENTE'"
                  [class.border-[#ba1a1a]]="topico.temperatura === 'QUENTE'">

                  <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <div class="col-span-4 flex items-center gap-2">
                      <span *ngIf="topico.camada_3_subtopicos?.length" 
                            class="material-symbols-outlined !text-[16px] text-[#6b38d4] transition-transform duration-200"
                            [class.rotate-90]="expandedTopicos.has(i + '-' + j)">
                        chevron_right
                      </span>
                      <span *ngIf="!topico.camada_3_subtopicos?.length" class="w-4"></span>
                      <div>
                        <span class="text-xs font-bold text-[#191c1e]">{{ topico.nome }}</span>
                        <span class="text-[10px] text-[#767587] block md:hidden">{{ topico.frequencia_historica }} • {{ topico.temperatura }}</span>
                      </div>
                    </div>
                    <div class="col-span-2 text-center hidden md:block">
                      <span class="text-[11px] font-semibold text-[#464556]">{{ topico.frequencia_historica }}</span>
                    </div>
                    <div class="col-span-2 text-center hidden md:block">
                      <span 
                        class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md"
                        [ngClass]="{
                          'bg-[#ffdad6] text-[#93000a]': topico.temperatura === 'QUENTE',
                          'bg-[#fff3e0] text-[#e65100]': topico.temperatura === 'MORNO',
                          'bg-[#e3f2fd] text-[#1565c0]': topico.temperatura === 'FRIO'
                        }">
                        {{ topico.temperatura === 'QUENTE' ? '🔥 QUENTE' : topico.temperatura === 'MORNO' ? '🌡️ MORNO' : '❄️ FRIO' }}
                      </span>
                    </div>
                    <div class="col-span-2 text-center hidden md:block">
                      <span class="text-xs font-bold text-[#433fe5]">#{{ topico.ordem_estudo }}</span>
                    </div>
                    <div class="col-span-2 text-center hidden md:block">
                      <span class="text-[11px] font-semibold text-[#767587]">{{ topico.camada_3_subtopicos?.length || 0 }} itens</span>
                    </div>
                  </div>
                </div>

                <!-- ═══════════════════════════════════════════ -->
                <!-- CAMADA 3 — SUBTÓPICOS (Micro)              -->
                <!-- ═══════════════════════════════════════════ -->
                <div *ngIf="expandedTopicos.has(i + '-' + j) && topico.camada_3_subtopicos?.length" 
                     class="ml-4 md:ml-8 mt-1.5 space-y-1.5 animate-fadeIn">
                  
                  <!-- Subtópicos Header -->
                  <div class="hidden md:grid grid-cols-12 gap-2 px-3 py-1 text-[9px] font-bold text-[#464556] uppercase border-b border-[#c7c4d8]/30">
                    <div class="col-span-4">Subtópico</div>
                    <div class="col-span-2 text-center">Frequência</div>
                    <div class="col-span-2 text-center">Dificuldade</div>
                    <div class="col-span-2 text-center">Custo-Benefício</div>
                    <div class="col-span-2 text-center">Incluir?</div>
                  </div>

                  <div *ngFor="let sub of topico.camada_3_subtopicos" 
                       class="rounded-lg p-3 transition-all"
                       [ngClass]="sub.incluir ? 'bg-[#eefff2]/60 neo-raised-sm' : 'bg-[#fafafa] opacity-60'">
                    
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                      <div class="col-span-4">
                        <span class="text-[11px] font-semibold text-[#191c1e]" [class.line-through]="!sub.incluir">{{ sub.nome }}</span>
                        <p class="text-[10px] text-[#767587] mt-0.5 italic">{{ sub.justificativa }}</p>
                      </div>
                      <div class="col-span-2 text-center hidden md:block">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded"
                              [ngClass]="{
                                'bg-[#e1dfff] text-[#2b20d2]': sub.frequencia === 'Alta',
                                'bg-[#eceef1] text-[#464556]': sub.frequencia === 'Média',
                                'bg-[#f5f5f5] text-[#767587]': sub.frequencia === 'Baixa'
                              }">
                          {{ sub.frequencia }}
                        </span>
                      </div>
                      <div class="col-span-2 text-center hidden md:block">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded"
                              [ngClass]="{
                                'bg-[#eefff2] text-[#005236]': sub.dificuldade === 'Fácil',
                                'bg-[#fff3e0] text-[#e65100]': sub.dificuldade === 'Médio',
                                'bg-[#ffdad6] text-[#93000a]': sub.dificuldade === 'Difícil'
                              }">
                          {{ sub.dificuldade }}
                        </span>
                      </div>
                      <div class="col-span-2 text-center hidden md:block">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded"
                              [ngClass]="{
                                'bg-[#e1dfff] text-[#2b20d2]': sub.custo_beneficio === 'Alto',
                                'bg-[#eceef1] text-[#464556]': sub.custo_beneficio === 'Médio',
                                'bg-[#f5f5f5] text-[#767587]': sub.custo_beneficio === 'Baixo'
                              }">
                          {{ sub.custo_beneficio }}
                        </span>
                      </div>
                      <div class="col-span-2 text-center hidden md:block">
                        <span *ngIf="sub.incluir" class="text-[11px] font-bold text-[#00845a] flex items-center justify-center gap-1">
                          <span class="material-symbols-outlined !text-[14px]">check_circle</span> SIM
                        </span>
                        <span *ngIf="!sub.incluir" class="text-[11px] font-bold text-[#93000a] flex items-center justify-center gap-1">
                          <span class="material-symbols-outlined !text-[14px]">cancel</span> NÃO
                        </span>
                      </div>
                    </div>

                    <!-- Mobile badges -->
                    <div class="flex flex-wrap gap-1.5 mt-2 md:hidden">
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eceef1] text-[#464556]">Freq: {{ sub.frequencia }}</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eceef1] text-[#464556]">Dif: {{ sub.dificuldade }}</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eceef1] text-[#464556]">CB: {{ sub.custo_beneficio }}</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded" 
                            [class.bg-[#eefff2]]="sub.incluir" [class.text-[#005236]]="sub.incluir"
                            [class.bg-[#ffdad6]]="!sub.incluir" [class.text-[#93000a]]="!sub.incluir">
                        {{ sub.incluir ? '✓ Incluir' : '✗ Pular' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- RÉGUA DE CORTE                                            -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div *ngIf="paretoData?.regua_de_corte?.nao_estudar?.length" class="neo-raised rounded-3xl p-6 md:p-8 mb-8">
        <h2 class="text-lg font-bold text-[#191c1e] mb-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#ba1a1a]">content_cut</span>
          <span>Régua de Corte — O que NÃO estudar</span>
        </h2>
        <p class="text-xs text-[#767587] mb-5">Itens de baixo retorno removidos para maximizar a eficiência do estudo.</p>

        <div class="space-y-3">
          <div *ngFor="let corte of paretoData.regua_de_corte.nao_estudar" 
               class="neo-pressed rounded-2xl p-4 border-l-4 border-[#ba1a1a]/40">
            <h4 class="text-sm font-bold text-[#191c1e] flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined !text-[16px] text-[#93000a]">block</span>
              {{ corte.item }}
            </h4>
            <p class="text-xs text-[#464556] mb-2"><strong>Motivo:</strong> {{ corte.motivo }}</p>
            <div class="bg-[#fff3e0] rounded-lg px-3 py-2 text-[11px] text-[#e65100] flex items-start gap-2">
              <span class="material-symbols-outlined !text-[14px] shrink-0 mt-0.5">swap_horiz</span>
              <span><strong>Trade-off:</strong> {{ corte.trade_off }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- ALERTAS DE BANCA                                          -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div *ngIf="paretoData?.alertas_banca" class="neo-raised rounded-3xl p-6 md:p-8 mb-8">
        <h2 class="text-lg font-bold text-[#191c1e] mb-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#6b38d4]">shield</span>
          <span>Alertas de Banca</span>
        </h2>
        <p class="text-xs text-[#767587] mb-5">Perfil da banca identificada e ajustes estratégicos recomendados.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div class="neo-pressed rounded-2xl p-4">
            <p class="text-[11px] font-bold text-[#464556] mb-1">Banca Identificada</p>
            <p class="text-base font-extrabold text-[#433fe5]">{{ paretoData.alertas_banca.banca_identificada }}</p>
          </div>
          <div class="neo-pressed rounded-2xl p-4">
            <p class="text-[11px] font-bold text-[#464556] mb-1">Estilo da Banca</p>
            <p class="text-xs font-semibold text-[#191c1e]">{{ paretoData.alertas_banca.estilo }}</p>
          </div>
        </div>

        <h3 class="text-sm font-bold text-[#191c1e] mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined !text-[16px] text-[#6b38d4]">tune</span>
          Ajustes Recomendados
        </h3>
        <div class="space-y-2">
          <div *ngFor="let ajuste of paretoData.alertas_banca.ajustes_recomendados" 
               class="bg-[#e9ddff]/40 rounded-xl px-4 py-3 text-xs text-[#464556] flex items-start gap-3">
            <span class="material-symbols-outlined !text-[16px] text-[#5516be] shrink-0 mt-0.5">arrow_right</span>
            <span>{{ ajuste }}</span>
          </div>
        </div>
      </div>

      <!-- Call to action -->
      <div class="neo-raised rounded-3xl p-6 flex flex-col sm:flex-row justify-center items-center gap-4">
        <a [routerLink]="['/sprints', editalId]" class="btn-mesh px-8 py-4 rounded-2xl text-base font-bold flex items-center gap-2">
          <span>Iniciar Cronograma Semanal de Estudos</span>
          <span class="material-symbols-outlined">arrow_forward</span>
        </a>
      </div>

    </div>
  `,
  styles: [`
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .neo-raised-sm {
      box-shadow: 3px 3px 6px #d1d9e6, -3px -3px 6px rgba(255,255,255,0.8);
    }
    .border-l-3 {
      border-left-width: 3px;
    }
  `]
})
export class ParetoAnalysisComponent implements OnInit {
  @Input() editalId = 'ed-1';
  edital: any = null;
  paretoData: any = null;

  expandedDisciplinas = new Set<number>();
  expandedTopicos = new Set<string>();

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

  get disciplinas(): any[] {
    return this.paretoData?.camada_1_mapa_prioridades?.disciplinas || [];
  }

  toggleDisciplina(index: number) {
    if (this.expandedDisciplinas.has(index)) {
      this.expandedDisciplinas.delete(index);
    } else {
      this.expandedDisciplinas.add(index);
    }
  }

  toggleTopico(discIndex: number, topIndex: number) {
    const key = discIndex + '-' + topIndex;
    if (this.expandedTopicos.has(key)) {
      this.expandedTopicos.delete(key);
    } else {
      this.expandedTopicos.add(key);
    }
  }

  goBack() {
    window.history.back();
  }
}
