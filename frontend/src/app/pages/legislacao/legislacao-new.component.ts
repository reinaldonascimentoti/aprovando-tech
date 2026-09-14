import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LegislacaoService } from '../../services/legislacao.service';
import { ThemeService } from '../../services/theme.service';

const TIPOS_LEGISLACAO = [
  'Lei', 'Lei Complementar', 'Decreto', 'Decreto-Lei', 'Medida Provisória',
  'Emenda Constitucional', 'Resolução', 'Portaria', 'Instrução Normativa',
  'Regulamento', 'Regimento', 'Constituição', 'Outro',
];

@Component({
  selector: 'app-legislacao-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] p-4 sm:p-6 md:p-8">

      <!-- Header -->
      <header class="neo-raised rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined !text-[22px]">upload_file</span>
          </div>
          <div>
            <h1 class="text-lg font-black text-[var(--on-surface)]">Nova Legislação</h1>
            <p class="text-xs text-[var(--on-surface-variant)]">Envie o documento e inicie o processamento com IA</p>
          </div>
        </div>
        <button (click)="router.navigate(['/legislacao'])"
          class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-[var(--primary)]">
          <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
          <span class="hidden sm:inline">Voltar</span>
        </button>
      </header>

      <!-- Form -->
      <div class="max-w-2xl mx-auto">
        <div class="neo-raised rounded-3xl p-6 sm:p-8 flex flex-col gap-6 bg-[var(--card-bg)]">

          <!-- Como funciona -->
          <div class="rounded-2xl p-4 bg-[#523bf6]/8 border border-[#523bf6]/20 flex flex-col gap-2">
            <p class="text-xs font-bold text-[#523bf6] dark:text-purple-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[16px]">info</span>
              Como funciona
            </p>
            <ol class="text-xs text-[var(--on-surface-variant)] space-y-1 pl-4 list-decimal">
              <li>Faça o upload do documento (PDF recomendado)</li>
              <li><strong>Agente Extrator</strong> identifica todos os artigos e estrutura a legislação</li>
              <li><strong>Agente Comentador</strong> processa cada artigo individualmente com IA</li>
              <li>Você pode acompanhar o progresso em tempo real e fechar a página</li>
            </ol>
          </div>

          <!-- Campo: Título -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-bold text-[var(--on-surface)]">Título *</label>
            <input
              [(ngModel)]="form.titulo"
              type="text"
              placeholder="Ex: Lei nº 8.112/1990 — Regime Jurídico dos Servidores Federais"
              class="w-full px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] placeholder:text-[var(--on-surface-variant)]/50 transition-all"
            />
          </div>

          <!-- Tipo + Número + Ano (linha) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-[var(--on-surface)]">Tipo</label>
              <select
                [(ngModel)]="form.tipo"
                class="w-full px-3 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all">
                <option value="">Selecione...</option>
                <option *ngFor="let t of tipos" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-[var(--on-surface)]">Número</label>
              <input
                [(ngModel)]="form.numero"
                type="text"
                placeholder="Ex: 8.112"
                class="w-full px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-[var(--on-surface)]">Ano</label>
              <input
                [(ngModel)]="form.ano"
                type="number"
                placeholder="Ex: 1990"
                min="1900"
                max="2099"
                class="w-full px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
              />
            </div>
          </div>

          <!-- Upload de arquivo -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-bold text-[var(--on-surface)]">Arquivo *</label>
            <div
              class="relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              [ngClass]="arquivoSelecionado ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--outline-variant)]'"
              (click)="fileInput.click()"
              (dragover)="$event.preventDefault()"
              (drop)="onDrop($event)">
              <input #fileInput type="file" accept=".pdf,.doc,.docx,.txt" class="hidden" (change)="onFileChange($event)"/>
              <div *ngIf="!arquivoSelecionado" class="flex flex-col items-center gap-2 text-center">
                <span class="material-symbols-outlined !text-[40px] text-[var(--on-surface-variant)]/40">upload_file</span>
                <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Clique ou arraste o arquivo aqui</p>
                <p class="text-xs text-[var(--on-surface-variant)]/60">PDF, DOC, DOCX ou TXT • Máximo 50MB</p>
              </div>
              <div *ngIf="arquivoSelecionado" class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center">
                  <span class="material-symbols-outlined !text-[20px] text-[var(--primary)]">description</span>
                </div>
                <div>
                  <p class="text-sm font-bold text-[var(--on-surface)]">{{ arquivoSelecionado.name }}</p>
                  <p class="text-xs text-[var(--on-surface-variant)]">{{ formatFileSize(arquivoSelecionado.size) }}</p>
                </div>
                <button (click)="$event.stopPropagation(); removerArquivo()"
                  class="ml-auto p-1.5 rounded-lg hover:bg-[var(--error)]/10 text-[var(--error)] transition-all">
                  <span class="material-symbols-outlined !text-[18px]">close</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Erro -->
          <div *ngIf="erro" class="rounded-xl p-3.5 bg-[var(--error)]/10 border border-[var(--error)]/30 flex items-center gap-2 text-sm text-[var(--error)]">
            <span class="material-symbols-outlined !text-[18px]">error</span>
            {{ erro }}
          </div>

          <!-- Botões -->
          <div class="flex gap-3 justify-end pt-2 border-t border-[var(--outline-variant)]/40">
            <button (click)="router.navigate(['/legislacao'])"
              class="btn-neo px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--on-surface)]">
              Cancelar
            </button>
            <button (click)="enviar()"
              [disabled]="enviando || !form.titulo || !arquivoSelecionado"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#523bf6] to-indigo-600 hover:from-[#472fc2] hover:to-indigo-700 text-white font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all">
              <span *ngIf="!enviando" class="material-symbols-outlined !text-[18px]">rocket_launch</span>
              <span *ngIf="enviando" class="material-symbols-outlined !text-[18px] animate-spin">sync</span>
              {{ enviando ? 'Enviando...' : 'Enviar e Processar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LegislacaoNewComponent {
  tipos = TIPOS_LEGISLACAO;
  form = { titulo: '', tipo: '', numero: '', ano: null as number | null };
  arquivoSelecionado: File | null = null;
  enviando = false;
  erro = '';

  constructor(
    public router: Router,
    private legislacaoService: LegislacaoService,
    public themeService: ThemeService,
  ) {}

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.arquivoSelecionado = input.files[0];
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.arquivoSelecionado = file;
  }

  removerArquivo() {
    this.arquivoSelecionado = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  enviar() {
    if (!this.form.titulo.trim()) { this.erro = 'Título é obrigatório.'; return; }
    if (!this.arquivoSelecionado) { this.erro = 'Selecione um arquivo.'; return; }
    this.erro = '';
    this.enviando = true;

    this.legislacaoService.upload(
      this.arquivoSelecionado,
      this.form.titulo,
      this.form.tipo || undefined,
      this.form.numero || undefined,
      this.form.ano || undefined,
    ).subscribe({
      next: (res: any) => {
        const id = res?.data?.id;
        this.enviando = false;
        if (id) {
          this.router.navigate(['/legislacao', id]);
        } else {
          this.router.navigate(['/legislacao']);
        }
      },
      error: (err: any) => {
        this.enviando = false;
        this.erro = err?.error?.message || 'Erro ao enviar. Tente novamente.';
      },
    });
  }
}
