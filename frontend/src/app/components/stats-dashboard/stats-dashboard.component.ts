import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  HostListener,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ThemeService } from "../../services/theme.service";
import {
  Chart,
  BarController, BarElement, CategoryScale, LinearScale,
  DoughnutController, ArcElement,
  LineController, LineElement, PointElement,
  Tooltip, Legend, Filler,
} from "chart.js";

Chart.register(
  BarController, BarElement, CategoryScale, LinearScale,
  DoughnutController, ArcElement,
  LineController, LineElement, PointElement,
  Tooltip, Legend, Filler
);

interface StatItem { name: string; count: number; pct: number; }

@Component({
  selector: "app-stats-dashboard",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Loading overlay -->
    <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="w-12 h-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin"></div>
      <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Calculando estatisticas...</p>
    </div>

    <div *ngIf="!isLoading" class="space-y-6 pb-6">

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="neo-raised rounded-2xl p-4 sm:p-5 flex flex-col gap-2 bg-[var(--card-bg)] border border-[var(--outline-variant)] relative overflow-hidden hover:scale-[1.02] transition-transform duration-200 cursor-default">
          <div class="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#5d3bf6]/10 blur-2xl pointer-events-none"></div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined !text-[20px] text-[#5d3bf6]">quiz</span>
            <span class="text-[10px] font-semibold text-[var(--on-surface-variant)] uppercase tracking-wide">Questoes no Banco</span>
          </div>
          <div class="text-3xl font-black text-[var(--on-surface)]">{{ _cache.totalQuestoes.toLocaleString("pt-BR") }}</div>
          <div class="text-[11px] text-[var(--on-surface-variant)] font-medium">
            <span class="text-[#5d3bf6] font-bold">{{ _cache.disciplinasCount }}</span> disciplinas cobertas
          </div>
        </div>

        <div class="neo-raised rounded-2xl p-4 sm:p-5 flex flex-col gap-2 bg-[var(--card-bg)] border border-[var(--outline-variant)] relative overflow-hidden hover:scale-[1.02] transition-transform duration-200 cursor-default">
          <div class="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#22d3ee]/10 blur-2xl pointer-events-none"></div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined !text-[20px] text-[#22d3ee]">task_alt</span>
            <span class="text-[10px] font-semibold text-[var(--on-surface-variant)] uppercase tracking-wide">Questões Respondidas</span>
          </div>
          <div class="text-3xl font-black text-[var(--on-surface)]">{{ _cache.questoesRespondidas.toLocaleString("pt-BR") }}</div>
          <div class="text-[11px] text-[var(--on-surface-variant)] font-medium">
            <span class="text-[#22d3ee] font-bold">{{ _cache.acertosPct }}%</span>
            <span *ngIf="_cache.questoesRespondidas > 0" class="text-[var(--on-surface-variant)] font-normal"> ({{ _cache.acertosCount }}/{{ _cache.questoesRespondidas }} acertos)</span>
            <span *ngIf="_cache.questoesRespondidas === 0">de acerto geral</span>
          </div>
        </div>

        <div class="neo-raised rounded-2xl p-4 sm:p-5 flex flex-col gap-2 bg-[var(--card-bg)] border border-[var(--outline-variant)] relative overflow-hidden hover:scale-[1.02] transition-transform duration-200 cursor-default">
          <div class="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#f59e0b]/10 blur-2xl pointer-events-none"></div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined !text-[20px] text-[#f59e0b]">schedule</span>
            <span class="text-[10px] font-semibold text-[var(--on-surface-variant)] uppercase tracking-wide">Horas / Semana</span>
          </div>
          <div class="text-3xl font-black text-[var(--on-surface)]">{{ _cache.totalHorasSemanais }}h</div>
          <div class="text-[11px] text-[var(--on-surface-variant)] font-medium">
            <span class="text-[#f59e0b] font-bold">{{ editais.length }}</span> editais configurados
          </div>
        </div>

        <div class="neo-raised rounded-2xl p-4 sm:p-5 flex flex-col gap-2 bg-[var(--card-bg)] border border-[var(--outline-variant)] relative overflow-hidden hover:scale-[1.02] transition-transform duration-200 cursor-default">
          <div class="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#10b981]/10 blur-2xl pointer-events-none"></div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined !text-[20px] text-[#10b981]">trending_up</span>
            <span class="text-[10px] font-semibold text-[var(--on-surface-variant)] uppercase tracking-wide">Progresso Medio</span>
          </div>
          <div class="text-3xl font-black text-[var(--on-surface)]">{{ _cache.avgProgresso }}%</div>
          <div class="text-[11px] text-[var(--on-surface-variant)] font-medium">nos conteudos dos editais</div>
        </div>
      </div>

      <!-- Row 1: % Acerto por Disciplina (Histórico do Aluno) -->
      <div class="neo-raised rounded-2xl p-5 sm:p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)]">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined !text-[16px] text-white">target</span>
          </div>
          <div>
            <h3 class="text-sm font-bold text-[var(--on-surface)]">% Acerto por Disciplina</h3>
            <p class="text-[11px] text-[var(--on-surface-variant)]">Baseado no historico de respostas resolvidas</p>
          </div>
          <div *ngIf="effectiveAccuracyByDisciplina.length > 0" class="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[var(--on-surface-variant)]">
            <span class="material-symbols-outlined !text-[14px] text-[#10b981]">database</span>
            <span>{{ effectiveAccuracyByDisciplina.length }} disciplinas registradas</span>
          </div>
        </div>
        <div *ngIf="effectiveAccuracyByDisciplina.length > 0; else semAcerto" class="relative" style="height:300px">
          <canvas #acertoChart></canvas>
        </div>
        <ng-template #semAcerto>
          <div class="flex flex-col items-center justify-center gap-3 text-center py-12">
            <div class="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
              <span class="material-symbols-outlined !text-[32px] text-[var(--primary)]">target</span>
            </div>
            <p class="text-sm font-bold text-[var(--on-surface)]">Nenhuma resposta registrada ainda</p>
            <p class="text-[12px] text-[var(--on-surface-variant)] max-w-xs">Responda questoes na aba <strong>4. Questoes</strong> para comecar a rastrear seu % de acerto por disciplina.</p>
          </div>
        </ng-template>
      </div>

      <!-- Row 2: Questoes por Disciplina (Largura Total) -->
      <div class="w-full neo-raised rounded-2xl p-5 sm:p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)]">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5d3bf6] to-[#7c3aed] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined !text-[16px] text-white">bar_chart</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[var(--on-surface)]">Questões por Disciplina</h3>
              <p class="text-[11px] text-[var(--on-surface-variant)]">
                Filtro: <span class="font-semibold text-[var(--on-surface)]">{{ selectedYearsLabel }}</span> • <span class="font-semibold text-[var(--on-surface)]">{{ selectedDisciplinaBanca === 'Todas' ? 'Todas as Bancas' : selectedDisciplinaBanca }}</span> ({{ _cache.disciplinasTotalYear }} questões)
              </p>
            </div>
          </div>

          <!-- Seletores: Ano (Múltipla Seleção) e Banca -->
          <div class="flex items-center gap-2 flex-wrap relative">
            <!-- Multi-select Ano Dropdown -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleYearDropdown($event)"
                class="flex items-center gap-1.5 bg-[var(--surface-container-high)]/80 hover:bg-[var(--surface-container-high)] px-3 py-1.5 rounded-xl border border-[var(--outline-variant)] text-[11px] font-bold text-[var(--on-surface)] transition-colors cursor-pointer shadow-sm">
                <span class="material-symbols-outlined !text-[15px] text-[var(--primary)]">calendar_month</span>
                <span>{{ selectedYearsLabel }}</span>
                <span *ngIf="selectedYears.length > 0 && selectedYears.length < availableYears.length" class="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] font-bold flex items-center justify-center">
                  {{ selectedYears.length }}
                </span>
                <span class="material-symbols-outlined !text-[16px] text-[var(--on-surface-variant)] transition-transform duration-200" [class.rotate-180]="isYearDropdownOpen">expand_more</span>
              </button>

              <!-- Floating Dropdown Menu -->
              <div
                *ngIf="isYearDropdownOpen"
                (click)="$event.stopPropagation()"
                class="absolute right-0 sm:left-0 mt-2 w-56 p-2 rounded-2xl bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                <div class="flex items-center justify-between px-2 py-1 mb-1 border-b border-[var(--outline-variant)]/50 text-[10px] font-bold">
                  <span class="text-[var(--on-surface-variant)] uppercase tracking-wider">Filtrar por Ano</span>
                  <div class="flex items-center gap-2">
                    <button type="button" (click)="selectAllYears($event)" class="text-[var(--primary)] hover:underline cursor-pointer">Todos</button>
                    <span class="text-[var(--outline)]">•</span>
                    <button type="button" (click)="clearYears($event)" class="text-[var(--on-surface-variant)] hover:text-red-500 cursor-pointer">Limpar</button>
                  </div>
                </div>

                <div class="max-h-52 overflow-y-auto space-y-0.5 py-1">
                  <label
                    *ngFor="let y of availableYears"
                    (click)="toggleYear(y, $event)"
                    class="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[var(--surface-container-high)]/70 text-[11px] font-semibold text-[var(--on-surface)] cursor-pointer transition-colors select-none">
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        [checked]="isYearSelected(y)"
                        (change)="toggleYear(y, $event)"
                        class="rounded border-[var(--outline-variant)] text-[var(--primary)] focus:ring-0 cursor-pointer w-3.5 h-3.5" />
                      <span>Ano {{ y }}</span>
                    </div>
                    <span *ngIf="yearCountsMap.get(y)" class="text-[10px] font-medium text-[var(--on-surface-variant)]">
                      {{ yearCountsMap.get(y) }} q
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Seletor de Banca -->
            <div class="flex items-center gap-1.5 bg-[var(--surface-container-high)]/80 px-3 py-1.5 rounded-xl border border-[var(--outline-variant)]">
              <span class="material-symbols-outlined !text-[15px] text-[#f59e0b]">domain</span>
              <select
                [value]="selectedDisciplinaBanca"
                (change)="onDisciplinaBancaChange($any($event.target).value)"
                class="bg-transparent text-[11px] font-bold text-[var(--on-surface)] outline-none border-none pr-1 cursor-pointer max-w-[140px] truncate">
                <option value="Todas" class="bg-[var(--card-bg)] text-[var(--on-surface)]">Todas as Bancas</option>
                <option *ngFor="let b of availableBancas" [value]="b" class="bg-[var(--card-bg)] text-[var(--on-surface)]">{{ b }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="relative" style="height:280px">
          <canvas #disciplinaChart></canvas>
        </div>
      </div>

      <!-- Row 3: Horas de Estudo + Progresso por Edital lado a lado -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="neo-raised rounded-2xl p-5 sm:p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)]">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined !text-[16px] text-white">schedule</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[var(--on-surface)]">Horas de Estudo</h3>
              <p class="text-[11px] text-[var(--on-surface-variant)]">Horas semanais por edital</p>
            </div>
          </div>
          <div *ngIf="_cache.horas.length > 0; else semCronograma" class="relative" style="height:210px">
            <canvas #horasChart></canvas>
          </div>
          <ng-template #semCronograma>
            <div class="flex flex-col items-center justify-center gap-2 text-center" style="height:210px">
              <span class="material-symbols-outlined !text-[40px] text-[var(--outline)]">schedule</span>
              <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Nenhum cronograma configurado</p>
              <p class="text-[11px] text-[var(--outline)]">Defina horas de estudo em Meus Editais</p>
            </div>
          </ng-template>
        </div>

        <div class="neo-raised rounded-2xl p-5 sm:p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)]">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined !text-[16px] text-white">task_alt</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[var(--on-surface)]">Progresso por Edital</h3>
              <p class="text-[11px] text-[var(--on-surface-variant)]">% de conteudo concluido</p>
            </div>
          </div>
          <div *ngIf="_cache.progresso.length > 0; else semProgresso" class="space-y-4">
            <div *ngFor="let item of _cache.progresso" class="space-y-1">
              <div class="flex items-center justify-between text-[12px]">
                <span class="font-semibold text-[var(--on-surface)] truncate max-w-[70%]">{{ item.label }}</span>
                <span class="font-black" [style.color]="getProgressColor(item.pct)">{{ item.pct }}%</span>
              </div>
              <div class="h-2.5 rounded-full bg-[var(--outline-variant)]/30 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700 ease-out"
                  [style.width.%]="item.pct"
                  [style.background]="getProgressColor(item.pct)">
                </div>
              </div>
              <div class="text-[10px] text-[var(--on-surface-variant)]">{{ item.completed }}/{{ item.total }} topicos</div>
            </div>
          </div>
          <ng-template #semProgresso>
            <div class="flex flex-col items-center justify-center gap-2 text-center" style="height:160px">
              <span class="material-symbols-outlined !text-[40px] text-[var(--outline)]">folder_special</span>
              <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Nenhum edital adicionado</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Row 4: Top 10 Assuntos Mais Cobrados -->
      <div class="neo-raised rounded-2xl p-5 sm:p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)]">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ec4899] to-[#db2777] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined !text-[16px] text-white">trophy</span>
          </div>
          <div>
            <h3 class="text-sm font-bold text-[var(--on-surface)]">Top 10 Assuntos Mais Cobrados</h3>
            <p class="text-[11px] text-[var(--on-surface-variant)]">Assuntos com maior incidência para direcionar sua preparação</p>
          </div>
        </div>
        <div *ngIf="_cache.assuntos.length > 0; else semAssuntos" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <div *ngFor="let item of _cache.assuntos; let i = index" class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black"
              [style.background]="i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c30' : 'rgba(128,128,128,0.15)'"
              [style.color]="i < 3 ? '#fff' : 'var(--on-surface-variant)'">
              {{ i + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-1">
                <span class="text-[11px] font-semibold text-[var(--on-surface)] truncate">{{ item.name }}</span>
                <span class="text-[10px] font-black text-[var(--primary)] shrink-0">{{ item.count }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-[var(--outline-variant)]/20 overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-[#ec4899] to-[#5d3bf6] transition-all duration-700 ease-out"
                  [style.width.%]="item.pct">
                </div>
              </div>
            </div>
          </div>
        </div>
        <ng-template #semAssuntos>
          <div class="flex flex-col items-center justify-center gap-2 text-center" style="height:160px">
            <span class="material-symbols-outlined !text-[40px] text-[var(--outline)]">quiz</span>
            <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Nenhuma questao disponivel</p>
          </div>
        </ng-template>
      </div>

    </div>
  `,
})
export class StatsDashboardComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() isAdmin = false;
  @Input() questions: any[] = [];
  @Input() editais: any[] = [];
  @Input() userSchedules: Record<string, any> = {};
  @Input() editalProgressMap: Record<string, { percentage: number; completed: number; total: number }> = {};
  @Input() selectedAnswers: Record<string, string> = {};
  @Input() sessionAnswers: Record<string, { selectedOption: string; isCorrect: boolean; disciplina: string }> = {};
  @Input() accuracyByDisciplina: { disciplina: string; total: number; corretas: number; pct: number }[] = [];

  @ViewChild("disciplinaChart") disciplinaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("horasChart") horasChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("acertoChart") acertoChartRef!: ElementRef<HTMLCanvasElement>;

  public themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);

  private chartDisciplina?: Chart;
  private chartHoras?: Chart;
  private chartAcerto?: Chart;
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private viewReady = false;

  isLoading = true;
  selectedYears: string[] = [];
  isYearDropdownOpen = false;
  yearCountsMap = new Map<string, number>();
  selectedDisciplinaBanca: string = 'Todas';
  availableYears: string[] = [];
  availableBancas: string[] = [];

  // Cached computed data - computed once per input change
  _cache = {
    totalQuestoes: 0,
    disciplinasCount: 0,
    disciplinasTotalYear: 0,
    questoesRespondidas: 0,
    acertosCount: 0,
    acertosPct: 0,
    totalHorasSemanais: 0,
    avgProgresso: 0,
    disciplinas: [] as StatItem[],
    bancas: [] as StatItem[],
    anos: [] as { year: string; count: number }[],
    assuntos: [] as StatItem[],
    horas: [] as { label: string; horas: number }[],
    progresso: [] as { label: string; pct: number; completed: number; total: number }[],
  };

  readonly bancaColors = [
    "#5d3bf6","#7c3aed","#22d3ee","#f59e0b","#10b981",
    "#ec4899","#3b82f6","#ef4444","#84cc16","#f97316",
  ];

  // Mapa de cores padronizadas e exclusivas para cada disciplina
  private readonly disciplineColorMap: Record<string, string> = {
    // Tecnologia da Informação
    'BANCO DE DADOS': '#0ea5e9', // Azul Celeste Elétrico
    'BANCOS DE DADOS': '#0ea5e9',
    'GOVERNANCA': '#f97316', // Laranja Tangerine Intenso
    'GOVERNANÇA': '#f97316',
    'GOVERNANCA DE TI': '#f97316',
    'GOVERNANÇA DE TI': '#f97316',
    'GOVERNANCA E GESTAO DE TI': '#f97316',
    'GOVERNANÇA E GESTÃO DE TI': '#f97316',
    'ENGENHARIA DE SOFTWARE': '#ec4899', // Pink / Magenta
    'REDES DE COMPUTADORES': '#10b981', // Verde Esmeralda
    'REDES': '#10b981',
    'SEGURANCA DA INFORMACAO': '#ef4444', // Vermelho Vivo
    'SEGURANÇA DA INFORMAÇÃO': '#ef4444',
    'SEGURANCA': '#ef4444',
    'SISTEMAS OPERACIONAIS': '#eab308', // Amarelo Ouro
    'ARQUITETURA DE COMPUTADORES': '#8b5cf6', // Roxo Violeta
    'CIENCIA DE DADOS': '#6366f1', // Índigo
    'CIÊNCIA DE DADOS': '#6366f1',
    'DESENVOLVIMENTO DE SISTEMAS': '#a855f7', // Púrpura
    'PROGRAMACAO': '#a855f7',
    'PROGRAMAÇÃO': '#a855f7',
    'INFORMATICA': '#06b6d4', // Turquesa
    'INFORMÁTICA': '#06b6d4',
    'TECNOLOGIA DA INFORMACAO': '#06b6d4',
    'TECNOLOGIA DA INFORMAÇÃO': '#06b6d4',
    'GESTAO DE PROJETOS': '#d97706',
    'GESTÃO DE PROJETOS': '#d97706',

    // Matérias Gerais e Jurídicas
    'DIREITO ADMINISTRATIVO': '#5d3bf6', // Roxo Índigo
    'DIREITO CONSTITUCIONAL': '#22d3ee', // Azul Ciano
    'LINGUA PORTUGUESA': '#10b981', // Verde Esmeralda
    'PORTUGUES': '#10b981',
    'PORTUGUÊS': '#10b981',
    'RACIOCINIO LOGICO': '#f59e0b', // Âmbar
    'RACIOCÍNIO LÓGICO': '#f59e0b',
    'MATEMATICA': '#f59e0b',
    'MATEMÁTICA': '#f59e0b',
    'DIREITO PENAL': '#ef4444',
    'DIREITO PROCESSUAL PENAL': '#e11d48',
    'DIREITO CIVIL': '#8b5cf6',
    'DIREITO PROCESSUAL CIVIL': '#a855f7',
    'DIREITO TRIBUTARIO': '#ec4899',
    'DIREITO TRIBUTÁRIO': '#ec4899',
    'ADMINISTRACAO PUBLICA': '#14b8a6', // Verde Petróleo
    'ADMINISTRAÇÃO PÚBLICA': '#14b8a6',
    'CONTABILIDADE GERAL': '#3b82f6', // Azul Real
    'CONTABILIDADE PUBLICA': '#6366f1',
    'CONTABILIDADE PÚBLICA': '#6366f1',
    'DIREITO PREVIDENCIARIO': '#84cc16',
    'DIREITO PREVIDENCIÁRIO': '#84cc16',
    'DIREITO ELEITORAL': '#f97316',
    'DIREITOS HUMANOS': '#059669',
    'ETICA NO SERVICO PUBLICO': '#64748b',
    'ÉTICA NO SERVIÇO PÚBLICO': '#64748b',
    'LEGISLACAO INSTITUCIONAL': '#78716c',
    'LEGISLAÇÃO INSTITUCIONAL': '#78716c',
  };

  private readonly standardPalette = [
    '#5d3bf6', '#22d3ee', '#10b981', '#f59e0b', '#ec4899',
    '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316',
    '#06b6d4', '#84cc16', '#e11d48', '#6366f1', '#d97706',
    '#0ea5e9', '#a855f7', '#059669', '#f43f5e', '#64748b'
  ];

  getDisciplineColor(disciplinaName: string): string {
    if (!disciplinaName) return '#5d3bf6';
    const normalized = disciplinaName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    if (this.disciplineColorMap[normalized]) {
      return this.disciplineColorMap[normalized];
    }

    // Hash determinístico para que qualquer outra matéria tenha sempre a mesma cor
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.standardPalette.length;
    return this.standardPalette[index];
  }

  getProgressColor(pct: number): string {
    if (pct >= 80) return "#10b981";
    if (pct >= 50) return "#f59e0b";
    if (pct >= 25) return "#5d3bf6";
    return "#ef4444";
  }

  private get isDark() { return this.themeService.isDark(); }
  private get gridColor() { return this.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"; }
  private get labelColor() { return this.isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)"; }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.isYearDropdownOpen) {
      this.isYearDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.scheduleUpdate();
  }

  ngOnChanges(changes: SimpleChanges) {
    const relevant = changes["questions"] || changes["userSchedules"] || changes["editais"] || changes["editalProgressMap"] || changes["selectedAnswers"] || changes["sessionAnswers"] || changes["accuracyByDisciplina"];
    if (relevant) {
      this.scheduleUpdate();
    }
  }

  ngOnDestroy() {
    clearTimeout(this.debounceTimer);
    this.destroyAll();
  }

  toggleYearDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
  }

  toggleYear(year: string, event?: Event) {
    if (event) event.stopPropagation();
    const idx = this.selectedYears.indexOf(year);
    if (idx >= 0) {
      this.selectedYears.splice(idx, 1);
    } else {
      this.selectedYears.push(year);
    }
    this.computeCache();
    this.buildDisciplinaChart();
    this.cdr.markForCheck();
  }

  isYearSelected(year: string): boolean {
    return this.selectedYears.includes(year);
  }

  selectAllYears(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedYears = [...this.availableYears];
    this.computeCache();
    this.buildDisciplinaChart();
    this.cdr.markForCheck();
  }

  clearYears(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedYears = [];
    this.computeCache();
    this.buildDisciplinaChart();
    this.cdr.markForCheck();
  }

  get selectedYearsLabel(): string {
    if (this.selectedYears.length === 0 || this.selectedYears.length === this.availableYears.length) {
      return 'Todos os Anos';
    }
    if (this.selectedYears.length === 1) {
      return `Ano ${this.selectedYears[0]}`;
    }
    if (this.selectedYears.length <= 2) {
      return this.selectedYears.sort().join(', ');
    }
    return `${this.selectedYears.length} anos sel.`;
  }

  onDisciplinaBancaChange(banca: string) {
    this.selectedDisciplinaBanca = banca;
    this.computeCache();
    this.buildDisciplinaChart();
    this.cdr.markForCheck();
  }

  /** Debounce: coalesce rapid changes and compute off the main paint frame */
  private scheduleUpdate() {
    clearTimeout(this.debounceTimer);
    this.computeCache();
    this.isLoading = false;
    this.cdr.markForCheck();
    this.debounceTimer = setTimeout(() => {
      if (this.viewReady) this.buildAllCharts();
      this.cdr.markForCheck();
    }, 80);
  }

  /** Compute all derived data once — O(n) single pass over questions */
  private computeCache() {
    const qs = this.questions;
    const total = qs.length || 1;

    // Identifica anos e bancas disponíveis com contagem
    const yearsSet = new Set<string>();
    const yearCounts = new Map<string, number>();
    const bancasSet = new Set<string>();
    for (const q of qs) {
      if (q.ano) {
        const y = String(q.ano);
        yearsSet.add(y);
        yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
      }
      if (q.banca) bancasSet.add(String(q.banca).trim());
    }
    this.yearCountsMap = yearCounts;
    this.availableYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    this.availableBancas = Array.from(bancasSet).sort((a, b) => a.localeCompare(b));

    // Filtrar questões de disciplinas de acordo com Anos selecionados e Banca
    const filteredForDisciplina = qs.filter(q => {
      const matchYear = this.selectedYears.length === 0 || this.selectedYears.includes(String(q.ano));
      const matchBanca = this.selectedDisciplinaBanca === 'Todas' || String(q.banca || '').trim().toUpperCase() === this.selectedDisciplinaBanca.toUpperCase();
      return matchYear && matchBanca;
    });

    const totalDiscQuestions = filteredForDisciplina.length || 1;
    const disciplinaMap = new Map<string, number>();

    for (const q of filteredForDisciplina) {
      const d = ((q.disciplina || q.subject || "Geral") as string).trim();
      disciplinaMap.set(d, (disciplinaMap.get(d) || 0) + 1);
    }

    const bancaMap = new Map<string, number>();
    const anoMap = new Map<string, number>();
    const assuntoMap = new Map<string, number>();

    for (const q of qs) {
      // Banca
      const b = ((q.banca || "Outras") as string).trim();
      bancaMap.set(b, (bancaMap.get(b) || 0) + 1);

      // Ano
      if (q.ano) {
        const y = String(q.ano);
        anoMap.set(y, (anoMap.get(y) || 0) + 1);
      }

      // Assunto
      const a = ((q.assunto || q.topic || "") as string).trim();
      if (a) assuntoMap.set(a, (assuntoMap.get(a) || 0) + 1);
    }

    const sortDesc = (m: Map<string, number>) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]);

    const disciplinas = sortDesc(disciplinaMap).slice(0, 12)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / totalDiscQuestions) * 100) }));

    const bancas = sortDesc(bancaMap).slice(0, 8)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }));

    const assuntosSorted = sortDesc(assuntoMap).slice(0, 10);
    const maxAssunto = assuntosSorted[0]?.[1] || 1;
    const assuntos = assuntosSorted.map(([name, count]) => ({ name, count, pct: Math.round((count / maxAssunto) * 100) }));

    const anos = Array.from(anoMap.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, count]) => ({ year, count }));

    // Horas
    const horas = this.editais.map(ed => {
      const s = this.userSchedules[ed.id];
      if (!s?.horas_por_dia || !s?.dias_por_semana) return null;
      return { label: ed.cargo || ed.concurso || ed.title || "Edital", horas: s.horas_por_dia * s.dias_por_semana };
    }).filter(Boolean) as { label: string; horas: number }[];

    // Progresso
    const progresso = this.editais.map(ed => {
      const prog = this.editalProgressMap[ed.id] || { percentage: 0, completed: 0, total: 0 };
      return { label: ed.cargo || ed.concurso || ed.title || "Edital", pct: prog.percentage, completed: prog.completed, total: prog.total };
    }).filter(d => d.total > 0 || d.pct > 0);

    // Total Geral Respondidas pelo Usuário (Histórico Supabase + Sessão)
    let totalHistorico = 0;
    let corretasHistorico = 0;
    if (this.accuracyByDisciplina && this.accuracyByDisciplina.length > 0) {
      totalHistorico = this.accuracyByDisciplina.reduce((acc, d) => acc + Number(d.total || 0), 0);
      corretasHistorico = this.accuracyByDisciplina.reduce((acc, d) => acc + Number(d.corretas || 0), 0);
    }

    const sessionEntries = Object.entries(this.sessionAnswers || {});
    const answeredKeys = sessionEntries.length > 0 ? Object.keys(this.sessionAnswers) : Object.keys(this.selectedAnswers || {});
    let sessaoCorretas = 0;

    if (sessionEntries.length > 0) {
      sessaoCorretas = sessionEntries.filter(([, a]) => a.isCorrect === true).length;
    } else if (answeredKeys.length > 0) {
      const qMap = new Map<string, any>();
      for (const q of qs) {
        if (q.id != null) qMap.set(String(q.id), q);
        if (q.id_qc) qMap.set(String(q.id_qc), q);
        if (q.codigo) qMap.set(String(q.codigo), q);
      }
      for (const qId of answeredKeys) {
        const q = qMap.get(String(qId));
        if (!q) continue;
        if (this.checkIsCorrect(q, this.selectedAnswers[qId])) {
          sessaoCorretas++;
        }
      }
    }

    const totalRespondidas = Math.max(totalHistorico, answeredKeys.length);
    const totalCorretas = totalHistorico > 0 ? corretasHistorico : sessaoCorretas;
    const acertosPct = totalRespondidas > 0 ? Math.round((totalCorretas / totalRespondidas) * 100) : 0;

    const totalHoras = Object.values(this.userSchedules)
      .reduce((sum: number, s: any) => sum + ((s?.horas_por_dia || 0) * (s?.dias_por_semana || 0)), 0);

    const progressVals = Object.values(this.editalProgressMap).map(v => v.percentage);
    const avgProgresso = progressVals.length
      ? Math.round(progressVals.reduce((a, b) => a + b, 0) / progressVals.length)
      : 0;

    this._cache = {
      totalQuestoes: qs.length,
      disciplinasCount: disciplinaMap.size,
      disciplinasTotalYear: filteredForDisciplina.length,
      questoesRespondidas: totalRespondidas,
      acertosCount: totalCorretas,
      acertosPct,
      totalHorasSemanais: totalHoras,
      avgProgresso,
      disciplinas,
      bancas,
      anos,
      assuntos,
      horas,
      progresso,
    };
  }

  private checkIsCorrect(q: any, sel: string): boolean {
    if (!q || !sel) return false;
    let correct = "";
    if (q.resposta_correta) correct = String(q.resposta_correta).toUpperCase().trim();
    else if (q.correct_option) correct = String(q.correct_option).toUpperCase().trim();
    else if (q.resposta_boolean !== undefined && q.resposta_boolean !== null) {
      correct = q.resposta_boolean ? "C" : "E";
    }
    const normalizedSel = String(sel).toUpperCase().trim();
    if (normalizedSel === correct) return true;
    if (q.tipo === "certo_errado") {
      if ((normalizedSel === "CERTO" || normalizedSel === "C") && (correct === "C" || q.resposta_boolean === true)) return true;
      if ((normalizedSel === "ERRADO" || normalizedSel === "E") && (correct === "E" || q.resposta_boolean === false)) return true;
    }
    return false;
  }

  get effectiveAccuracyByDisciplina(): { disciplina: string; total: number; corretas: number; pct: number }[] {
    if (this.accuracyByDisciplina && this.accuracyByDisciplina.length > 0) {
      return this.accuracyByDisciplina;
    }

    const sessionEntries = Object.entries(this.sessionAnswers || {});
    if (sessionEntries.length > 0) {
      const discStats = new Map<string, { total: number; corretas: number }>();
      for (const [, item] of sessionEntries) {
        const d = (item.disciplina || "GERAL").toUpperCase().trim();
        const current = discStats.get(d) || { total: 0, corretas: 0 };
        current.total++;
        if (item.isCorrect) current.corretas++;
        discStats.set(d, current);
      }
      return Array.from(discStats.entries()).map(([disciplina, stat]) => ({
        disciplina,
        total: stat.total,
        corretas: stat.corretas,
        pct: Math.round((stat.corretas / stat.total) * 100 * 10) / 10,
      })).sort((a, b) => b.pct - a.pct || b.total - a.total);
    }

    const answeredKeys = Object.keys(this.selectedAnswers || {});
    if (!answeredKeys.length || !this.questions.length) return [];

    const qMap = new Map<string, any>();
    for (const q of this.questions) {
      if (q.id != null) qMap.set(String(q.id), q);
      if (q.id_qc) qMap.set(String(q.id_qc), q);
      if (q.codigo) qMap.set(String(q.codigo), q);
    }

    const discStats = new Map<string, { total: number; corretas: number }>();
    for (const qId of answeredKeys) {
      const q = qMap.get(String(qId));
      if (!q) continue;
      const d = ((q.disciplina || q.subject || "GERAL") as string).toUpperCase().trim();
      const current = discStats.get(d) || { total: 0, corretas: 0 };
      current.total++;
      if (this.checkIsCorrect(q, this.selectedAnswers[qId])) {
        current.corretas++;
      }
      discStats.set(d, current);
    }

    return Array.from(discStats.entries()).map(([disciplina, stat]) => ({
      disciplina,
      total: stat.total,
      corretas: stat.corretas,
      pct: Math.round((stat.corretas / stat.total) * 100 * 10) / 10,
    })).sort((a, b) => b.pct - a.pct || b.total - a.total);
  }

  private destroyAll() {
    this.chartDisciplina?.destroy();
    this.chartHoras?.destroy();
    this.chartAcerto?.destroy();
    this.chartDisciplina = undefined;
    this.chartHoras = undefined;
    this.chartAcerto = undefined;
  }

  buildAllCharts() {
    // Renderiza primeiro o gráfico de Acerto por Disciplina no topo
    if (this.effectiveAccuracyByDisciplina.length) this.buildAcertoChart();
    setTimeout(() => this.buildDisciplinaChart(), 30);
    setTimeout(() => { if (this._cache.horas.length) this.buildHorasChart(); }, 80);
  }

  private buildDisciplinaChart() {
    if (!this.disciplinaChartRef?.nativeElement) return;
    this.chartDisciplina?.destroy();
    const data = this._cache.disciplinas;
    if (!data.length) return;
    const ctx = this.disciplinaChartRef.nativeElement.getContext("2d")!;

    const bgColors = data.map(d => {
      const baseColor = this.getDisciplineColor(d.name);
      const grad = ctx.createLinearGradient(0, 0, 500, 0);
      grad.addColorStop(0, baseColor);
      grad.addColorStop(1, baseColor + "99");
      return grad;
    });

    this.chartDisciplina = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: bgColors,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => {
                const item = data[c.dataIndex];
                return ` ${c.parsed.x} questões (${item.pct}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: this.gridColor },
            ticks: { color: this.labelColor, font: { size: 10 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: this.labelColor, font: { size: 10 } },
          },
        },
      },
    });
  }

  private buildHorasChart() {
    if (!this.horasChartRef?.nativeElement) return;
    this.chartHoras?.destroy();
    const data = this._cache.horas;
    if (!data.length) return;
    const ctx = this.horasChartRef.nativeElement.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, "#f59e0b"); grad.addColorStop(1, "#f59e0b44");
    this.chartHoras = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map(d => d.label.length > 14 ? d.label.slice(0, 12) + "..." : d.label),
        datasets: [{ label: "h/semana", data: data.map(d => d.horas), backgroundColor: grad, borderRadius: 8, borderSkipped: false }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y}h / semana` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: this.labelColor, font: { size: 10 } } },
          y: { grid: { color: this.gridColor }, ticks: { color: this.labelColor, font: { size: 10 }, stepSize: 2 }, beginAtZero: true },
        },
      },
    });
  }

  buildAcertoChart() {
    if (!this.acertoChartRef?.nativeElement) return;
    this.chartAcerto?.destroy();
    const data = [...this.effectiveAccuracyByDisciplina].sort((a, b) => b.pct - a.pct).slice(0, 15);
    if (!data.length) return;

    // Cores padronizadas por disciplina
    const barColors = data.map(d => this.getDisciplineColor(d.disciplina));

    this.chartAcerto = new Chart(this.acertoChartRef.nativeElement, {
      type: "bar",
      data: {
        labels: data.map(d => d.disciplina.length > 20 ? d.disciplina.slice(0, 18) + "..." : d.disciplina),
        datasets: [{
          data: data.map(d => d.pct),
          backgroundColor: barColors,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 48,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                const item = data[items[0]?.dataIndex];
                return item?.disciplina || '';
              },
              label: (c) => {
                const item = data[c.dataIndex];
                return ` ${c.parsed.y}% acerto (${item.corretas}/${item.total} questões)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: this.labelColor,
              font: { size: 10, weight: 600 },
              maxRotation: 30,
              minRotation: 0,
            },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: this.gridColor },
            ticks: {
              color: this.labelColor,
              font: { size: 10 },
              stepSize: 20,
              callback: (v) => `${v}%`,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}
