import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { getBancaLogo, getBancaInfo, BancaInfo } from '../../utils/banca.utils';

@Component({
  selector: 'app-editais-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] transition-colors duration-300 p-4 md:p-8 max-w-7xl mx-auto">

      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
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
          Catálogo de Editais
        </span>
      </div>

      <!-- Page Header -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
                <span class="material-symbols-outlined !text-[28px]">apps</span>
              </div>
              <div>
                <h1 class="text-2xl md:text-3xl font-black text-[var(--on-surface)]">Todos os Editais</h1>
                <p class="text-xs text-[var(--on-surface-variant)]">Editais analisados pela plataforma — adicione ao seu perfil para estudar</p>
              </div>
            </div>
          </div>

          <!-- Search bar -->
          <div class="neo-pressed rounded-2xl px-4 py-3 flex items-center gap-2 md:w-72">
            <span class="material-symbols-outlined text-[var(--on-surface-variant)] !text-[20px]">search</span>
            <input
              [(ngModel)]="searchQuery"
              type="text"
              placeholder="Buscar edital, cargo ou concurso..."
              class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]">
          </div>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--outline-variant)]/30">
          <div class="neo-pressed rounded-xl px-3 py-2 flex items-center bg-[var(--background)]">
            <select
              [(ngModel)]="filterConcurso"
              class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer">
              <option value="">Todos os Concursos</option>
              <option *ngFor="let c of availableConcursos" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="neo-pressed rounded-xl px-3 py-2 flex items-center bg-[var(--background)]">
            <select
              [(ngModel)]="filterStatus"
              class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer">
              <option value="">Todos os Status</option>
              <option value="completed">Análise Concluída</option>
              <option value="processing">Processando</option>
            </select>
          </div>
          <div class="neo-pressed rounded-xl px-3 py-2 flex items-center gap-2 bg-[var(--background)] col-span-2 sm:col-span-1">
            <span class="text-xs text-[var(--on-surface-variant)] font-semibold">
              Mostrando <strong class="text-[var(--primary)]">{{ filteredEditais.length }}</strong> editais
            </span>
            <button *ngIf="filterConcurso || filterStatus || searchQuery" (click)="clearFilters()"
              class="ml-auto text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5">
              <span class="material-symbols-outlined !text-[14px]">filter_alt_off</span> Limpar
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let _ of [1,2,3,4,5,6]" class="neo-raised rounded-3xl p-6 animate-pulse h-40"></div>
      </div>

      <!-- Editais Grid -->
      <div *ngIf="!loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          *ngFor="let ed of filteredEditais"
          class="rounded-3xl p-6 bg-white dark:bg-[#0f1220] border transition-all duration-300 flex flex-col justify-between gap-3.5 relative overflow-hidden text-slate-800 dark:text-white group"
          [ngClass]="isAlreadyAdded(ed.id)
            ? 'border-2 border-indigo-500/60 dark:border-[#7c3aed] shadow-lg shadow-indigo-500/10'
            : 'border-slate-200/90 dark:border-[#1f253d] shadow-sm hover:shadow-xl dark:shadow-xl hover:border-indigo-400/60 dark:hover:border-[#7c3aed]/50 hover:-translate-y-1'">

          <!-- Top Accent Bar: Highlight for user's own editais -->
          <div *ngIf="isAlreadyAdded(ed.id)" class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5d3bf6] via-[#7c3aed] to-[#38bdf8]"></div>
          <div *ngIf="!isAlreadyAdded(ed.id)" class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/70 dark:via-[#7c3aed]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <!-- Row 1: Orgao Badge & Status -->
          <div class="flex items-center justify-between gap-2.5 w-full flex-wrap">
            <div class="flex items-center gap-1.5 flex-wrap">
              <!-- Distinctive My Edital Badge if added -->
              <span *ngIf="isAlreadyAdded(ed.id)" class="bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span class="material-symbols-outlined !text-[13px]">verified</span>
                <span>Meu Edital</span>
              </span>

              <div class="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-purple-100 dark:bg-[#7c3aed]/20 border border-purple-300 dark:border-[#7c3aed] text-purple-900 dark:text-white font-extrabold text-xs tracking-tight shadow-xs shadow-purple-500/10 dark:shadow-[#7c3aed]/20">
                <span>{{ getEditalOrgao(ed) }}</span>
              </div>
            </div>

            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-[#7c3aed]/15 border border-purple-200 dark:border-[#a855f7]/40 text-purple-700 dark:text-[#c084fc] text-[11.5px] font-bold whitespace-nowrap">
              <span class="material-symbols-outlined !text-[14px] text-purple-600 dark:text-[#a855f7]">
                {{ ed.status === 'completed' ? 'donut_large' : 'hourglass_top' }}
              </span>
              <span>{{ ed.status === 'completed' ? 'Pareto 80/20 Calculado' : 'Processando' }}</span>
            </div>
          </div>

          <!-- Row 2: Banca Logo & Year -->
          <div class="flex items-center gap-2 mt-1">
            <span *ngIf="getEditalBanca(ed)?.logo" class="inline-flex items-center justify-center h-5 w-9 bg-white border border-slate-200 dark:border-transparent rounded px-1 shadow-xs">
              <img [src]="getEditalBanca(ed)?.logo" [alt]="getEditalBancaName(ed)" class="max-h-full max-w-full object-contain" />
            </span>
            <span class="text-xs sm:text-[13px] font-bold text-slate-600 dark:text-[#94a3b8]">
              {{ getEditalBancaName(ed) || 'FGV' }} • {{ getEditalAno(ed) }}
            </span>
          </div>

          <!-- Row 3: Edital para Análise (Nome Informado) + Cargo -->
          <div class="my-1.5 min-h-[48px] flex flex-col justify-center">
            <h3 class="text-[15px] sm:text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2 flex items-center gap-1.5" [title]="ed.title || ed.cargo">
              <span class="material-symbols-outlined !text-[17px] text-indigo-600 dark:text-indigo-400 shrink-0">description</span>
              <span>{{ ed.title || ed.cargo }}</span>
            </h3>
            <p *ngIf="ed.cargo" class="text-xs font-semibold text-slate-500 dark:text-[#a78bfa] mt-0.5 truncate flex items-center gap-1" [title]="ed.cargo">
              <span class="material-symbols-outlined !text-[14px] text-slate-400 dark:text-slate-400 shrink-0">badge</span>
              <span>{{ ed.cargo }}</span>
            </p>
          </div>

          <!-- Row 4: Metrics Inset Box (3 Columns) -->
          <div class="grid grid-cols-3 gap-1.5 p-3 rounded-2xl bg-white dark:bg-white/[0.025] border border-slate-200/80 dark:border-white/[0.06] text-center my-1">
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold text-indigo-600 dark:text-[#818cf8] uppercase tracking-wider opacity-90">Tópicos IA</span>
              <span class="text-base font-black text-slate-900 dark:text-white">{{ getEditalTopicosCount(ed) }}</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold text-indigo-600 dark:text-[#818cf8] uppercase tracking-wider opacity-90">Questões</span>
              <span class="text-base font-black text-slate-900 dark:text-white">{{ getEditalQuestoesCount(ed) }}</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold text-indigo-600 dark:text-[#818cf8] uppercase tracking-wider opacity-90">Precisão IA</span>
              <span class="text-base font-black text-emerald-600 dark:text-[#00e599]">{{ getEditalScoreIA(ed) }}</span>
            </div>
          </div>

          <!-- Row 5: Pareto Progress Section -->
          <div class="flex flex-col gap-2 mt-1">
            <div class="flex items-center justify-between text-xs font-semibold">
              <div class="inline-flex items-center gap-1 font-bold text-indigo-950 dark:text-[#c7d2fe]">
                <span class="material-symbols-outlined !text-[16px] text-amber-500 dark:text-[#f59e0b]">bolt</span>
                <span>Pareto 80/20:</span>
              </div>
              <div class="text-slate-600 dark:text-[#94a3b8] text-[11.5px]">
                <span>20% cobre </span>
                <strong class="text-indigo-600 dark:text-[#60a5fa] font-extrabold">{{ getEditalParetoPercent(ed) }}%</strong>
                <span> da prova</span>
              </div>
            </div>
            <div class="w-full h-1.5 bg-slate-200 dark:bg-[#1c2237] rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 dark:from-[#6366f1] dark:via-[#8b5cf6] dark:to-[#38bdf8] transition-all duration-700"
                   [style.width.%]="getEditalParetoPercent(ed)"></div>
            </div>
          </div>

          <!-- Row 6: Footer Action & Timestamp -->
          <div class="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-white/[0.06] mt-1 gap-2">
            <div class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-[#94a3b8]">
              <span class="material-symbols-outlined !text-[16px] text-slate-400 dark:text-[#64748b]">schedule</span>
              <span>Analisado {{ getEditalDateText(ed) }}</span>
            </div>

            <button
              *ngIf="ed.status === 'completed'"
              (click)="addToProfile(ed)"
              [disabled]="addingEditalId === ed.id || isAlreadyAdded(ed.id)"
              class="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold transition-all cursor-pointer disabled:opacity-80"
              [ngClass]="isAlreadyAdded(ed.id)
                ? 'text-purple-700 dark:text-purple-300 font-extrabold cursor-default'
                : 'text-indigo-600 hover:text-purple-700 dark:text-[#818cf8] dark:hover:text-[#c084fc]'">
              <span>{{ isAlreadyAdded(ed.id) ? '✓ Adicionado aos Meus Editais' : addingEditalId === ed.id ? 'Adicionando...' : '+ Adicionar ao Perfil' }}</span>
              <span class="material-symbols-outlined !text-[16px] group-hover:translate-x-1 transition-transform">
                {{ isAlreadyAdded(ed.id) ? 'verified' : addingEditalId === ed.id ? 'hourglass_empty' : 'arrow_forward' }}
              </span>
            </button>

            <span
              *ngIf="ed.status !== 'completed'"
              class="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span class="material-symbols-outlined !text-[14px]">hourglass_empty</span>
              Aguardando
            </span>
          </div>

        </div>

        <!-- Empty state -->
        <div *ngIf="filteredEditais.length === 0" class="col-span-3 flex flex-col items-center justify-center py-20 text-center gap-4">
          <span class="material-symbols-outlined !text-[64px] text-[#c7c4d8]">search_off</span>
          <p class="text-sm font-semibold text-[#767587]">Nenhum edital encontrado com esses filtros.</p>
          <button (click)="clearFilters()" class="btn-neo px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
            <span class="material-symbols-outlined !text-[16px]">filter_alt_off</span>
            Limpar Filtros
          </button>
        </div>
      </div>

    </div>
  `
})
export class EditaisCatalogComponent implements OnInit {
  public themeService = inject(ThemeService);
  user: UserProfile | null = null;
  allEditais: any[] = [];
  userEditalIds: Set<string> = new Set();
  loading = false;
  addingEditalId: string | null = null;

  searchQuery = '';
  filterConcurso = '';
  filterStatus = '';

  readonly today = new Date().toISOString().split('T')[0];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadEditais();
  }

  loadEditais() {
    this.loading = true;
    // Carrega todos os editais (admin-like, sem filtro de userId para ver o catálogo completo)
    this.apiService.getEditais().subscribe({
      next: (all) => {
        this.allEditais = all || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    // Carrega editais do user para marcar os já adicionados
    if (this.user?.id) {
      this.apiService.getEditais(this.user.id).subscribe({
        next: (userEditais) => {
          this.userEditalIds = new Set((userEditais || []).map((e: any) => e.id));
        }
      });
    }
  }

  get availableConcursos(): string[] {
    const set = new Set<string>();
    for (const ed of this.allEditais) {
      if (ed.concurso) set.add(ed.concurso);
    }
    return Array.from(set).sort();
  }

  get filteredEditais(): any[] {
    return this.allEditais.filter(ed => {
      if (this.filterStatus && ed.status !== this.filterStatus) return false;
      if (this.filterConcurso && ed.concurso !== this.filterConcurso) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const match =
          (ed.title || '').toLowerCase().includes(q) ||
          (ed.cargo || '').toLowerCase().includes(q) ||
          (ed.concurso || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }

  isAlreadyAdded(editalId: string): boolean {
    return this.userEditalIds.has(editalId);
  }

  addToProfile(ed: any) {
    if (!this.user?.id || this.isAlreadyAdded(ed.id)) return;
    this.addingEditalId = ed.id;
    this.apiService.sendEditalToUser(ed.id, this.user.id).subscribe({
      next: () => {
        this.userEditalIds.add(ed.id);
        this.addingEditalId = null;
      },
      error: () => { this.addingEditalId = null; }
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterConcurso = '';
    this.filterStatus = '';
  }

  goBack() {
    this.router.navigate(['/student']);
  }

  getEditalBancaName(edital: any): string {
    if (!edital) return '';
    return edital.banca ||
      edital.concurso_info?.banca ||
      edital.pareto_data?.concurso_info?.banca ||
      edital.pareto_data?.alertas_banca?.banca_identificada ||
      '';
  }

  getEditalBanca(edital: any): BancaInfo | null {
    const name = this.getEditalBancaName(edital);
    return getBancaInfo(name);
  }

  getEditalOrgao(ed: any): string {
    if (ed.orgao) return ed.orgao;
    if (ed.concurso) return ed.concurso;
    const title = ed.title || '';
    const parts = title.split('—');
    if (parts.length > 1) return parts[0].trim();
    const slashParts = title.split('-');
    if (slashParts.length > 1) return slashParts[0].trim();
    return ed.concurso || 'EDITAL';
  }

  getEditalAno(ed: any): number | string {
    if (ed.ano) return ed.ano;
    if (ed.created_at) {
      const year = new Date(ed.created_at).getFullYear();
      if (!isNaN(year)) return year;
    }
    return 2026;
  }

  getEditalTopicosCount(ed: any): number {
    if (ed.topicosCount) return ed.topicosCount;
    const pd = ed.pareto_data;
    if (pd?.total_topicos) return pd.total_topicos;
    if (pd?.mapa_geral?.disciplinas) {
      let count = 0;
      pd.mapa_geral.disciplinas.forEach((d: any) => {
        count += (d.topicos?.length || d.camada_2_topicos?.length || 1);
      });
      if (count > 0) return count;
    }
    return 128;
  }

  getEditalQuestoesCount(ed: any): string {
    if (ed.questoesCount) return ed.questoesCount;
    if (ed.total_questoes) return `${ed.total_questoes}+`;
    return '3.450+';
  }

  getEditalScoreIA(ed: any): string {
    if (ed.scoreIA) return ed.scoreIA;
    if (ed.pareto_data?.score_ia) return `${ed.pareto_data.score_ia}%`;
    return '99%';
  }

  getEditalParetoPercent(ed: any): number {
    if (ed.paretoPercent) return ed.paretoPercent;
    if (ed.pareto_data?.pareto_percentage) return ed.pareto_data.pareto_percentage;
    if (ed.pareto_data?.pareto_percent) return ed.pareto_data.pareto_percent;
    return 84;
  }

  getEditalDateText(ed: any): string {
    if (ed.dataAnalise) return ed.dataAnalise;
    if (!ed.created_at) return 'Hoje';
    const d = new Date(ed.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  }
}
