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

const RAMOS_DIREITO = [
  'Direito Constitucional', 'Direito Administrativo', 'Direito Civil', 'Direito Penal',
  'Direito Processual Civil', 'Direito Processual Penal', 'Direito Processual do Trabalho',
  'Direito do Trabalho', 'Direito Tributário', 'Direito Empresarial', 'Direito do Consumidor',
  'Direito Previdenciário', 'Direito Ambiental', 'Direito Digital', 'Direito Internacional (Público e Privado)',
  'Direito de Família e Sucessões', 'Direito Imobiliário', 'Direito Eleitoral', 'Direito Financeiro',
  'Direito da Propriedade Intelectual', 'Direito Médico e da Saúde'
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
            <p class="text-xs text-[var(--on-surface-variant)]">Envie o documento ou link e inicie o pipeline com IA</p>
          </div>
        </div>
        <button (click)="router.navigate(['/legislacao'])"
          class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-[var(--primary)] cursor-pointer">
          <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
          <span class="hidden sm:inline">Voltar</span>
        </button>
      </header>

      <!-- Form -->
      <div class="max-w-2xl mx-auto">
        <div class="neo-raised rounded-3xl p-6 sm:p-8 flex flex-col gap-6 bg-[var(--card-bg)]">

          <!-- Como funciona -->
          <div class="rounded-2xl p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex flex-col gap-2">
            <p class="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[16px]">info</span>
              Como funciona o pipeline
            </p>
            <ol class="text-xs text-[var(--on-surface-variant)] space-y-1 pl-4 list-decimal">
              <li>Envie um <strong>arquivo (PDF/DOCX)</strong> ou cole o <strong>link oficial</strong> da legislação</li>
              <li><strong>Agente 1 (Extrator)</strong> identifica todos os artigos e estrutura o documento</li>
              <li><strong>Agente 2 (Comentador)</strong> processa comentários didáticos artigo por artigo</li>
              <li><strong>Agente 3 (Analista)</strong> define a priorização e metas estratégicas de treino</li>
              <li>Você pode fechar a página e acompanhar o processamento em tempo real</li>
            </ol>
          </div>

          <!-- Seletor de Origem: Arquivo vs Link -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-bold text-[var(--on-surface)]">Forma de Envio *</label>
            <div class="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/50">
              <button
                type="button"
                (click)="modo = 'arquivo'"
                [class.bg-gradient-to-r]="modo === 'arquivo'"
                [class.from-[#5d3bf6]]="modo === 'arquivo'"
                [class.to-[#7c3aed]]="modo === 'arquivo'"
                [class.text-white]="modo === 'arquivo'"
                [class.shadow-md]="modo === 'arquivo'"
                [class.text-[var(--on-surface-variant)]]="modo !== 'arquivo'"
                class="py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
                <span class="material-symbols-outlined !text-[18px]">upload_file</span>
                <span>Upload de Arquivo</span>
              </button>

              <button
                type="button"
                (click)="modo = 'link'"
                [class.bg-gradient-to-r]="modo === 'link'"
                [class.from-[#5d3bf6]]="modo === 'link'"
                [class.to-[#7c3aed]]="modo === 'link'"
                [class.text-white]="modo === 'link'"
                [class.shadow-md]="modo === 'link'"
                [class.text-[var(--on-surface-variant)]]="modo !== 'link'"
                class="py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
                <span class="material-symbols-outlined !text-[18px]">link</span>
                <span>Link / URL da Web</span>
              </button>
            </div>
          </div>

          <!-- Campo: Título -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-bold text-[var(--on-surface)]">Título da Legislação *</label>
            <input
              [(ngModel)]="form.titulo"
              type="text"
              placeholder="Ex: Lei nº 8.112/1990 — Regime Jurídico dos Servidores Federais"
              class="w-full px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] placeholder:text-[var(--on-surface-variant)]/50 transition-all"
            />
          </div>

          <!-- Campo: Ramo do Direito -->
          <div class="flex flex-col gap-1.5 mt-2">
            <label class="text-sm font-bold text-[var(--on-surface)]">Ramo do Direito *</label>
            <select
              [(ngModel)]="form.ramo_direito"
              class="w-full px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all">
              <option value="">Selecione o ramo</option>
              <option *ngFor="let r of ramosDireito" [value]="r">{{ r }}</option>
            </select>
          </div>

          <!-- Tipo + Número + Ano (linha) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-[var(--on-surface)]">Tipo</label>
              <select
                [(ngModel)]="form.tipo"
                class="w-full px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all">
                <option value="">Selecione o tipo</option>
                <option *ngFor="let t of tipos" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-[var(--on-surface)]">Número</label>
              <input
                [(ngModel)]="form.numero"
                type="text"
                placeholder="Ex: 8.112"
                class="w-full px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] placeholder:text-[var(--on-surface-variant)]/50 transition-all"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-[var(--on-surface)]">Ano</label>
              <input
                [(ngModel)]="form.ano"
                type="number"
                placeholder="Ex: 1990"
                class="w-full px-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] placeholder:text-[var(--on-surface-variant)]/50 transition-all"
              />
            </div>
          </div>

          <!-- OPÇÃO 1: Upload de Arquivo -->
          <div *ngIf="modo === 'arquivo'" class="flex flex-col gap-1.5">
            <label class="text-sm font-bold text-[var(--on-surface)]">Arquivo (PDF recomendado) *</label>
            <label
              class="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-[var(--outline-variant)] hover:border-[var(--primary)] bg-[var(--surface-container-low)] cursor-pointer transition-all group"
            >
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                (change)="onFileChange($event)"
                class="hidden"
              />
              <div class="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined !text-[32px]">
                  {{ arquivoSelecionado ? 'check_circle' : 'cloud_upload' }}
                </span>
              </div>
              <div class="text-center">
                <p class="text-sm font-bold text-[var(--on-surface)]">
                  {{ arquivoSelecionado ? arquivoSelecionado.name : 'Clique para selecionar o arquivo' }}
                </p>
                <p class="text-xs text-[var(--on-surface-variant)] mt-0.5">
                  {{ arquivoSelecionado ? (arquivoSelecionado.size / 1024 / 1024 | number:'1.2-2') + ' MB' : 'PDF, TXT ou DOCX até 50MB' }}
                </p>
              </div>
              <span *ngIf="!arquivoSelecionado" class="text-xs text-[var(--primary)] font-semibold underline underline-offset-2">
                Escolher arquivo
              </span>
            </label>
          </div>

          <!-- OPÇÃO 2: Link / URL -->
          <div *ngIf="modo === 'link'" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-[var(--on-surface)]">Link / URL da Legislação *</label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-[var(--on-surface-variant)] !text-[20px] pointer-events-none">
                  link
                </span>
                <input
                  [(ngModel)]="form.url"
                  type="url"
                  placeholder="https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm"
                  class="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] placeholder:text-[var(--on-surface-variant)]/50 transition-all"
                />
              </div>
            </div>

            <!-- Sugestões de Fontes Oficiais -->
            <div class="p-3.5 rounded-xl bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/50 flex flex-col gap-2">
              <p class="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1">
                <span class="material-symbols-outlined !text-[14px]">public</span>
                Fontes Oficiais Suportadas
              </p>
              <p class="text-xs text-[var(--on-surface-variant)]">
                Você pode colar links diretos do <strong>Portal da Legislação (Planalto)</strong>, <strong>Senado Federal</strong>, <strong>Câmara dos Deputados</strong>, <strong>Diários Oficiais</strong> ou URLs diretas de documentos em PDF.
              </p>
            </div>
          </div>

          <!-- Erro -->
          <div *ngIf="erro" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <span class="material-symbols-outlined !text-[18px]">error</span>
            {{ erro }}
          </div>

          <!-- Botões -->
          <div class="flex gap-3 justify-end pt-2 border-t border-[var(--outline-variant)]/40">
            <button (click)="router.navigate(['/legislacao'])"
              class="btn-neo px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--on-surface)] cursor-pointer">
              Cancelar
            </button>
            <button (click)="enviar()"
              [disabled]="enviando || !form.titulo || !form.ramo_direito || (modo === 'arquivo' && !arquivoSelecionado) || (modo === 'link' && !form.url.trim())"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white font-bold text-sm shadow-md shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all">
              <span *ngIf="!enviando" class="material-symbols-outlined !text-[18px]">rocket_launch</span>
              <span *ngIf="enviando" class="material-symbols-outlined !text-[18px] animate-spin">sync</span>
              {{ enviando ? 'Processando...' : 'Cadastrar e Processar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LegislacaoNewComponent {
  tipos = TIPOS_LEGISLACAO;
  ramosDireito = RAMOS_DIREITO;
  modo: 'arquivo' | 'link' = 'arquivo';
  form = {
    titulo: '',
    tipo: '',
    numero: '',
    ano: null as number | null,
    url: '',
    ramo_direito: '',
  };
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

  enviar() {
    if (!this.form.titulo.trim()) {
      this.erro = 'Título é obrigatório.';
      return;
    }

    if (!this.form.ramo_direito) {
      this.erro = 'O ramo do direito é obrigatório.';
      return;
    }

    if (this.modo === 'arquivo' && !this.arquivoSelecionado) {
      this.erro = 'Selecione um arquivo.';
      return;
    }

    if (this.modo === 'link') {
      if (!this.form.url?.trim()) {
        this.erro = 'Informe o link da legislação.';
        return;
      }
      try {
        new URL(this.form.url.trim());
      } catch {
        this.erro = 'Informe uma URL válida (ex: https://...).';
        return;
      }
    }

    this.erro = '';
    this.enviando = true;

    const file = this.modo === 'arquivo' ? this.arquivoSelecionado : null;
    const url = this.modo === 'link' ? this.form.url.trim() : undefined;

    this.legislacaoService.upload(
      file,
      this.form.titulo.trim(),
      this.form.tipo || undefined,
      this.form.numero || undefined,
      this.form.ano || undefined,
      url,
      this.form.ramo_direito,
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
