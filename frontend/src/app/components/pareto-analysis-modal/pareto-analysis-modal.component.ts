import { Component, Input, Output, EventEmitter, inject, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { getBancaInfo, BancaInfo } from '../../utils/banca.utils';

export interface ParetoLogStep {
  id: string;
  icon: string;
  title: string;
  detail: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  time?: string;
}

@Component({
  selector: 'app-pareto-analysis-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen"
         class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
         style="background: rgba(10, 12, 20, 0.70); backdrop-filter: blur(8px);">
      <div class="neo-raised rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden bg-white dark:bg-[#141927] border border-[var(--outline-variant)] my-auto flex flex-col max-h-[92vh]">

        <!-- ================= MODAL HEADER ================= -->
        <div class="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-[var(--outline-variant)] bg-gradient-to-r from-purple-50/70 dark:from-[#1b2238] to-white dark:to-[#141927] shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-all duration-300"
                 [ngClass]="{
                   'bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white': status === 'checking' || status === 'exists' || status === 'processing',
                   'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white': status === 'completed',
                   'bg-gradient-to-tr from-rose-500 to-red-600 text-white': status === 'error'
                 }">
              <span class="material-symbols-outlined !text-[20px] sm:!text-[22px]"
                    [ngClass]="{'animate-spin': status === 'processing' || status === 'checking'}">
                {{ status === 'error' ? 'report_problem' : (status === 'completed' ? 'task_alt' : (status === 'processing' ? 'sync' : (status === 'exists' ? 'fact_check' : 'donut_large'))) }}
              </span>
            </div>
            <div>
              <h2 class="text-sm sm:text-base font-extrabold text-[var(--on-surface)]">
                {{ status === 'checking' ? 'Consultando Análises Anteriores...' :
                   status === 'exists' ? 'Análise Pareto 80/20 Encontrada' :
                   status === 'error' ? 'Instabilidade na Análise' :
                   status === 'completed' ? 'Análise Pareto Concluída com Sucesso!' : 'Executando Análise Pareto 80/20' }}
              </h2>
              <p class="text-[10px] sm:text-[11px] font-semibold"
                 [ngClass]="status === 'error' ? 'text-red-500' : (status === 'completed' ? 'text-emerald-500' : 'text-[var(--primary)]')">
                {{ status === 'checking' ? 'Verificando histórico de priorizações deste edital...' :
                   status === 'exists' ? 'Princípio de Pareto 80/20 • Reutilização Inteligente' :
                   status === 'error' ? 'Serviço temporariamente indisponível' :
                   status === 'completed' ? 'Princípio Pareto 80/20 • Síntese Estratégica Pronta' : 'Princípio Pareto 80/20 • Extração Cognitiva' }}
              </p>
            </div>
          </div>
          <button (click)="close()" [disabled]="status === 'processing'"
                  class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[var(--on-surface-variant)] hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  [title]="status === 'processing' ? 'Aguarde o término do processamento' : 'Fechar'">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>

        <!-- ================= ESTADO 1: CARREGANDO / CONSULTANDO ================= -->
        <div *ngIf="status === 'checking'" class="px-6 py-10 flex flex-col items-center justify-center gap-3 text-center">
          <div class="w-10 h-10 border-3 border-purple-500/30 border-t-purple-600 rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-[var(--on-surface-variant)]">Verificando se já existe análise de Pareto pronta...</p>
        </div>

        <!-- ================= ESTADO 2: ANÁLISE PRONTA ENCONTRADA ================= -->
        <div *ngIf="status === 'exists'" class="px-4 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1 animate-fadeIn">
          <div class="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-[var(--on-surface)] space-y-3">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined text-purple-600 dark:text-purple-400 !text-[24px] shrink-0 mt-0.5">verified</span>
              <div class="space-y-1">
                <h3 class="text-sm font-extrabold text-purple-950 dark:text-purple-200">
                  Já existe uma análise calculada para este edital!
                </h3>
                <p class="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                  Identificamos uma Análise Pareto 80/20 já estruturada para este cargo e edital. Você pode utilizar o plano pronto instantaneamente ou solicitar uma nova execução completa com a IA.
                </p>
              </div>
            </div>

            <!-- Resumo das métricas da análise pronta -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/30 text-center">
              <div class="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/50">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Cobertura</span>
                <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">{{ existingParetoData?.coverage_percentage || 80 }}%</span>
              </div>
              <div class="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/50">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Disciplinas (20%)</span>
                <span class="text-sm font-black text-purple-600 dark:text-purple-400">{{ existingParetoData?.high_priority_subjects || existingDisciplineCount }}</span>
              </div>
              <div class="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/50">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Tópicos Quentes</span>
                <span class="text-sm font-black text-rose-500">{{ existingParetoData?.total_hot_topics || 'Mapeados' }}</span>
              </div>
              <div class="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/50">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Banca</span>
                <span class="text-xs font-black text-amber-600 truncate block">{{ getBancaName() }}</span>
              </div>
            </div>

            <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-wrap gap-1 pt-1">
              <span>Cargo: <strong class="text-[var(--on-surface)]">{{ effectiveCargo }}</strong></span>
              <span>Concurso: <strong class="text-[var(--on-surface)]">{{ effectiveConcurso }}</strong></span>
            </div>
          </div>

          <div class="rounded-2xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px]">help</span>
            <span>Deseja utilizar a análise pronta ou prefere executar uma nova análise do zero?</span>
          </div>

          <!-- Ações do Estado Exists -->
          <div class="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button (click)="useExistingAnalysis()"
                    class="btn-mesh flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">visibility</span>
              <span>Utilizar Análise Pronta</span>
            </button>
            <button (click)="startNewAnalysis()"
                    class="btn-neo flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-[var(--on-surface)] hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">refresh</span>
              <span>Fazer Nova Análise</span>
            </button>
          </div>
        </div>

        <!-- ================= ESTADO 3: SIMULAÇÃO DE LOGS IA (processing | completed | error) ================= -->
        <div *ngIf="status === 'processing' || status === 'completed' || status === 'error'"
             class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto flex-1 animate-fadeIn">

          <!-- Top Progress Card -->
          <div class="rounded-2xl p-4 neo-pressed bg-[var(--background)] border border-[var(--outline-variant)] space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full"
                      [ngClass]="status === 'error' ? 'bg-red-500' : (status === 'completed' ? 'bg-emerald-500' : 'bg-[#7c3aed] animate-ping')">
                </span>
                <span class="text-xs font-extrabold uppercase tracking-wider"
                      [ngClass]="status === 'error' ? 'text-red-500' : (status === 'completed' ? 'text-emerald-500' : 'text-[var(--primary)]')">
                  {{ status === 'error' ? 'Processamento Interrompido' : (status === 'completed' ? 'Processamento Finalizado com Sucesso' : 'Executando Análise Pareto 80/20') }}
                </span>
              </div>
              <span class="text-sm font-black text-[var(--on-surface)]">{{ progress }}%</span>
            </div>

            <!-- Animated Bar -->
            <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
              <div class="h-full rounded-full transition-all duration-500 ease-out"
                   [style.width.%]="progress"
                   [ngClass]="status === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' : (status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-[#5d3bf6] via-[#7c3aed] to-[#c084fc]')">
              </div>
            </div>

            <p class="text-[11px] text-[var(--on-surface-variant)] flex items-center justify-between flex-wrap gap-1">
              <span>Cargo Alvo: <strong class="text-[var(--on-surface)]">{{ effectiveCargo || 'Cargo Principal' }}</strong></span>
              <span *ngIf="effectiveConcurso" class="truncate max-w-[220px] text-right">Concurso: <strong class="text-[var(--on-surface)]">{{ effectiveConcurso }}</strong></span>
            </p>
          </div>

          <!-- Alerta e Apresentação de Mensagem de Sucesso -->
          <div *ngIf="status === 'completed'"
               class="rounded-2xl p-4 sm:p-5 bg-emerald-50/90 dark:bg-emerald-950/30 border-2 border-emerald-500/30 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex flex-col gap-3 animate-fadeIn shadow-sm">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <span class="material-symbols-outlined !text-[24px]">verified</span>
              </div>
              <div class="space-y-1 flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <h3 class="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                    Análise Pareto 80/20 Concluída com Sucesso!
                  </h3>
                  <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[13px]">check_circle</span> Pronto
                  </span>
                </div>
                <p class="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                  A inteligência artificial estruturou com êxito o núcleo vital de 20% das disciplinas e tópicos estratégicos que respondem por 80% da prova para <strong>{{ effectiveCargo }}</strong>.
                </p>
              </div>
            </div>

            <!-- Resumo das métricas extraídas se disponível -->
            <div *ngIf="completedMetrics" class="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-center">
              <div class="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Cobertura</span>
                <span class="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">{{ completedMetrics.coverage }}%</span>
              </div>
              <div class="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Disciplinas (20%)</span>
                <span class="text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400">{{ completedMetrics.subjects }}</span>
              </div>
              <div class="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Tópicos Quentes</span>
                <span class="text-xs sm:text-sm font-black text-rose-500">{{ completedMetrics.hotTopics }}</span>
              </div>
            </div>
          </div>

          <!-- Alerta de Instabilidade / Erro -->
          <div *ngIf="status === 'error'"
               class="rounded-2xl p-4 bg-red-500/10 border-2 border-red-500/30 dark:border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-3 animate-fadeIn">
            <span class="material-symbols-outlined !text-[24px] text-red-500 shrink-0 mt-0.5">cloud_off</span>
            <div class="space-y-1 text-xs">
              <h4 class="font-extrabold text-red-600 dark:text-red-400 text-xs sm:text-sm">
                Instabilidade no Serviço de Análise
              </h4>
              <p class="leading-relaxed">
                {{ errorMessage || 'Não foi possível concluir a análise Pareto com a inteligência artificial no momento. Por favor, tente novamente mais tarde.' }}
              </p>
              <p class="text-[11px] text-[var(--on-surface-variant)] pt-1">
                Seus dados continuam intactos. Clique no botão abaixo para tentar novamente quando desejar.
              </p>
            </div>
          </div>

          <!-- Timeline / Terminal de Logs -->
          <div id="pareto-logs-container"
               class="rounded-2xl p-3.5 sm:p-4 bg-slate-900/95 dark:bg-[#0b0e17] text-slate-100 border border-purple-500/20 shadow-inner max-h-[300px] sm:max-h-[340px] overflow-y-auto space-y-2.5 scroll-smooth">
            <div class="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full"
                      [ngClass]="status === 'error' ? 'bg-red-400' : (status === 'completed' ? 'bg-emerald-400' : 'bg-purple-400 animate-ping')"></span>
                <span>LOGS DE PROCESSAMENTO DA IA</span>
              </span>
              <span>PARETO ENGINE 80/20</span>
            </div>

            <div *ngFor="let step of analysisLogs; let i = index"
                 [id]="'pareto-log-step-' + i"
                 [attr.data-active]="step.status === 'active'"
                 [attr.data-status]="step.status"
                 class="p-2.5 rounded-xl transition-all duration-300 flex items-start gap-3"
                 [ngClass]="{
                   'bg-emerald-500/10 border border-emerald-500/30': step.status === 'completed',
                   'bg-purple-500/15 border border-purple-500/40 shadow-sm': step.status === 'active',
                   'bg-red-500/15 border border-red-500/40': step.status === 'error',
                   'bg-white/[0.02] border border-white/5 opacity-50': step.status === 'pending'
                 }">

              <!-- Icon Circle -->
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 text-white transition-colors"
                   [ngClass]="{
                     'bg-emerald-500 shadow-md shadow-emerald-500/20': step.status === 'completed',
                     'bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] shadow-md shadow-purple-500/30': step.status === 'active',
                     'bg-red-500 shadow-md shadow-red-500/20': step.status === 'error',
                     'bg-white/10 text-slate-400': step.status === 'pending'
                   }">
                <span class="material-symbols-outlined !text-[16px] sm:!text-[18px]"
                      [ngClass]="{'animate-spin': step.status === 'active'}">
                  {{ step.status === 'completed' ? 'check' : (step.status === 'error' ? 'close' : (step.status === 'active' ? 'sync' : step.icon)) }}
                </span>
              </div>

              <!-- Log Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="text-xs font-bold truncate"
                      [ngClass]="{
                        'text-emerald-300': step.status === 'completed',
                        'text-purple-300 font-extrabold': step.status === 'active',
                        'text-red-300': step.status === 'error',
                        'text-slate-400': step.status === 'pending'
                      }">
                    {{ step.title }}
                  </h4>

                  <!-- Status Badge -->
                  <span class="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0"
                        [ngClass]="{
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': step.status === 'completed',
                          'bg-purple-500/30 text-purple-200 border border-purple-400/40 animate-pulse': step.status === 'active',
                          'bg-red-500/20 text-red-300 border border-red-500/30': step.status === 'error',
                          'bg-white/5 text-slate-500': step.status === 'pending'
                        }">
                    {{ step.status === 'completed' ? 'Concluído' : (step.status === 'active' ? 'Processando...' : (step.status === 'error' ? 'Falha' : 'Aguardando')) }}
                  </span>
                </div>

                <p class="text-[11px] text-slate-300 dark:text-slate-400 mt-0.5 leading-snug">
                  {{ step.detail }}
                </p>

                <span *ngIf="step.time" class="text-[9px] font-mono text-slate-500 dark:text-slate-500 block mt-1">
                  {{ step.time }}
                </span>
              </div>
            </div>
          </div>

          <!-- Footer Actions para os modos de log -->
          <div *ngIf="status === 'processing'" class="flex items-center justify-between gap-3 py-1">
            <span class="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
              A IA está refinando a matriz 80/20...
            </span>
            <span class="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold">
              Não feche esta janela
            </span>
          </div>

          <!-- Ações ao Concluir com Sucesso (Aguardar ação do usuário) -->
          <div *ngIf="status === 'completed'" class="flex flex-col sm:flex-row gap-2.5 pt-1 animate-fadeIn">
            <button (click)="viewParetoAnalysis()"
                    class="btn-mesh flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:scale-[1.01] transition-all cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">visibility</span>
              <span>Acessar Análise Pareto</span>
            </button>
            <button (click)="closeAfterCompletion()"
                    class="btn-neo sm:w-32 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-[var(--on-surface)] hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">done</span>
              <span>Fechar</span>
            </button>
          </div>

          <div *ngIf="status === 'error'" class="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
            <button (click)="startNewAnalysis()"
                    class="btn-mesh flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2">
              <span class="material-symbols-outlined !text-[18px]">refresh</span>
              <span>Tentar Novamente</span>
            </button>
            <button (click)="close()"
                    class="btn-neo flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-[var(--on-surface)]">
              <span class="material-symbols-outlined !text-[18px]">close</span>
              <span>Fechar</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-fadeIn {
      animation: fadeIn 0.22s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98) translateY(-4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .border-3 {
      border-width: 3px;
    }
  `]
})
export class ParetoAnalysisModalComponent implements OnChanges, OnDestroy {
  private apiService = inject(ApiService);
  private router = inject(Router);

  @Input() isOpen = false;
  @Input() editalId = '';
  @Input() editalData: any = null;
  @Input() userContext: any = null;

  @Output() closed = new EventEmitter<void>();
  @Output() analysisCompleted = new EventEmitter<any>();
  @Output() existingSelected = new EventEmitter<any>();

  status: 'checking' | 'exists' | 'processing' | 'completed' | 'error' = 'checking';
  progress = 0;
  errorMessage = '';

  existingParetoData: any = null;
  completedResult: any = null;
  analysisLogs: ParetoLogStep[] = [];
  private logInterval: any = null;

  get completedMetrics(): { coverage: number; subjects: number; hotTopics: any } | null {
    const data = this.completedResult?.pareto_data || this.completedResult || this.existingParetoData;
    if (!data) return null;
    let pd = data;
    if (typeof pd === 'string') {
      try { pd = JSON.parse(pd); } catch (e) { return null; }
    }
    const coverage = pd?.coverage_percentage || 80;
    const camada1 = pd?.camada_1_mapa_prioridades?.disciplinas;
    const subjects = Array.isArray(camada1) ? camada1.length : (pd?.high_priority_subjects || pd?.total_subjects || 4);
    const hotTopics = pd?.total_hot_topics || 'Mapeados';
    return { coverage, subjects, hotTopics };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.checkExistingAnalysis();
      } else {
        this.clearLogInterval();
      }
    }
  }

  ngOnDestroy() {
    this.clearLogInterval();
  }

  /**
   * Método público para abrir o modal e iniciar a verificação
   */
  open(editalId?: string, editalData?: any, userContext?: any) {
    if (editalId) this.editalId = editalId;
    if (editalData) this.editalData = editalData;
    if (userContext) this.userContext = userContext;

    this.isOpen = true;
    this.checkExistingAnalysis();
  }

  close() {
    if (this.status === 'processing') return;
    this.clearLogInterval();
    this.isOpen = false;
    this.closed.emit();
  }

  get effectiveCargo(): string {
    return this.userContext?.cargo ||
      this.editalData?.cargo ||
      this.existingParetoData?.concurso_info?.cargo ||
      'Cargo Principal';
  }

  get effectiveConcurso(): string {
    return this.userContext?.concurso ||
      this.editalData?.concurso ||
      this.editalData?.title ||
      this.existingParetoData?.concurso_info?.concurso ||
      '';
  }

  get existingDisciplineCount(): number {
    const camada1 = this.existingParetoData?.camada_1_mapa_prioridades?.disciplinas;
    if (Array.isArray(camada1)) return camada1.length;
    return this.existingParetoData?.total_subjects || 4;
  }

  getBancaName(): string {
    return this.existingParetoData?.concurso_info?.banca ||
      this.existingParetoData?.alertas_banca?.banca_identificada ||
      'Banca Oficial';
  }

  /**
   * Consulta se já existe análise feita
   */
  checkExistingAnalysis() {
    this.status = 'checking';
    this.progress = 0;
    this.errorMessage = '';
    this.completedResult = null;

    // Se já tivermos editalData e ele possuir pareto_data com análise
    if (this.hasValidParetoData(this.editalData)) {
      let pd = this.editalData?.pareto_data || this.editalData;
      if (typeof pd === 'string') {
        try { pd = JSON.parse(pd); } catch (e) {}
      }
      this.existingParetoData = pd;
      this.status = 'exists';
      return;
    }

    if (!this.editalId) {
      this.status = 'processing';
      this.startNewAnalysis();
      return;
    }

    // Busca dados atualizados do edital no backend
    this.apiService.getEditalDetails(this.editalId).subscribe({
      next: (res: any) => {
        const ed = res?.data || res;
        this.editalData = ed;
        if (this.hasValidParetoData(ed)) {
          let pd = ed.pareto_data || ed;
          if (typeof pd === 'string') {
            try { pd = JSON.parse(pd); } catch (e) {}
          }
          this.existingParetoData = pd;
          this.status = 'exists';
        } else {
          // Não existe análise feita, inicia direto a nova análise
          this.startNewAnalysis();
        }
      },
      error: () => {
        // Em caso de falha na consulta prévia, prossegue com nova análise
        this.startNewAnalysis();
      }
    });
  }

  private hasValidParetoData(ed: any): boolean {
    if (!ed) return false;
    let pd = ed.pareto_data || ed;
    if (typeof pd === 'string') {
      try { pd = JSON.parse(pd); } catch (e) { return false; }
    }
    if (!pd || typeof pd !== 'object') return false;

    if (pd.pareto_analisado === true) return true;
    if (ed.pareto_analisado === true) return true;
    if (pd.camada_1_mapa_prioridades?.disciplinas?.length > 0) return true;
    if (pd.relevance_summary && (pd.high_priority_subjects > 0 || pd.total_subjects > 0)) return true;
    return false;
  }

  /**
   * Usuário escolhe utilizar a análise pronta
   */
  useExistingAnalysis() {
    this.clearLogInterval();
    this.isOpen = false;
    this.closed.emit();
    this.existingSelected.emit(this.existingParetoData);
    if (this.editalId) {
      this.router.navigate(['/pareto', this.editalId]);
    }
  }

  /**
   * Dispara nova análise com simulação de logs
   */
  startNewAnalysis() {
    this.clearLogInterval();
    this.status = 'processing';
    this.progress = 5;
    this.errorMessage = '';
    this.completedResult = null;

    const cargoStr = this.effectiveCargo;
    const concursoStr = this.effectiveConcurso;

    // Definição das 7 etapas cognitivas da análise Pareto 80/20
    this.analysisLogs = [
      {
        id: 'valida_estrutura',
        icon: 'checklist',
        title: 'Estrutura Programática',
        detail: `Validando conteúdo programático e ementa para: "${cargoStr}".`,
        status: 'active',
        time: this.getCurrentTimeStr()
      },
      {
        id: 'conecta_ia',
        icon: 'psychology',
        title: 'Pareto Engine 80/20',
        detail: 'Conectando ao modelo de raciocínio estatístico e priorização.',
        status: 'pending'
      },
      {
        id: 'camada_1',
        icon: 'layers',
        title: 'Camada 1: Matriz de Macro-Prioridades',
        detail: 'Identificando o núcleo vital de 20% das matérias que geram 80% das questões.',
        status: 'pending'
      },
      {
        id: 'camada_2',
        icon: 'local_fire_department',
        title: 'Camada 2: Mineração de Tópicos Quentes',
        detail: 'Classificação de incidência histórica, relevância e temperatura da banca.',
        status: 'pending'
      },
      {
        id: 'camada_3',
        icon: 'bolt',
        title: 'Camada 3: Custo-Benefício de Subtópicos',
        detail: 'Cálculo algorítmico da relação entre tempo de estudo e probabilidade de acerto.',
        status: 'pending'
      },
      {
        id: 'regua_corte',
        icon: 'content_cut',
        title: 'Calibração da Régua de Corte',
        detail: 'Separando tópicos residuais/legados para estudo diferido no pós-edital.',
        status: 'pending'
      },
      {
        id: 'sintese',
        icon: 'auto_awesome',
        title: 'Consolidação e Síntese Estratégica',
        detail: 'Finalizando mapa de prioridades, orientações da banca e cronograma.',
        status: 'pending'
      }
    ];

    let currentStep = 0;
    const progressTargets = [15, 30, 48, 65, 78, 88, 95];
    const stepDurations = [2800, 3200, 4000, 4500, 4500, 4000, 3500];

    setTimeout(() => {
      this.scrollActiveLogToCenter(0);
    }, 60);

    const advanceStep = () => {
      if (this.status !== 'processing') {
        this.clearLogInterval();
        return;
      }

      const nextDuration = stepDurations[currentStep] || 3500;

      this.logInterval = setTimeout(() => {
        if (this.status !== 'processing') return;

        if (currentStep < this.analysisLogs.length - 1) {
          this.analysisLogs[currentStep].status = 'completed';
          this.analysisLogs[currentStep].time = this.getCurrentTimeStr();

          currentStep++;
          this.analysisLogs[currentStep].status = 'active';
          this.analysisLogs[currentStep].time = this.getCurrentTimeStr();

          this.progress = progressTargets[currentStep] || 95;
          this.scrollActiveLogToCenter(currentStep);

          advanceStep();
        } else {
          // Último passo ativo aguardando retorno da API
          if (this.progress < 98) {
            this.progress += 1;
          }
          this.logInterval = setTimeout(advanceStep, 2500);
        }
      }, nextDuration);
    };

    advanceStep();

    // Contexto do usuário para envio
    const payload = {
      cargo: this.effectiveCargo,
      concurso: concursoStr,
      dataProva: this.userContext?.dataProva || this.editalData?.data_prova,
      horasPorDia: this.userContext?.horasPorDia || this.editalData?.horas_por_dia || 4,
      diasPorSemana: this.userContext?.diasPorSemana || this.editalData?.dias_por_semana || 5,
    };

    this.apiService.analyzeEditalPareto(this.editalId, payload).subscribe({
      next: (res: any) => {
        this.finishSuccess(res?.data || res);
      },
      error: (err: any) => {
        this.handleError(err);
      }
    });
  }

  private finishSuccess(result: any) {
    this.clearLogInterval();
    this.progress = 100;
    this.status = 'completed';
    this.completedResult = result;

    this.analysisLogs.forEach(step => {
      step.status = 'completed';
      if (!step.time) step.time = this.getCurrentTimeStr();
    });
    this.scrollActiveLogToCenter(this.analysisLogs.length - 1);

    // Emite o evento para que componentes pais atualizem seus dados
    this.analysisCompleted.emit(result);
  }

  /**
   * Usuário clica no botão de ação para abrir o mapa de Pareto
   */
  viewParetoAnalysis() {
    this.clearLogInterval();
    this.isOpen = false;
    this.closed.emit();
    if (this.editalId) {
      this.router.navigate(['/pareto', this.editalId]);
    }
  }

  /**
   * Usuário fecha o modal e mantém os dados já carregados
   */
  closeAfterCompletion() {
    this.clearLogInterval();
    this.isOpen = false;
    this.closed.emit();
  }

  private handleError(err?: any) {
    this.clearLogInterval();
    this.status = 'error';

    const rawMessage = err?.error?.message || err?.message;
    if (typeof rawMessage === 'string' && rawMessage.length > 5) {
      this.errorMessage = rawMessage;
    } else {
      this.errorMessage = 'O serviço de IA está passando por instabilidade momentânea. Por favor, verifique sua conexão ou tente novamente.';
    }

    const activeStep = this.analysisLogs.find(s => s.status === 'active');
    if (activeStep) {
      activeStep.status = 'error';
      activeStep.time = this.getCurrentTimeStr();
    }
    this.scrollActiveLogToCenter();
  }

  private scrollActiveLogToCenter(stepIndex?: number) {
    setTimeout(() => {
      const container = document.getElementById('pareto-logs-container');
      if (!container) return;

      let targetEl: HTMLElement | null = null;
      if (typeof stepIndex === 'number') {
        targetEl = document.getElementById('pareto-log-step-' + stepIndex);
      }
      if (!targetEl) {
        targetEl = container.querySelector('[data-active="true"], [data-status="error"]') as HTMLElement;
      }
      if (!targetEl) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const relativeTop = targetRect.top - containerRect.top;
      const targetCenter = relativeTop + (targetRect.height / 2);
      const containerCenter = container.clientHeight / 2;
      const delta = targetCenter - containerCenter;

      const targetScrollTop = Math.max(0, container.scrollTop + delta);

      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }, 80);
  }

  private clearLogInterval() {
    if (this.logInterval) {
      clearTimeout(this.logInterval);
      this.logInterval = null;
    }
  }

  private getCurrentTimeStr(): string {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
