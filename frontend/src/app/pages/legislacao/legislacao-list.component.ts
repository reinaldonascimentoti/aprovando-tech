import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LegislacaoService, Legislacao } from '../../services/legislacao.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-legislacao-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] p-4 sm:p-6 md:p-8">

      <!-- Header -->
      <header class="neo-raised rounded-2xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined !text-[22px]">gavel</span>
          </div>
          <div>
            <h1 class="text-lg font-black text-[var(--on-surface)]">Comentador de Legislação</h1>
            <p class="text-xs text-[var(--on-surface-variant)]">Aprovando Tech • Análise Didática com IA</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="themeService.toggle()"
            class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-[var(--on-surface)]">
            <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">
              {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
            </span>
          </button>
          <button (click)="router.navigate(['/student'])"
            class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-[var(--primary)]">
            <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
            <span class="hidden sm:inline">Dashboard</span>
          </button>
          <button (click)="router.navigate(['/legislacao/nova'])"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#523bf6] to-indigo-600 hover:from-[#472fc2] hover:to-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined !text-[18px]">add</span>
            Nova Legislação
          </button>
        </div>
      </header>

      <!-- Loading -->
      <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let _ of [1,2,3]"
          class="rounded-3xl p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)] animate-pulse h-52"></div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && legislacoes.length === 0"
        class="neo-raised rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#5d3bf6]/20 to-[#7c3aed]/20 flex items-center justify-center">
          <span class="material-symbols-outlined !text-[44px] text-[var(--primary)]">gavel</span>
        </div>
        <h2 class="text-lg font-black text-[var(--on-surface)]">Nenhuma legislação cadastrada</h2>
        <p class="text-sm text-[var(--on-surface-variant)] max-w-sm">
          Envie uma lei, decreto ou instrução normativa para gerar comentários didáticos artigo por artigo.
        </p>
        <button (click)="router.navigate(['/legislacao/nova'])"
          class="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#523bf6] to-indigo-600 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer">
          <span class="material-symbols-outlined !text-[20px]">upload_file</span>
          Enviar primeira legislação
        </button>
      </div>

      <!-- Grid de cards -->
      <div *ngIf="!loading && legislacoes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let leg of legislacoes"
          class="rounded-3xl p-5 bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 relative overflow-hidden group cursor-pointer"
          (click)="router.navigate(['/legislacao', leg.id])">

          <!-- Glow top -->
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7c3aed]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <!-- Tipo + Status badge -->
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#7c3aed]/15 text-[#7c3aed] dark:text-purple-300 border border-[#7c3aed]/30">
              {{ leg.tipo || 'Legislação' }}
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border"
              [style.background-color]="getStatusBg(leg.status)"
              [style.color]="legislacaoService.getStatusColor(leg.status)"
              [style.border-color]="legislacaoService.getStatusColor(leg.status) + '40'">
              <span *ngIf="isProcessing(leg.status)" class="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                [style.background-color]="legislacaoService.getStatusColor(leg.status)"></span>
              {{ legislacaoService.getStatusLabel(leg.status) }}
            </span>
          </div>

          <!-- Número + Ano -->
          <p *ngIf="leg.numero || leg.ano" class="text-[11px] font-semibold text-[var(--on-surface-variant)]">
            {{ leg.numero ? 'Nº ' + leg.numero : '' }}{{ leg.numero && leg.ano ? ' / ' : '' }}{{ leg.ano || '' }}
          </p>

          <!-- Título -->
          <h3 class="text-sm font-black text-[var(--on-surface)] leading-snug line-clamp-2">{{ leg.titulo }}</h3>

          <!-- Progresso de comentários -->
          <div *ngIf="getComentariosProcessamento(leg)" class="flex flex-col gap-1.5 mt-1">
            <div class="flex justify-between text-[11px] font-semibold text-[var(--on-surface-variant)]">
              <span>Comentários</span>
              <span class="font-bold text-[var(--primary)]">
                {{ getComentariosProcessamento(leg)?.quantidade_processada || 0 }} / {{ getComentariosProcessamento(leg)?.quantidade_total || 0 }}
              </span>
            </div>
            <div class="w-full h-1.5 bg-[var(--surface-container)] rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-[#523bf6] to-[#7c3aed] transition-all duration-700"
                [style.width.%]="getComentariosPercent(leg)"></div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-3 border-t border-[var(--outline-variant)]/40 mt-auto gap-2">
            <span class="text-[11px] text-[var(--on-surface-variant)] flex items-center gap-1">
              <span class="material-symbols-outlined !text-[14px]">schedule</span>
              {{ formatDate(leg.created_at) }}
            </span>
            <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
              <button (click)="router.navigate(['/legislacao', leg.id])"
                class="btn-neo p-1.5 rounded-lg text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all" title="Ver detalhes">
                <span class="material-symbols-outlined !text-[16px]">visibility</span>
              </button>
              <button (click)="confirmarExcluir(leg)"
                class="btn-neo p-1.5 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition-all" title="Excluir">
                <span class="material-symbols-outlined !text-[16px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de confirmação de exclusão -->
      <div *ngIf="excluindoLeg"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="neo-raised rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 bg-[var(--card-bg)]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[var(--error)]/15 flex items-center justify-center">
              <span class="material-symbols-outlined !text-[20px] text-[var(--error)]">warning</span>
            </div>
            <h3 class="font-black text-[var(--on-surface)]">Excluir legislação?</h3>
          </div>
          <p class="text-sm text-[var(--on-surface-variant)]">
            Esta ação irá remover <strong>"{{ excluindoLeg.titulo }}"</strong> e todos os artigos e comentários associados. Esta ação é irreversível.
          </p>
          <div class="flex gap-3 justify-end">
            <button (click)="excluindoLeg = null"
              class="btn-neo px-4 py-2 rounded-xl text-sm font-semibold text-[var(--on-surface)]">Cancelar</button>
            <button (click)="executarExclusao()"
              [disabled]="excluindo"
              class="px-4 py-2 rounded-xl bg-[var(--error)] text-white font-bold text-sm disabled:opacity-50 cursor-pointer">
              {{ excluindo ? 'Excluindo...' : 'Excluir' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LegislacaoListComponent implements OnInit, OnDestroy {
  legislacoes: Legislacao[] = [];
  loading = true;
  excluindoLeg: Legislacao | null = null;
  excluindo = false;
  private subs: Subscription[] = [];

  constructor(
    public router: Router,
    public legislacaoService: LegislacaoService,
    public themeService: ThemeService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.carregar();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  carregar() {
    this.loading = true;
    const sub = this.legislacaoService.listar().subscribe({
      next: (data: any) => {
        this.legislacoes = Array.isArray(data) ? data : (data?.data || []);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
    this.subs.push(sub);
  }

  getStatusBg(status: string): string {
    const color = this.legislacaoService.getStatusColor(status);
    return color + '15';
  }

  isProcessing(status: string): boolean {
    return status === 'extraindo' || status === 'comentando';
  }

  getComentariosProcessamento(leg: any) {
    return (leg.processamentos || []).find((p: any) => p.etapa === 'comentarios');
  }

  getComentariosPercent(leg: any): number {
    const p = this.getComentariosProcessamento(leg);
    if (!p || !p.quantidade_total) return 0;
    return Math.round((p.quantidade_processada / p.quantidade_total) * 100);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  confirmarExcluir(leg: Legislacao) {
    this.excluindoLeg = leg;
  }

  executarExclusao() {
    if (!this.excluindoLeg) return;
    this.excluindo = true;
    const sub = this.legislacaoService.excluir(this.excluindoLeg.id).subscribe({
      next: () => {
        this.legislacoes = this.legislacoes.filter(l => l.id !== this.excluindoLeg?.id);
        this.excluindoLeg = null;
        this.excluindo = false;
      },
      error: () => { this.excluindo = false; },
    });
    this.subs.push(sub);
  }
}
