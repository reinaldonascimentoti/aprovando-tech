import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  LegislacaoService, Legislacao, LegislacaoArtigo,
  LegislacaoComentario, LegislacaoProcessamento, LegislacaoPlano, PreferenciasEstudante,
  BlocoEstudo, SessaoEstudo,
  LegislacaoMaterialConcurso, QuestaoConcurso, FlashcardConcurso, Pegadinha,
  PontoDeProva, ConceitoMemorizacao, Comparacao, ParametrosGeracaoConcurso,
  LegislacaoAnaliseEstrategica, AnaliseArtigoConcurso, ComparacaoRecomendada,
} from '../../services/legislacao.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-legislacao-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] p-4 sm:p-6 md:p-8">

      <!-- Top: Cards em Colunas (Card Geral, Card Informações, Card Artigos) -->
      <div *ngIf="!loading && legislacao" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <!-- 1. Card Geral -->
        <div class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col justify-between gap-3 h-full">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
                <span class="material-symbols-outlined !text-[20px]">gavel</span>
              </div>
              <div class="min-w-0">
                <span class="text-[10px] font-black uppercase tracking-wider text-[var(--primary)]">Legislação</span>
                <h1 class="text-sm font-black text-[var(--on-surface)] line-clamp-2 leading-snug" [title]="legislacao.titulo">
                  {{ legislacao.titulo }}
                </h1>
              </div>
            </div>
            <button (click)="router.navigate(['/legislacao'])"
              title="Voltar para a lista"
              class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white shadow-sm hover:shadow-md hover:opacity-95 active:scale-95 transition-all flex-shrink-0 cursor-pointer">
              <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
              <span>Voltar</span>
            </button>
          </div>

          <div class="flex items-center justify-between gap-2 pt-2 border-t border-[var(--outline-variant)]/30 text-xs">
            <span class="text-[var(--on-surface-variant)] truncate">
              {{ legislacao.tipo }} {{ legislacao.numero ? 'nº ' + legislacao.numero : '' }}{{ legislacao.ano ? '/' + legislacao.ano : '' }}
            </span>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex-shrink-0"
                [style.background-color]="legislacaoService.getStatusColor(legislacao.status) + '15'"
                [style.color]="legislacaoService.getStatusColor(legislacao.status)"
                [style.border-color]="legislacaoService.getStatusColor(legislacao.status) + '40'">
                <span *ngIf="isProcessing" class="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                  [style.background-color]="legislacaoService.getStatusColor(legislacao.status)"></span>
                {{ legislacaoService.getStatusLabel(legislacao.status || 'pendente') }}
              </span>
              <button *ngIf="legislacao.status === 'erro'" (click)="reprocessar()"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined !text-[12px]">refresh</span>
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Card Informações -->
        <div class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col justify-between gap-3 h-full">
          <div>
            <h3 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">info</span>
              Informações
            </h3>
            <p *ngIf="legislacao.ementa" class="text-xs text-[var(--on-surface-variant)] italic line-clamp-2 leading-relaxed border-l-2 border-[var(--primary)]/40 pl-2">
              {{ legislacao.ementa }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[var(--outline-variant)]/30">
            <div *ngIf="legislacao.orgao_emissor" class="flex flex-col">
              <span class="text-[10px] text-[var(--on-surface-variant)] uppercase font-semibold">Órgão</span>
              <span class="font-bold text-[var(--on-surface)] truncate">{{ legislacao.orgao_emissor }}</span>
            </div>
            <div *ngIf="legislacao.data_publicacao" class="flex flex-col">
              <span class="text-[10px] text-[var(--on-surface-variant)] uppercase font-semibold">Publicação</span>
              <span class="font-bold text-[var(--on-surface)]">{{ formatDate(legislacao.data_publicacao) }}</span>
            </div>
            <div *ngIf="legislacao.data_vigencia" class="flex flex-col">
              <span class="text-[10px] text-[var(--on-surface-variant)] uppercase font-semibold">Vigência</span>
              <span class="font-bold text-[var(--on-surface)]">{{ formatDate(legislacao.data_vigencia) }}</span>
            </div>
            <div *ngIf="artigos.length" class="flex flex-col">
              <span class="text-[10px] text-[var(--on-surface-variant)] uppercase font-semibold">Total</span>
              <span class="font-bold text-[var(--on-surface)]">{{ artigos.length }} artigos</span>
            </div>
          </div>
        </div>

        <!-- 3. Card Artigos -->
        <div class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col justify-between gap-3 h-full">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">article</span>
              Artigos
            </h3>
            <span *ngIf="artigos.length" class="text-[11px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full">
              {{ indiceArtigoAtual + 1 }} de {{ artigos.length }}
            </span>
          </div>

          <!-- Barra de Progresso de Leitura dos Artigos -->
          <div *ngIf="artigos.length" class="flex flex-col gap-1 py-1">
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-[var(--on-surface-variant)] font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined !text-[12px] text-emerald-500">task_alt</span>
                Progresso
              </span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ totalArtigosLidos }}/{{ artigos.length }} lidos ({{ progressoLeituraPercent }}%)</span>
            </div>
            <div class="w-full h-1.5 bg-[var(--surface-container)] rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width.%]="progressoLeituraPercent"></div>
            </div>
          </div>


          <!-- Backdrop para fechar dropdown ao clicar fora -->
          <div *ngIf="dropdownArtigosAberto" (click)="dropdownArtigosAberto = false" class="fixed inset-0 z-30 bg-black/10"></div>

          <!-- Botão do Dropdown -->
          <div class="relative">
            <button type="button"
              (click)="dropdownArtigosAberto = !dropdownArtigosAberto"
              class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 hover:border-[var(--primary)]/50 transition-all text-left">
              <div class="flex items-center gap-2 min-w-0">
                <span *ngIf="artigoSelecionado" class="w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full text-[9px] font-black"
                  [ngClass]="{
                    'bg-emerald-500 text-white': getComentarioStatus(artigoSelecionado) === 'concluido',
                    'bg-amber-400 text-white': getComentarioStatus(artigoSelecionado) === 'processando' || getComentarioStatus(artigoSelecionado) === 'pendente',
                    'bg-red-500 text-white': getComentarioStatus(artigoSelecionado) === 'erro',
                    'bg-[#334155] text-[#94a3b8]': !getComentarioStatus(artigoSelecionado)
                  }">
                  <span class="material-symbols-outlined !text-[10px]">
                    {{ getComentarioIcon(artigoSelecionado) }}
                  </span>
                </span>
                <span class="text-xs font-bold text-[var(--on-surface)] truncate">
                  {{ artigoSelecionado ? ('Art. ' + artigoSelecionado.numero + (artigoSelecionado.titulo ? ' — ' + artigoSelecionado.titulo : '')) : 'Selecione um artigo' }}
                </span>
              </div>
              <span class="material-symbols-outlined !text-[18px] text-[var(--on-surface-variant)] transition-transform duration-200"
                [class.rotate-180]="dropdownArtigosAberto">
                expand_more
              </span>
            </button>

            <!-- Painel do Dropdown -->
            <div *ngIf="dropdownArtigosAberto"
              class="absolute left-0 right-0 top-full mt-2 z-40 neo-raised rounded-xl bg-[var(--card-bg)] border border-[var(--outline-variant)]/60 shadow-2xl p-2 flex flex-col gap-1.5">
              <div class="relative">
                <input type="text"
                  [(ngModel)]="buscaArtigoTermo"
                  placeholder="Buscar artigo..."
                  class="w-full text-xs px-3 py-1.5 pl-8 rounded-lg bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] placeholder-[var(--on-surface-variant)]/50 focus:outline-none focus:border-[var(--primary)]" />
                <span class="material-symbols-outlined !text-[15px] text-[var(--on-surface-variant)]/60 absolute left-2.5 top-2">search</span>
              </div>

              <div class="overflow-y-auto max-h-56 pr-1 custom-scroll flex flex-col gap-0.5">
                <button *ngFor="let artigo of artigosFiltrados; trackBy: trackById"
                  type="button"
                  (click)="selecionarArtigoViaDropdown(artigo)"
                  class="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all text-xs"
                  [ngClass]="artigoSelecionado?.id === artigo.id ? 'bg-[var(--primary)]/15 font-bold text-[var(--primary)]' : 'hover:bg-[var(--surface-container-low)] text-[var(--on-surface)]'">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center rounded-full text-[8px] font-black"
                      [ngClass]="{
                        'bg-emerald-500 text-white': getComentarioStatus(artigo) === 'concluido',
                        'bg-amber-400 text-white': getComentarioStatus(artigo) === 'processando' || getComentarioStatus(artigo) === 'pendente',
                        'bg-red-500 text-white': getComentarioStatus(artigo) === 'erro',
                        'bg-[#334155] text-[#94a3b8]': !getComentarioStatus(artigo)
                      }">
                      <span class="material-symbols-outlined !text-[9px]">
                        {{ getComentarioIcon(artigo) }}
                      </span>
                    </span>
                    <span class="truncate">
                      Art. {{ artigo.numero }}
                      <span *ngIf="artigo.titulo" class="font-normal opacity-70"> — {{ artigo.titulo }}</span>
                    </span>
                  </div>
                  <span *ngIf="isArtigoLido(artigo.numero)"
                    class="material-symbols-outlined !text-[14px] text-emerald-500 flex-shrink-0"
                    title="Artigo concluído">
                    check_circle
                  </span>
                </button>

                <p *ngIf="artigosFiltrados.length === 0" class="text-xs text-center text-[var(--on-surface-variant)] py-3">
                  Nenhum artigo encontrado
                </p>
              </div>
            </div>
          </div>

          <!-- Botões de navegação rápida -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button (click)="artigoAnterior()"
              [disabled]="!temArtigoAnterior"
              class="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
              [ngClass]="temArtigoAnterior
                ? 'bg-[var(--surface-container-low)] text-[var(--on-surface)] border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container)]'
                : 'opacity-40 cursor-not-allowed text-[var(--on-surface-variant)] border-transparent'">
              <span class="material-symbols-outlined !text-[15px]">arrow_back</span>
              Anterior
            </button>

            <button (click)="proximoArtigo()"
              [disabled]="!temProximoArtigo"
              class="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
              [ngClass]="temProximoArtigo
                ? 'bg-[var(--primary)] text-white border-transparent hover:opacity-95 shadow-sm'
                : 'opacity-40 cursor-not-allowed text-[var(--on-surface-variant)] border-transparent bg-[var(--surface-container-low)]'">
              Próximo
              <span class="material-symbols-outlined !text-[15px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Card: Progresso (visível apenas durante o processamento ou para admin após concluída) -->
      <div *ngIf="!loading && legislacao && podeExibirProgresso" class="mb-6 neo-raised rounded-2xl p-5 flex flex-col gap-4 bg-[var(--card-bg)]">
        <h3 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
          <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">track_changes</span>
          Progresso
        </h3>
        <div *ngFor="let p of processamentos; trackBy: trackByEtapa" class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-[var(--on-surface)] flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                [ngClass]="{
                  'bg-emerald-500 text-white': p.status === 'concluido',
                  'bg-amber-500 text-white': p.status === 'processando',
                  'bg-red-500 text-white': p.status === 'erro',
                  'bg-[#334155] text-[#94a3b8]': p.status === 'pendente'
                }">
                <span *ngIf="p.status === 'concluido'" class="material-symbols-outlined !text-[11px]">check</span>
                <span *ngIf="p.status === 'processando'" class="material-symbols-outlined !text-[11px] animate-spin">sync</span>
                <span *ngIf="p.status === 'erro'" class="material-symbols-outlined !text-[11px]">close</span>
                <span *ngIf="p.status === 'pendente'" class="material-symbols-outlined !text-[11px]">radio_button_unchecked</span>
              </span>
              {{ getEtapaLabel(p.etapa) }}
            </span>
            <span *ngIf="p.quantidade_total" class="text-[10px] font-bold text-[var(--primary)]">
              {{ p.quantidade_processada }}/{{ p.quantidade_total }}
            </span>
          </div>
          <div *ngIf="p.quantidade_total" class="w-full h-1.5 bg-[var(--surface-container)] rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700"
              [ngClass]="{
                'bg-emerald-500': p.status === 'concluido',
                'bg-amber-400': p.status === 'processando',
                'bg-red-500': p.status === 'erro'
              }"
              [style.width.%]="getPercent(p)"></div>
          </div>
        </div>

        <!-- Estado processing global -->
        <div *ngIf="isProcessing" class="rounded-xl p-3 bg-amber-500/10 border border-amber-400/30 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <span class="material-symbols-outlined !text-[16px] animate-pulse">bolt</span>
          Processando com IA • Atualização em tempo real
        </div>
        <div *ngIf="legislacao.status === 'concluida'" class="rounded-xl p-3 bg-emerald-500/10 border border-emerald-400/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <span class="material-symbols-outlined !text-[16px]">check_circle</span>
          Processamento completo!
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- ABA SWITCHER: Artigos / Análise / Cronograma / Concurso      -->
      <!-- ============================================================ -->
      <div *ngIf="!loading && legislacao" class="mb-4">
        <div class="inline-flex flex-wrap bg-[var(--surface-container-low)] rounded-2xl p-1 gap-1">
          <button (click)="abaAtiva = 'artigos'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            [ngClass]="abaAtiva === 'artigos'
              ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">article</span>
              Artigos
            </span>
          </button>
          <button (click)="abaAtiva = 'analise'; carregarAnaliseEstrategica()"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            [ngClass]="abaAtiva === 'analise'
              ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">psychology</span>
              Análise Estratégica
              <span *ngIf="analiseEstrategica?.status === 'concluido'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </span>
          </button>
          <button (click)="abaAtiva = 'cronograma'; carregarPlano()"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            [ngClass]="abaAtiva === 'cronograma'
              ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">calendar_month</span>
              Cronograma
              <span *ngIf="plano?.status === 'concluido'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </span>
          </button>
          <button (click)="abaAtiva = 'concurso'; carregarMaterialConcurso()"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            [ngClass]="abaAtiva === 'concurso'
              ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">quiz</span>
              Questões & Flashcards
              <span *ngIf="materialConcurso?.status === 'concluido'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </span>
          </button>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- ABA: ANÁLISE ESTRATÉGICA (AGENTE 3)                          -->
      <!-- ============================================================ -->
      <div *ngIf="abaAtiva === 'analise'" class="flex flex-col gap-4">

        <!-- Estado: Sem análise ainda -->
        <div *ngIf="!loadingAnaliseEstrategica && !gerandoAnaliseEstrategica && (!analiseEstrategica || analiseEstrategica?.status === 'pendente')" class="neo-raised rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-[var(--card-bg)]">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5d3bf6]/20 to-[#7c3aed]/20 flex items-center justify-center">
            <span class="material-symbols-outlined !text-[34px] text-[var(--primary)]">psychology</span>
          </div>
          <div>
            <p class="text-sm font-black text-[var(--on-surface)]">Análise Estratégica de Concursos</p>
            <p class="text-xs text-[var(--on-surface-variant)] mt-1 max-w-md">
              Solicite ao Agente 3 para analisar toda a legislação com o olhar de banca examinadora. Ele classificará os artigos por relevância (Alta, Média, Baixa), identificará pegadinhas clássicas, comparações críticas e definirá as metas de questões e flashcards.
            </p>
          </div>
          <button (click)="confirmarGerarAnaliseEstrategica()"
            [disabled]="legislacao?.status !== 'concluida' || gerandoAnaliseEstrategica"
            class="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white shadow-md shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined !text-[18px]">auto_awesome</span>
            <span>Gerar Análise Estratégica (Agente 3)</span>
          </button>
          <p *ngIf="legislacao?.status !== 'concluida'" class="text-xs text-amber-500 flex items-center gap-1">
            <span class="material-symbols-outlined !text-[14px]">info</span>
            Aguarde o processamento completo dos artigos antes de solicitar a análise.
          </p>
        </div>

        <!-- Estado: Carregando -->
        <div *ngIf="loadingAnaliseEstrategica && !gerandoAnaliseEstrategica" class="neo-raised rounded-3xl p-10 flex flex-col items-center gap-3 bg-[var(--card-bg)]">
          <span class="material-symbols-outlined !text-[40px] text-[var(--primary)] animate-pulse">psychology</span>
          <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Carregando análise estratégica...</p>
        </div>

        <!-- Estado: Gerando com IA / Processando -->
        <div *ngIf="gerandoAnaliseEstrategica || (!loadingAnaliseEstrategica && analiseEstrategica?.status === 'processando')" class="neo-raised rounded-3xl p-10 flex flex-col items-center gap-4 bg-[var(--card-bg)]">
          <div class="relative">
            <span class="material-symbols-outlined !text-[48px] text-[var(--primary)] animate-spin" style="animation-duration: 3s">sync</span>
            <span class="material-symbols-outlined !text-[24px] text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">auto_awesome</span>
          </div>
          <div class="text-center">
            <p class="text-sm font-black text-[var(--on-surface)]">Agente 3 está analisando a legislação...</p>
            <p class="text-xs text-[var(--on-surface-variant)] mt-1 max-w-sm">Mapeando peso para concursos, pegadinhas de bancas, riscos de confusão e calculando metas de questões. Isso pode levar até 45 segundos.</p>
          </div>
        </div>

        <!-- Estado: Erro -->
        <div *ngIf="!loadingAnaliseEstrategica && !gerandoAnaliseEstrategica && analiseEstrategica?.status === 'erro'" class="neo-raised rounded-2xl p-6 bg-[var(--card-bg)] flex flex-col gap-3">
          <div class="rounded-xl p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 flex items-start gap-3">
            <span class="material-symbols-outlined !text-[20px] text-[var(--error)] mt-0.5">error</span>
            <div>
              <p class="text-sm font-bold text-[var(--error)]">Falha ao gerar a análise estratégica</p>
              <p class="text-xs text-[var(--on-surface-variant)] mt-1">{{ analiseEstrategica?.erro || 'Ocorreu um erro inesperado.' }}</p>
            </div>
          </div>
          <button (click)="confirmarGerarAnaliseEstrategica()" class="self-start px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 transition-all flex items-center gap-2">
            <span class="material-symbols-outlined !text-[15px]">refresh</span>
            Tentar novamente
          </button>
        </div>

        <!-- Estado: Concluído -->
        <div *ngIf="!loadingAnaliseEstrategica && !gerandoAnaliseEstrategica && analiseEstrategica?.status === 'concluido'" class="flex flex-col gap-4">
          <!-- Header com botão Regenerar -->
          <div class="neo-raised rounded-2xl p-4 bg-[var(--card-bg)] flex items-center justify-between gap-3">
            <div>
              <p class="text-xs text-[var(--on-surface-variant)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined !text-[14px] text-[var(--primary)]">auto_awesome</span>
                Análise Estratégica gerada pelo Agente 3
              </p>
              <p class="text-sm font-black text-[var(--on-surface)] mt-0.5">Diretrizes de Prova, Riscos & Metas de Treinamento</p>
            </div>
            <button (click)="confirmarGerarAnaliseEstrategica()" [disabled]="gerandoAnaliseEstrategica" class="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold border border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined !text-[14px]">refresh</span>
              Regenerar Análise
            </button>
          </div>

          <!-- Cards de Resumo / Meta Global -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-1 border-l-4 border-indigo-500">
              <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Meta Global Questões</span>
              <span class="text-2xl font-black text-indigo-600 dark:text-indigo-400">{{ analiseEstrategica?.meta_global?.meta_questoes_total || 0 }}</span>
              <span class="text-[10px] text-[var(--on-surface-variant)]">questões sugeridas</span>
            </div>

            <div class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-1 border-l-4 border-purple-500">
              <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Meta Global Flashcards</span>
              <span class="text-2xl font-black text-purple-600 dark:text-purple-400">{{ analiseEstrategica?.meta_global?.meta_flashcards_total || 0 }}</span>
              <span class="text-[10px] text-[var(--on-surface-variant)]">cards de memorização</span>
            </div>

            <div class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-1 border-l-4 border-red-500">
              <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Prioridade Alta</span>
              <span class="text-2xl font-black text-red-500">{{ totalArtigosAltaPrioridade }}</span>
              <span class="text-[10px] text-[var(--on-surface-variant)]">artigos de altíssimo foco</span>
            </div>

            <div class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-1 border-l-4 border-amber-500">
              <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Prioridade Média</span>
              <span class="text-2xl font-black text-amber-500">{{ totalArtigosMediaPrioridade }}</span>
              <span class="text-[10px] text-[var(--on-surface-variant)]">artigos de suporte</span>
            </div>
          </div>

          <!-- Comparações Recomendadas (Agente 3) -->
          <div *ngIf="analiseEstrategica?.comparacoes_recomendadas?.length" class="flex flex-col gap-3">
            <h3 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px] text-indigo-500">compare</span>
              Comparações Recomendadas entre Artigos
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div *ngFor="let comp of analiseEstrategica?.comparacoes_recomendadas"
                class="neo-raised rounded-2xl p-4 bg-[var(--card-bg)] flex flex-col gap-2 border-l-4 border-indigo-400">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex flex-wrap gap-1.5">
                    <span *ngFor="let artNum of comp.artigos" class="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Art. {{ artNum }}
                    </span>
                  </div>
                  <span *ngIf="comp.tipo_questao" class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                    {{ comp.tipo_questao }}
                  </span>
                </div>
                <p class="text-xs font-bold text-[var(--on-surface)] leading-snug">{{ comp.motivo }}</p>
                <p class="text-xs text-[var(--on-surface-variant)] bg-[var(--surface-container-low)] p-2.5 rounded-xl border border-[var(--outline-variant)]/30">
                  <strong class="text-[var(--primary)] font-semibold">Foco da Banca:</strong> {{ comp.foco }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tabela / Lista de Artigos Analisados -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h3 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined !text-[15px] text-[var(--primary)]">analytics</span>
                Artigos & Metas de Treinamento
              </h3>

              <!-- Filtros -->
              <div class="flex items-center gap-2 flex-wrap">
                <div class="relative">
                  <input type="text"
                    [(ngModel)]="buscaArtigoAnalise"
                    placeholder="Buscar artigo..."
                    class="text-xs px-3 py-1.5 pl-8 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] placeholder-[var(--on-surface-variant)]/50 focus:outline-none focus:border-[var(--primary)]" />
                  <span class="material-symbols-outlined !text-[15px] text-[var(--on-surface-variant)]/60 absolute left-2.5 top-2">search</span>
                </div>

                <div class="inline-flex bg-[var(--surface-container-low)] p-0.5 rounded-xl border border-[var(--outline-variant)]/30 text-xs">
                  <button (click)="filtroPrioridadeAnalise = 'todas'" class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer" [ngClass]="filtroPrioridadeAnalise === 'todas' ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm' : 'text-[var(--on-surface-variant)]'">Todas</button>
                  <button (click)="filtroPrioridadeAnalise = 'alta'" class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer" [ngClass]="filtroPrioridadeAnalise === 'alta' ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'text-[var(--on-surface-variant)]'">Alta</button>
                  <button (click)="filtroPrioridadeAnalise = 'media'" class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer" [ngClass]="filtroPrioridadeAnalise === 'media' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'text-[var(--on-surface-variant)]'">Média</button>
                  <button (click)="filtroPrioridadeAnalise = 'baixa'" class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer" [ngClass]="filtroPrioridadeAnalise === 'baixa' ? 'bg-slate-500/15 text-slate-500' : 'text-[var(--on-surface-variant)]'">Baixa</button>
                </div>
              </div>
            </div>

            <!-- Lista de Cards Estratégicos por Artigo -->
            <div class="flex flex-col gap-3">
              <div *ngFor="let item of artigosAnaliseFiltrados"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-3 transition-all hover:border-[var(--primary)]/30">
                
                <!-- Linha 1: Cabeçalho do artigo e Badges -->
                <div class="flex items-start justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="px-3 py-1 rounded-xl text-xs font-black bg-[var(--surface-container)] text-[var(--on-surface)] border border-[var(--outline-variant)]/40">
                      Art. {{ item.artigo_numero }}
                    </span>
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      [ngClass]="getPrioridadeClass(item.prioridade)">
                      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="item.prioridade === 'alta' ? 'bg-red-500' : item.prioridade === 'media' ? 'bg-amber-500' : 'bg-slate-400'"></span>
                      Prioridade {{ item.prioridade | titlecase }}
                    </span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border border-[var(--outline-variant)]/30">
                      Potencial: {{ item.potencial_cobranca | titlecase }}
                    </span>
                  </div>

                  <!-- Metas do Artigo -->
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <span class="material-symbols-outlined !text-[12px]">quiz</span>
                      Meta: {{ item.meta_questoes?.recomendado || item.meta_questoes?.minimo || 2 }} questões
                    </span>
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                      <span class="material-symbols-outlined !text-[12px]">style</span>
                      Meta: {{ item.meta_flashcards?.recomendado || item.meta_flashcards?.minimo || 1 }} cards
                    </span>
                    <button (click)="irParaArtigo(item.artigo_numero || '')"
                      title="Ver comentários e texto integral"
                      class="px-3 py-1 rounded-lg text-xs font-bold bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] transition-all flex items-center gap-1 cursor-pointer">
                      <span>Estudar</span>
                      <span class="material-symbols-outlined !text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                <!-- Linha 2: Justificativa Estratégica -->
                <p class="text-xs text-[var(--on-surface)] leading-relaxed">
                  {{ item.justificativa }}
                </p>

                <!-- Linha 3: Riscos de Erro / Pegadinhas e Formas de Cobrança -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--outline-variant)]/30 text-xs">
                  <div *ngIf="item.riscos_de_erro?.length" class="flex flex-col gap-1.5">
                    <span class="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span class="material-symbols-outlined !text-[13px]">warning</span>
                      Riscos de Erro / Pegadinhas
                    </span>
                    <div class="flex flex-wrap gap-1">
                      <span *ngFor="let risco of item.riscos_de_erro"
                        class="px-2 py-1 rounded-md text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 leading-tight">
                        {{ risco }}
                      </span>
                    </div>
                  </div>

                  <div *ngIf="item.formas_de_cobranca?.length" class="flex flex-col gap-1.5">
                    <span class="text-[10px] font-black uppercase tracking-wider text-[var(--primary)] flex items-center gap-1">
                      <span class="material-symbols-outlined !text-[13px]">psychology</span>
                      Como as Bancas Costumam Cobrar
                    </span>
                    <div class="flex flex-wrap gap-1">
                      <span *ngFor="let forma of item.formas_de_cobranca"
                        class="px-2 py-1 rounded-md text-[11px] bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 leading-tight">
                        {{ forma }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Tipos recomendados -->
                <div *ngIf="item.tipos_recomendados?.length" class="flex items-center gap-2 pt-1 text-[10px] text-[var(--on-surface-variant)]">
                  <span class="font-bold uppercase tracking-wider">Formatos ideais:</span>
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let tipo of item.tipos_recomendados" class="px-2 py-0.5 rounded-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 font-semibold">
                      {{ tipo }}
                    </span>
                  </div>
                </div>

              </div>

              <p *ngIf="artigosAnaliseFiltrados.length === 0" class="text-xs text-center text-[var(--on-surface-variant)] py-6 neo-raised rounded-2xl bg-[var(--card-bg)]">
                Nenhum artigo encontrado com os filtros selecionados.
              </p>
            </div>

          </div>

        </div>

      </div>

      <!-- ============================================================ -->
      <!-- ABA: CRONOGRAMA                                              -->
      <!-- ============================================================ -->
      <div *ngIf="abaAtiva === 'cronograma'" class="flex flex-col gap-4">

        <!-- Modal de Preferências -->
        <div *ngIf="modalPreferencias" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div class="w-full max-w-lg neo-raised rounded-3xl p-6 bg-[var(--card-bg)] flex flex-col gap-5 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-black text-[var(--on-surface)] flex items-center gap-2">
                <span class="material-symbols-outlined !text-[20px] text-[var(--primary)]">tune</span>
                Preferências de Estudo
              </h2>
              <button (click)="modalPreferencias = false" class="text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]">
                <span class="material-symbols-outlined !text-[20px]">close</span>
              </button>
            </div>
            <p class="text-xs text-[var(--on-surface-variant)]">Todos os campos são opcionais. O agente utilizará valores padrão quando não informados.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Data de início -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Data de Início</label>
                <input type="date" [(ngModel)]="preferencias.data_inicio"
                  class="px-3 py-2 rounded-xl text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <!-- Data da prova -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Data da Prova</label>
                <input type="date" [(ngModel)]="preferencias.data_prova"
                  class="px-3 py-2 rounded-xl text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <!-- Minutos por dia -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Minutos por Dia <span class="opacity-50 normal-case">(padrão: 60)</span></label>
                <input type="number" [(ngModel)]="preferencias.tempo_diario_minutos" min="15" max="480" placeholder="60"
                  class="px-3 py-2 rounded-xl text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <!-- Nível -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Nível de Conhecimento</label>
                <select [(ngModel)]="preferencias.nivel_estudante"
                  class="px-3 py-2 rounded-xl text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]">
                  <option value="">Não informado</option>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
            </div>

            <!-- Dias da semana -->
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Dias Disponíveis <span class="opacity-50 normal-case">(padrão: Seg–Sex)</span></label>
              <div class="flex flex-wrap gap-2">
                <button *ngFor="let d of diasSemana; let i = index"
                  type="button"
                  (click)="toggleDia(i)"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                  [ngClass]="isDiaSelecionado(i)
                    ? 'bg-[var(--primary)] text-white border-transparent'
                    : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container)]'">
                  {{ d }}
                </button>
              </div>
            </div>

            <!-- Objetivo -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Objetivo</label>
              <input type="text" [(ngModel)]="preferencias.objetivo" placeholder="Ex: Aprovação no concurso do TRT"
                class="px-3 py-2 rounded-xl text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]" />
            </div>

            <div class="flex gap-3 pt-2">
              <button (click)="modalPreferencias = false"
                class="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all">
                Cancelar
              </button>
              <button (click)="confirmarGerarPlano()"
                [disabled]="gerandoPlano"
                class="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white shadow-md shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <span *ngIf="gerandoPlano" class="material-symbols-outlined !text-[16px] animate-spin">sync</span>
                {{ gerandoPlano ? 'Gerando...' : 'Gerar Cronograma' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Estado: Sem plano ainda -->
        <div *ngIf="!loadingPlano && !plano" class="neo-raised rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-[var(--card-bg)]">
          <div class="w-16 h-16 rounded-2xl bg-[var(--primary)]/15 flex items-center justify-center">
            <span class="material-symbols-outlined !text-[32px] text-[var(--primary)]">calendar_month</span>
          </div>
          <div>
            <p class="text-sm font-black text-[var(--on-surface)]">Nenhum cronograma gerado</p>
            <p class="text-xs text-[var(--on-surface-variant)] mt-1 max-w-sm">
              Clique em "Gerar Cronograma" para que o Agente 3 crie um plano de estudos personalizado com blocos temáticos, sessões diárias e revisões espaçadas.
            </p>
          </div>
          <button (click)="abrirModalPreferencias()"
            [disabled]="legislacao?.status !== 'concluida'"
            class="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white shadow-md shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center gap-2">
            <span class="material-symbols-outlined !text-[18px]">auto_awesome</span>
            Gerar Cronograma
          </button>
          <p *ngIf="legislacao?.status !== 'concluida'" class="text-xs text-amber-500">
            Aguarde o processamento completo da legislação antes de gerar o cronograma.
          </p>
        </div>

        <!-- Estado: Carregando plano -->
        <div *ngIf="loadingPlano" class="neo-raised rounded-3xl p-10 flex flex-col items-center gap-3 bg-[var(--card-bg)]">
          <span class="material-symbols-outlined !text-[40px] text-[var(--primary)] animate-pulse">psychology</span>
          <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Carregando cronograma...</p>
        </div>

        <!-- Estado: Gerando plano (pode levar 15-60s) -->
        <div *ngIf="gerandoPlano && !modalPreferencias" class="neo-raised rounded-3xl p-10 flex flex-col items-center gap-4 bg-[var(--card-bg)]">
          <div class="relative">
            <span class="material-symbols-outlined !text-[48px] text-[var(--primary)] animate-spin" style="animation-duration: 3s">sync</span>
            <span class="material-symbols-outlined !text-[24px] text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">auto_awesome</span>
          </div>
          <div class="text-center">
            <p class="text-sm font-black text-[var(--on-surface)]">Agente 3 está trabalhando...</p>
            <p class="text-xs text-[var(--on-surface-variant)] mt-1">Analisando artigos, priorizando conteúdo e montando o cronograma. Isso pode levar até 60 segundos.</p>
          </div>
        </div>

        <!-- Estado: Erro -->
        <div *ngIf="!loadingPlano && plano?.status === 'erro'" class="neo-raised rounded-2xl p-6 bg-[var(--card-bg)] flex flex-col gap-3">
          <div class="rounded-xl p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 flex items-start gap-3">
            <span class="material-symbols-outlined !text-[20px] text-[var(--error)] mt-0.5">error</span>
            <div>
              <p class="text-sm font-bold text-[var(--error)]">Falha ao gerar o cronograma</p>
              <p class="text-xs text-[var(--on-surface-variant)] mt-1">{{ plano?.erro }}</p>
            </div>
          </div>
          <button (click)="abrirModalPreferencias()" class="self-start px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 transition-all flex items-center gap-2">
            <span class="material-symbols-outlined !text-[15px]">refresh</span>
            Tentar novamente
          </button>
        </div>

        <!-- Estado: Plano concluído -->
        <div *ngIf="!loadingPlano && plano?.status === 'concluido'" class="flex flex-col gap-4">

          <!-- Header do plano com botão Regenerar -->
          <div class="neo-raised rounded-2xl p-4 bg-[var(--card-bg)] flex items-center justify-between gap-3">
            <div>
              <p class="text-xs text-[var(--on-surface-variant)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined !text-[14px] text-[var(--primary)]">auto_awesome</span>
                Cronograma gerado pelo Agente 3
              </p>
              <p class="text-sm font-black text-[var(--on-surface)] mt-0.5">{{ plano?.plano_estudo?.objetivo }}</p>
            </div>
            <button (click)="abrirModalPreferencias()" class="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold border border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[14px]">refresh</span>
              Regenerar
            </button>
          </div>

          <!-- Alertas -->
          <div *ngIf="plano?.alertas?.length" class="flex flex-col gap-2">
            <div *ngFor="let alerta of plano?.alertas"
              class="rounded-xl p-3 bg-amber-500/10 border border-amber-400/30 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
              <span class="material-symbols-outlined !text-[16px] flex-shrink-0 mt-0.5">warning</span>
              {{ alerta }}
            </div>
          </div>

          <!-- Cards de Resumo com Progresso em Tempo Real -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-1 border-l-4 border-emerald-500">
              <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)] flex items-center justify-between">
                <span>Artigos Lidos</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ progressoLeituraPercent }}%</span>
              </span>
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">{{ totalArtigosLidos }} <span class="text-xs font-normal text-[var(--on-surface-variant)]">/ {{ plano?.resumo?.total_artigos || artigos.length }}</span></span>
              <div class="w-full h-1.5 bg-[var(--surface-container)] rounded-full overflow-hidden mt-1">
                <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width.%]="progressoLeituraPercent"></div>
              </div>
            </div>

            <div class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-1 border-l-4 border-amber-500">
              <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)] flex items-center justify-between">
                <span>Sessões</span>
                <span class="text-amber-600 dark:text-amber-400 font-bold">{{ progressoSessoesPercent }}%</span>
              </span>
              <span class="text-2xl font-black text-amber-500">{{ totalSessoesConcluidas }} <span class="text-xs font-normal text-[var(--on-surface-variant)]">/ {{ plano?.resumo?.total_sessoes || 0 }}</span></span>
              <div class="w-full h-1.5 bg-[var(--surface-container)] rounded-full overflow-hidden mt-1">
                <div class="h-full bg-amber-500 rounded-full transition-all duration-500" [style.width.%]="progressoSessoesPercent"></div>
              </div>
            </div>

            <div class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Blocos Temáticos</span>
              <span class="text-2xl font-black text-[var(--primary)]">{{ plano?.resumo?.total_blocos || 0 }}</span>
              <span class="text-[10px] text-[var(--on-surface-variant)] mt-1">organizados por afinidade</span>
            </div>

            <div class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Tempo Estimado</span>
              <span class="text-xl font-black text-[var(--on-surface)]">{{ formatMinutos(plano?.resumo?.tempo_total_minutos || 0) }}</span>
              <span class="text-[10px] text-[var(--on-surface-variant)] mt-1">{{ plano?.plano_estudo?.tempo_diario_minutos || 60 }}min por dia</span>
            </div>
          </div>


          <!-- Premissas -->
          <div *ngIf="plano?.plano_estudo?.premissas?.length" class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-2">
            <p class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)] flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[13px]">info</span>
              Premissas adotadas pelo Agente
            </p>
            <ul class="flex flex-col gap-1">
              <li *ngFor="let p of plano?.plano_estudo?.premissas" class="text-xs text-[var(--on-surface-variant)] flex items-start gap-2">
                <span class="text-[var(--primary)] mt-0.5">•</span> {{ p }}
              </li>
            </ul>
          </div>

          <!-- Blocos Temáticos -->
          <div class="flex flex-col gap-3">
            <h3 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px] text-[var(--primary)]">layers</span>
              Blocos Temáticos
            </h3>

            <div *ngFor="let bloco of plano?.blocos" class="neo-raised rounded-2xl overflow-hidden bg-[var(--card-bg)]">
              <!-- Cabeçalho do bloco -->
              <div class="p-4 flex items-start justify-between gap-3 cursor-pointer"
                (click)="toggleBloco(bloco.id)">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black text-white"
                    [ngClass]="getPrioridadeBg(bloco.prioridade)">
                    {{ bloco.ordem }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-black text-[var(--on-surface)] leading-snug">{{ bloco.titulo }}</p>
                    <p class="text-xs text-[var(--on-surface-variant)] mt-0.5">{{ bloco.assunto }}</p>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        [ngClass]="getPrioridadeClass(bloco.prioridade)">
                        {{ bloco.prioridade | titlecase }}
                      </span>
                      <span *ngIf="isBlocoConcluido(bloco)"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <span class="material-symbols-outlined !text-[12px]">check</span>
                        Bloco Concluído
                      </span>
                      <span class="text-[10px] font-bold"
                        [ngClass]="isBlocoConcluido(bloco) ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--on-surface-variant)]'">
                        {{ getArtigosLidosDoBloco(bloco) }}/{{ bloco.quantidade_artigos }} lidos ({{ getBlocoProgressoPercent(bloco) }}%)
                      </span>
                      <div class="w-20 h-1.5 bg-[var(--surface-container)] rounded-full overflow-hidden hidden sm:block">
                        <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width.%]="getBlocoProgressoPercent(bloco)"></div>
                      </div>
                      <span class="text-[10px] text-[var(--on-surface-variant)]">≈ {{ bloco.tempo_estimado_minutos }}min</span>
                    </div>
                  </div>
                </div>
                <span class="material-symbols-outlined !text-[20px] text-[var(--on-surface-variant)] transition-transform duration-200 flex-shrink-0"
                  [class.rotate-180]="blocoExpandido === bloco.id">
                  expand_more
                </span>
              </div>
              <!-- Detalhe do bloco (expandido) -->
              <div *ngIf="blocoExpandido === bloco.id" class="border-t border-[var(--outline-variant)]/30 p-4 flex flex-col gap-3">
                <div class="flex flex-wrap gap-1.5">
                  <button *ngFor="let art of bloco.artigos"
                    type="button"
                    (click)="irParaArtigo(art)"
                    [title]="isArtigoLido(art) ? 'Artigo concluído — clique para estudar' : 'Clique para estudar este artigo'"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border select-none active:scale-95"
                    [ngClass]="isArtigoLido(art)
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 shadow-sm'
                      : 'bg-[var(--primary)]/10 border-transparent text-[var(--primary)] hover:bg-[var(--primary)]/20'">
                    <span *ngIf="isArtigoLido(art)" class="material-symbols-outlined !text-[12px] text-emerald-500">check</span>
                    <span>Art. {{ art }}</span>
                    <span *ngIf="getDesempenhoArtigo(art) as perf"
                      class="px-1.5 py-0.2 rounded text-[9px] font-black"
                      [ngClass]="perf.percentual === null
                        ? 'bg-[var(--on-surface-variant)]/15 text-[var(--on-surface-variant)]'
                        : (perf.percentual >= 70 ? 'bg-emerald-500 text-white' : (perf.percentual >= 50 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'))"
                      [title]="perf.percentual !== null ? (perf.acertos + '/' + perf.respondidas + ' acertos (' + perf.percentual + '%)') : (perf.total + ' questões disponíveis')">
                      {{ perf.percentual !== null ? perf.percentual + '%' : perf.total + 'Q' }}
                    </span>
                  </button>
                </div>
                <p class="text-xs text-[var(--on-surface-variant)] leading-relaxed italic border-l-2 border-[var(--primary)]/30 pl-3">{{ bloco.justificativa }}</p>
              </div>
            </div>

          </div>

          <!-- Sessões agrupadas por data -->
          <div class="flex flex-col gap-3">
            <h3 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px] text-amber-500">event</span>
              Sessões de Estudo
            </h3>

            <ng-container *ngFor="let grupo of sessoesPorData">
              <div class="neo-raised rounded-2xl p-4 bg-[var(--card-bg)] flex flex-col gap-3">
                <!-- Data -->
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-black uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full">{{ formatDataSessao(grupo.data) }}</span>
                  <span class="text-[10px] text-[var(--on-surface-variant)]">{{ getTotalMinutosDia(grupo.sessoes) }}min</span>
                </div>
                <!-- Sessões do dia -->
                <div class="flex flex-col gap-2">
                  <div *ngFor="let sessao of grupo.sessoes"
                    class="flex items-start gap-3 p-3 rounded-xl border transition-all"
                    [ngClass]="isSessaoConcluida(sessao)
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : getTipoSessaoClass(sessao.tipo)">
                    <span class="material-symbols-outlined !text-[18px] flex-shrink-0 mt-0.5"
                      [ngClass]="isSessaoConcluida(sessao) ? 'text-emerald-500' : getTipoSessaoIconColor(sessao.tipo)">
                      {{ isSessaoConcluida(sessao) ? 'task_alt' : getTipoSessaoIcon(sessao.tipo) }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-2 flex-wrap">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-[var(--on-surface)]">{{ getTipoSessaoLabel(sessao.tipo) }}</span>
                          <span *ngIf="isSessaoConcluida(sessao)"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span class="material-symbols-outlined !text-[11px]">check</span>
                            Sessão Concluída
                          </span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span *ngIf="getArtigosLidosDaSessao(sessao) > 0"
                            class="text-[10px] font-bold"
                            [ngClass]="isSessaoConcluida(sessao) ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--on-surface-variant)]'">
                            {{ getArtigosLidosDaSessao(sessao) }}/{{ sessao.artigos.length }} lidos
                          </span>
                          <span class="text-[10px] font-bold text-[var(--on-surface-variant)]">{{ sessao.tempo_minutos }}min</span>
                        </div>
                      </div>
                      <p class="text-xs text-[var(--on-surface-variant)] mt-0.5">{{ sessao.objetivo }}</p>
                      <div class="flex flex-wrap gap-1 mt-1.5">
                        <button *ngFor="let art of sessao.artigos"
                          type="button"
                          (click)="irParaArtigo(art)"
                          [title]="isArtigoLido(art) ? 'Artigo concluído — clique para estudar' : 'Clique para estudar este artigo'"
                          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all border select-none active:scale-95"
                          [ngClass]="isArtigoLido(art)
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/25'
                            : 'bg-[var(--surface-container)] border-transparent text-[var(--on-surface-variant)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'">
                          <span *ngIf="isArtigoLido(art)" class="material-symbols-outlined !text-[11px] text-emerald-500">check</span>
                          <span>Art. {{ art }}</span>
                          <span *ngIf="getDesempenhoArtigo(art) as perf"
                            class="px-1 py-0.2 rounded text-[8px] font-black"
                            [ngClass]="perf.percentual === null
                              ? 'bg-[var(--on-surface-variant)]/15 text-[var(--on-surface-variant)]'
                              : (perf.percentual >= 70 ? 'bg-emerald-500 text-white' : (perf.percentual >= 50 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'))"
                            [title]="perf.percentual !== null ? (perf.acertos + '/' + perf.respondidas + ' acertos (' + perf.percentual + '%)') : (perf.total + ' questões disponíveis')">
                            {{ perf.percentual !== null ? perf.percentual + '%' : perf.total + 'Q' }}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </ng-container>
          </div>

          <!-- Revisões -->
          <div *ngIf="plano?.revisoes?.length" class="flex flex-col gap-3">
            <h3 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px] text-purple-500">replay</span>
              Revisões Espaçadas
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div *ngFor="let rev of plano?.revisoes"
                class="neo-raised rounded-xl p-3 bg-[var(--card-bg)] flex items-start gap-3">
                <span class="material-symbols-outlined !text-[18px] text-purple-500 flex-shrink-0">replay</span>
                <div class="min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">{{ getTipoSessaoLabel(rev.tipo) }}</span>
                    <span class="text-[10px] text-[var(--on-surface-variant)]">{{ formatDataSessao(rev.data) }}</span>
                  </div>
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    <span *ngFor="let art of rev.artigos"
                      class="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--surface-container)] text-[var(--on-surface-variant)]">
                      Art. {{ art }}
                    </span>
                  </div>
                  <p class="text-[10px] text-[var(--on-surface-variant)] mt-1">{{ rev.tempo_minutos }}min</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <!-- FIM ABA CRONOGRAMA -->

      <!-- ============================================================ -->
      <!-- ABA: MATERIAL DE CONCURSO (Agente 4)                        -->
      <!-- ============================================================ -->
      <div *ngIf="abaAtiva === 'concurso'" class="flex flex-col gap-5">

        <!-- Modal de Parâmetros de Geração do Concurso -->
        <div *ngIf="modalConcursoOpcoes" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div class="w-full max-w-lg neo-raised rounded-3xl p-6 bg-[var(--card-bg)] flex flex-col gap-5 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-black text-[var(--on-surface)] flex items-center gap-2">
                <span class="material-symbols-outlined !text-[20px] text-[var(--primary)]">auto_awesome</span>
                <span>{{ opcoesConcurso.modo === 'adicionar' ? 'Gerar Mais Questões & Flashcards' : 'Gerar Material de Concursos (Agente 5)' }}</span>
              </h2>
              <button (click)="modalConcursoOpcoes = false" class="text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] cursor-pointer">
                <span class="material-symbols-outlined !text-[20px]">close</span>
              </button>
            </div>
            <p class="text-xs text-[var(--on-surface-variant)]">
              {{ opcoesConcurso.modo === 'adicionar' 
                ? 'O Agente gerará uma nova rodada de questões e flashcards complementares, somando-os ao banco atual sem apagar os já existentes.' 
                : 'O Agente analisará os artigos e comentários para gerar questões comentadas, flashcards, pegadinhas de banca e mnemônicos.' }}
            </p>

            <div class="flex flex-col gap-4">
              <!-- Seletor de Modo se já houver material existente -->
              <div *ngIf="materialConcurso?.questoes?.length" class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Modo de Geração</label>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" (click)="opcoesConcurso.modo = 'adicionar'"
                    class="p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer"
                    [ngClass]="opcoesConcurso.modo === 'adicionar' 
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                      : 'border-[var(--outline-variant)]/40 bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]'">
                    <span class="text-xs font-bold flex items-center gap-1.5">
                      <span class="material-symbols-outlined !text-[16px]">add_circle</span>
                      Adicionar novos
                    </span>
                    <span class="text-[10px] opacity-80">Mantém as {{ materialConcurso?.questoes?.length || 0 }} questões atuais</span>
                  </button>

                  <button type="button" (click)="opcoesConcurso.modo = 'substituir'"
                    class="p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer"
                    [ngClass]="opcoesConcurso.modo === 'substituir' 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                      : 'border-[var(--outline-variant)]/40 bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]'">
                    <span class="text-xs font-bold flex items-center gap-1.5">
                      <span class="material-symbols-outlined !text-[16px]">refresh</span>
                      Substituir tudo
                    </span>
                    <span class="text-[10px] opacity-80">Recria o banco do zero</span>
                  </button>
                </div>
              </div>

              <!-- Banca examinadora -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Banca Examinadora de Referência</label>
                <select [(ngModel)]="opcoesConcurso.banca"
                  class="px-3 py-2.5 rounded-xl text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]">
                  <option *ngFor="let b of bancasDisponiveis" [value]="b">{{ b }}</option>
                </select>
              </div>

              <div class="p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 text-xs text-[var(--on-surface-variant)] flex items-start gap-2.5">
                <span class="material-symbols-outlined !text-[18px] text-[var(--primary)] mt-0.5">info</span>
                <span>
                  O material será gerado considerando todos os artigos da legislação, os comentários e a análise estratégica já feita pelo nosso agente.
                </span>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button (click)="modalConcursoOpcoes = false"
                class="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all cursor-pointer">
                Cancelar
              </button>
              <button (click)="confirmarGerarMaterialConcurso()"
                [disabled]="gerandoMaterialConcurso"
                class="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white shadow-md shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                <span *ngIf="gerandoMaterialConcurso" class="material-symbols-outlined !text-[16px] animate-spin">sync</span>
                {{ gerandoMaterialConcurso ? 'Gerando...' : (opcoesConcurso.modo === 'adicionar' ? 'Adicionar Questões' : 'Gerar Material') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Estado 1: Nenhum material gerado ainda -->
        <div *ngIf="!loadingMaterialConcurso && !materialConcurso && !gerandoMaterialConcurso"
          class="neo-raised rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-5 bg-[var(--card-bg)]">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
            <span class="material-symbols-outlined !text-[32px]">quiz</span>
          </div>
          <div class="max-w-md">
            <h3 class="text-base font-black text-[var(--on-surface)]">Material de Concursos não gerado</h3>
            <p class="text-xs text-[var(--on-surface-variant)] mt-1.5 leading-relaxed">
              O <strong>Agente 4 — Especialista em Concursos</strong> transforma os artigos comentados em um pacote completo de estudo para provas com questões comentadas, flashcards interativos, pegadinhas de banca e mnemônicos.
            </p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg text-left">
            <div class="p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col gap-1">
              <span class="material-symbols-outlined !text-[18px] text-[var(--primary)]">quiz</span>
              <span class="text-[11px] font-bold text-[var(--on-surface)]">Questões</span>
              <span class="text-[10px] text-[var(--on-surface-variant)]">Comentadas item por item</span>
            </div>
            <div class="p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col gap-1">
              <span class="material-symbols-outlined !text-[18px] text-purple-500">style</span>
              <span class="text-[11px] font-bold text-[var(--on-surface)]">Flashcards</span>
              <span class="text-[10px] text-[var(--on-surface-variant)]">Revisão ativa & flip 3D</span>
            </div>
            <div class="p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col gap-1">
              <span class="material-symbols-outlined !text-[18px] text-amber-500">warning</span>
              <span class="text-[11px] font-bold text-[var(--on-surface)]">Pegadinhas</span>
              <span class="text-[10px] text-[var(--on-surface-variant)]">Armadilhas de banca</span>
            </div>
            <div class="p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col gap-1">
              <span class="material-symbols-outlined !text-[18px] text-emerald-500">psychology</span>
              <span class="text-[11px] font-bold text-[var(--on-surface)]">Memorização</span>
              <span class="text-[10px] text-[var(--on-surface-variant)]">Prazos & mnemônicos</span>
            </div>
          </div>

          <button (click)="abrirModalConcursoOpcoes()"
            [disabled]="legislacao?.status !== 'concluida'"
            class="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95">
            <span class="material-symbols-outlined !text-[18px]">auto_awesome</span>
            Gerar Material de Concurso (Agente 4)
          </button>
          <p *ngIf="legislacao?.status !== 'concluida'" class="text-xs text-amber-500 font-semibold">
            Aguarde o processamento completo da legislação antes de gerar o material.
          </p>
        </div>

        <!-- Estado 2: Carregando Material -->
        <div *ngIf="loadingMaterialConcurso" class="neo-raised rounded-3xl p-10 flex flex-col items-center gap-3 bg-[var(--card-bg)]">
          <span class="material-symbols-outlined !text-[40px] text-[var(--primary)] animate-pulse">quiz</span>
          <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Carregando material de concurso...</p>
        </div>

        <!-- Estado 3: Gerando Material (Agente 4 em ação) -->
        <div *ngIf="gerandoMaterialConcurso && !modalConcursoOpcoes" class="neo-raised rounded-3xl p-10 flex flex-col items-center gap-4 bg-[var(--card-bg)]">
          <div class="relative">
            <span class="material-symbols-outlined !text-[48px] text-[var(--primary)] animate-spin" style="animation-duration: 3s">sync</span>
            <span class="material-symbols-outlined !text-[24px] text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">psychology</span>
          </div>
          <div class="text-center max-w-md">
            <p class="text-sm font-black text-[var(--on-surface)]">Agente 4: Especialista em Concursos está trabalhando...</p>
            <p class="text-xs text-[var(--on-surface-variant)] mt-1">
              Criando questões inéditas, flashcards de fixação, mapeando pegadinhas e catalogando prazos e mnemônicos. Isso pode levar até 60 segundos.
            </p>
          </div>
        </div>

        <!-- Estado 4: Erro -->
        <div *ngIf="!loadingMaterialConcurso && materialConcurso?.status === 'erro'" class="neo-raised rounded-2xl p-6 bg-[var(--card-bg)] flex flex-col gap-3">
          <div class="rounded-xl p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 flex items-start gap-3">
            <span class="material-symbols-outlined !text-[20px] text-[var(--error)] mt-0.5">error</span>
            <div>
              <p class="text-sm font-bold text-[var(--error)]">Falha ao gerar o material de concurso</p>
              <p class="text-xs text-[var(--on-surface-variant)] mt-1">{{ materialConcurso?.erro }}</p>
            </div>
          </div>
          <button (click)="abrirModalConcursoOpcoes()" class="self-start px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 transition-all flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined !text-[15px]">refresh</span>
            Tentar novamente
          </button>
        </div>

        <!-- Estado 5: Material Concluído -->
        <div *ngIf="!loadingMaterialConcurso && materialConcurso && (materialConcurso.status === 'concluido' || materialConcurso.questoes?.length)" class="flex flex-col gap-5">

          <!-- Header do Material com Métricas e Botão de Regenerar -->
          <div class="neo-raised rounded-2xl p-4 sm:p-5 bg-[var(--card-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
                <span class="material-symbols-outlined !text-[22px]">school</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-black text-[var(--on-surface)]">Material de Concurso Consolidado</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Pronto para estudo
                  </span>
                </div>
                <p class="text-xs text-[var(--on-surface-variant)]">
                  Banca de referência: <strong class="text-[var(--on-surface)]">{{ materialConcurso.parametros?.banca || 'Geral' }}</strong>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button (click)="abrirModalConcursoOpcoes('adicionar')"
                class="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white hover:opacity-90 shadow-sm shadow-purple-500/25 transition-all flex items-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined !text-[16px]">add_circle</span>
                Gerar Mais Questões & Cards
              </button>

              <button (click)="abrirModalConcursoOpcoes('substituir')"
                class="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 hover:border-amber-500/40 text-[var(--on-surface-variant)] hover:text-amber-600 dark:hover:text-amber-400 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Substituir todo o material e recriar do zero">
                <span class="material-symbols-outlined !text-[16px]">refresh</span>
                Recriar do Zero
              </button>
            </div>
          </div>

          <!-- Sub-abas do Material de Concurso -->
          <div class="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20">
            <button (click)="subAbaConcurso = 'questoes'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="subAbaConcurso === 'questoes'
                ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
              <span class="material-symbols-outlined !text-[16px]">quiz</span>
              <span>Questões</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                {{ materialConcurso.questoes?.length || 0 }}
              </span>
            </button>

            <button (click)="subAbaConcurso = 'flashcards'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="subAbaConcurso === 'flashcards'
                ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
              <span class="material-symbols-outlined !text-[16px]">style</span>
              <span>Flashcards</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                {{ materialConcurso.flashcards?.length || 0 }}
              </span>
            </button>

            <button *ngIf="materialConcurso.pegadinhas?.length" (click)="subAbaConcurso = 'pegadinhas'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="subAbaConcurso === 'pegadinhas'
                ? 'bg-[var(--card-bg)] text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
              <span class="material-symbols-outlined !text-[16px] text-amber-500">warning</span>
              <span>Pegadinhas</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                {{ materialConcurso.pegadinhas?.length }}
              </span>
            </button>

            <button *ngIf="materialConcurso.pontos_de_prova?.length" (click)="subAbaConcurso = 'pontos'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="subAbaConcurso === 'pontos'
                ? 'bg-[var(--card-bg)] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
              <span class="material-symbols-outlined !text-[16px] text-emerald-500">priority_high</span>
              <span>Pontos de Prova</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                {{ materialConcurso.pontos_de_prova?.length }}
              </span>
            </button>

            <button *ngIf="materialConcurso.conceitos_memorizacao?.length" (click)="subAbaConcurso = 'memorizacao'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="subAbaConcurso === 'memorizacao'
                ? 'bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
              <span class="material-symbols-outlined !text-[16px] text-blue-500">psychology</span>
              <span>Memorização</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                {{ materialConcurso.conceitos_memorizacao?.length }}
              </span>
            </button>

            <button *ngIf="materialConcurso.comparacoes?.length" (click)="subAbaConcurso = 'comparacoes'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              [ngClass]="subAbaConcurso === 'comparacoes'
                ? 'bg-[var(--card-bg)] text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
              <span class="material-symbols-outlined !text-[16px] text-violet-500">balance</span>
              <span>Comparações</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-600">
                {{ materialConcurso.comparacoes?.length }}
              </span>
            </button>
          </div>

          <!-- ============================================================ -->
          <!-- SUB-ABA 1: QUESTÕES (SIMULADO INTERATIVO)                    -->
          <!-- ============================================================ -->
          <div *ngIf="subAbaConcurso === 'questoes'" class="flex flex-col gap-4">

            <!-- Topo / Âncora de scroll para paginação -->
            <div id="secao-questoes-topo"></div>

            <!-- Feedback de Geração Recente -->
            <div *ngIf="feedbackGeracao"
              class="neo-raised rounded-2xl p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <span class="material-symbols-outlined !text-[22px]">auto_awesome</span>
                </div>
                <div>
                  <h4 class="font-bold text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">
                    {{ feedbackGeracao.novasQuestoes > 0 ? (feedbackGeracao.novasQuestoes + ' nova(s) questão(ões) gerada(s) com sucesso!') : 'Material de questões atualizado com sucesso!' }}
                  </h4>
                  <p class="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                    Você agora possui <strong>{{ feedbackGeracao.totalQuestoes }} questões</strong> disponíveis para treino nesta legislação.
                  </p>
                </div>
              </div>
              <button (click)="feedbackGeracao = null"
                class="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Fechar aviso">
                <span class="material-symbols-outlined !text-[18px]">close</span>
              </button>
            </div>

            <!-- Painel de Desempenho e Filtros -->
            <div class="neo-raised rounded-2xl p-4 sm:p-5 bg-[var(--card-bg)] flex flex-col gap-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <!-- Estatísticas de Desempenho -->
                <div class="flex items-center gap-4 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-[var(--on-surface-variant)]">Respondidas:</span>
                    <span class="text-xs font-bold text-[var(--on-surface)]">{{ totalQuestoesRespondidas }} de {{ questoesList.length }}</span>
                  </div>
                  <div *ngIf="totalQuestoesRespondidas > 0" class="flex items-center gap-3">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span class="material-symbols-outlined !text-[14px]">check</span>
                      {{ totalQuestoesAcertos }} acertos ({{ percentualAcertos }}%)
                    </span>
                    <span *ngIf="totalQuestoesErros > 0" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                      <span class="material-symbols-outlined !text-[14px]">close</span>
                      {{ totalQuestoesErros }} erros
                    </span>
                  </div>
                </div>

                <!-- Botão Resetar Simulado -->
                <button *ngIf="totalQuestoesRespondidas > 0" (click)="resetarSimulado()"
                  class="text-xs font-semibold text-[var(--on-surface-variant)] hover:text-red-500 flex items-center gap-1 self-start sm:self-auto cursor-pointer transition-colors">
                  <span class="material-symbols-outlined !text-[15px]">restart_alt</span>
                  Zerar Respostas
                </button>
              </div>

              <!-- Filtros de Questões -->
              <div class="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--outline-variant)]/30 text-xs">
                <!-- Filtro Status -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-bold uppercase text-[var(--on-surface-variant)]">Status:</span>
                  <select [(ngModel)]="filtroStatusResolucao" (ngModelChange)="onFiltroQuestaoChange()"
                    class="px-2.5 py-1 rounded-lg text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]">
                    <option value="todas">Todas as questões</option>
                    <option value="pendentes">Pendentes (Não resolvidas)</option>
                    <option value="resolvidas">Já Resolvidas</option>
                    <option value="erros">Apenas com Erro</option>
                  </select>
                </div>

                <!-- Filtro Tipo -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-bold uppercase text-[var(--on-surface-variant)]">Tipo:</span>
                  <select [(ngModel)]="filtroTipoQuestao" (ngModelChange)="onFiltroQuestaoChange()"
                    class="px-2.5 py-1 rounded-lg text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]">
                    <option value="todos">Todos os tipos</option>
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="certo_errado">Certo ou Errado</option>
                  </select>
                </div>

                <!-- Filtro Dificuldade -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-bold uppercase text-[var(--on-surface-variant)]">Dificuldade:</span>
                  <select [(ngModel)]="filtroDificuldadeQuestao" (ngModelChange)="onFiltroQuestaoChange()"
                    class="px-2.5 py-1 rounded-lg text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]">
                    <option value="todos">Todas</option>
                    <option value="facil">Fácil</option>
                    <option value="medio">Média</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>

                <!-- Filtro Artigo -->
                <div *ngIf="artigosComQuestoes.length > 1" class="flex items-center gap-1.5">
                  <span class="text-[10px] font-bold uppercase text-[var(--on-surface-variant)]">Artigo:</span>
                  <select [(ngModel)]="filtroArtigoQuestao" (ngModelChange)="onFiltroQuestaoChange()"
                    class="px-2.5 py-1 rounded-lg text-xs bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]">
                    <option value="todos">Todos os artigos</option>
                    <option *ngFor="let art of artigosComQuestoes" [value]="art">Art. {{ art }}</option>
                  </select>
                </div>
              </div>

              <!-- Feedback da Contagem de Filtros -->
              <div class="flex items-center justify-between gap-2 pt-2 border-t border-[var(--outline-variant)]/20 text-xs">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[var(--on-surface-variant)]">
                    <strong class="text-[var(--on-surface)]">{{ questoesFiltradas.length }}</strong> de <strong class="text-[var(--on-surface)]">{{ questoesList.length }}</strong> Questões
                  </span>
                  <span *ngIf="temFiltrosQuestoesAtivos" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                    Filtros aplicados
                  </span>
                </div>
                <button *ngIf="temFiltrosQuestoesAtivos" (click)="limparFiltrosQuestoes()"
                  class="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer">
                  <span class="material-symbols-outlined !text-[14px]">filter_alt_off</span>
                  Limpar Filtros
                </button>
              </div>
            </div>

            <!-- Listagem de Questões Vazia -->
            <div *ngIf="questoesFiltradas.length === 0" class="neo-raised rounded-2xl p-8 text-center bg-[var(--card-bg)] text-xs text-[var(--on-surface-variant)] flex flex-col items-center gap-3">
              <span class="material-symbols-outlined !text-[36px] opacity-40">filter_list_off</span>
              <p>Nenhuma questão encontrada com os filtros selecionados.</p>
              <button *ngIf="temFiltrosQuestoesAtivos" (click)="limparFiltrosQuestoes()"
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 transition-all cursor-pointer">
                Limpar Filtros
              </button>
            </div>

            <!-- Lista Paginada de Questões -->
            <div *ngIf="questoesFiltradas.length > 0" class="flex flex-col gap-5">
              <div *ngFor="let q of questoesPaginadas; let i = index"
                class="neo-raised rounded-2xl p-5 sm:p-6 bg-[var(--card-bg)] flex flex-col gap-4 border transition-all"
                [ngClass]="questoesRespondidas[q.id]
                  ? (isQuestaoAcertou(q) ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5')
                  : 'border-[var(--outline-variant)]/40'">

                <!-- Header da Questão -->
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-[var(--primary)]/10 text-[var(--primary)]">
                      Questão {{ (paginaAtual - 1) * itensPorPagina + i + 1 }}
                    </span>
                    <button *ngIf="q.artigo_numero" (click)="irParaArtigo(q.artigo_numero)"
                      class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--surface-container-low)] hover:bg-[var(--primary)]/15 text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-all cursor-pointer">
                      Art. {{ q.artigo_numero }}
                    </button>
                    <!-- Taxa de Acerto por Artigo -->
                    <span *ngIf="getDesempenhoArtigo(q.artigo_numero) as perf"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      [ngClass]="perf.percentual === null
                        ? 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border border-[var(--outline-variant)]/30'
                        : (perf.percentual >= 70 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : (perf.percentual >= 50 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'))"
                      [title]="perf.percentual !== null ? ('Seu índice de acertos no Art. ' + q.artigo_numero + ': ' + perf.acertos + '/' + perf.respondidas + ' (' + perf.percentual + '%)') : ('Nenhuma questão deste artigo foi respondida ainda')">
                      <span class="material-symbols-outlined !text-[12px]">analytics</span>
                      <span *ngIf="perf.percentual !== null">{{ perf.percentual }}% acerto no Artigo</span>
                      <span *ngIf="perf.percentual === null">Artigo sem respostas</span>
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      [ngClass]="{
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400': q.dificuldade === 'facil',
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400': q.dificuldade === 'medio',
                        'bg-red-500/10 text-red-600 dark:text-red-400': q.dificuldade === 'dificil'
                      }">
                      {{ q.dificuldade === 'facil' ? 'Fácil' : (q.dificuldade === 'medio' ? 'Médio' : 'Difícil') }}
                    </span>
                    <span class="text-[11px] text-[var(--on-surface-variant)] font-medium">
                      {{ q.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Certo / Errado' }}
                    </span>
                  </div>

                  <!-- Status de Resposta da Questão -->
                  <div *ngIf="questoesRespondidas[q.id]">
                    <span *ngIf="isQuestaoAcertou(q)" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
                      <span class="material-symbols-outlined !text-[16px]">check_circle</span>
                      Você Acertou!
                    </span>
                    <span *ngIf="!isQuestaoAcertou(q)" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm">
                      <span class="material-symbols-outlined !text-[16px]">cancel</span>
                      Você Errou
                    </span>
                  </div>
                </div>

                <!-- Enunciado -->
                <div class="rounded-xl p-4 bg-[var(--surface-reading)] border border-[var(--outline-variant)]/40 text-sm sm:text-[15px] font-medium text-[var(--on-surface)] leading-relaxed">
                  {{ q.enunciado }}
                </div>

                <!-- Alternativas Múltipla Escolha -->
                <div *ngIf="q.tipo === 'multipla_escolha' && q.alternativas" class="flex flex-col gap-2.5">
                  <div *ngFor="let opt of ['A','B','C','D','E']"
                    class="rounded-xl border p-3 sm:p-3.5 text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer select-none"
                    (click)="selecionarOpcaoQuestao(q.id, opt)"
                    [ngClass]="{
                      'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold': questoesRespondidas[q.id] && q.gabarito === opt,
                      'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300': questoesRespondidas[q.id] && respostasUsuario[q.id] === opt && q.gabarito !== opt,
                      'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold': !questoesRespondidas[q.id] && respostasUsuario[q.id] === opt,
                      'border-[var(--outline-variant)]/40 hover:border-[var(--primary)]/50 bg-[var(--card-bg)] text-[var(--on-surface)]': (!questoesRespondidas[q.id] && respostasUsuario[q.id] !== opt) || (questoesRespondidas[q.id] && q.gabarito !== opt && respostasUsuario[q.id] !== opt)
                    }">
                    <span class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                      [ngClass]="{
                        'bg-emerald-500 text-white': questoesRespondidas[q.id] && q.gabarito === opt,
                        'bg-red-500 text-white': questoesRespondidas[q.id] && respostasUsuario[q.id] === opt && q.gabarito !== opt,
                        'bg-[var(--primary)] text-white': !questoesRespondidas[q.id] && respostasUsuario[q.id] === opt,
                        'bg-[var(--surface-container)] text-[var(--on-surface-variant)]': respostasUsuario[q.id] !== opt && (!questoesRespondidas[q.id] || q.gabarito !== opt)
                      }">
                      {{ opt }}
                    </span>
                    <span class="flex-1 mt-0.5 leading-relaxed">{{ getAlternativaTexto(q, opt) }}</span>
                  </div>
                </div>

                <!-- Alternativas Certo / Errado -->
                <div *ngIf="q.tipo === 'certo_errado'" class="grid grid-cols-2 gap-3">
                  <button type="button"
                    (click)="selecionarOpcaoQuestao(q.id, 'certo')"
                    class="p-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
                    [ngClass]="{
                      'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400': questoesRespondidas[q.id] && (q.gabarito === 'certo' || q.gabarito === 'Certo' || q.gabarito === 'C'),
                      'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400': questoesRespondidas[q.id] && respostasUsuario[q.id] === 'certo' && !(q.gabarito === 'certo' || q.gabarito === 'Certo' || q.gabarito === 'C'),
                      'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]': !questoesRespondidas[q.id] && respostasUsuario[q.id] === 'certo',
                      'border-[var(--outline-variant)]/40 hover:border-[var(--primary)]/50 bg-[var(--card-bg)] text-[var(--on-surface)]': (!questoesRespondidas[q.id] && respostasUsuario[q.id] !== 'certo') || (questoesRespondidas[q.id] && !(q.gabarito === 'certo' || q.gabarito === 'Certo' || q.gabarito === 'C') && respostasUsuario[q.id] !== 'certo')
                    }">
                    <span class="material-symbols-outlined !text-[20px]">check_circle</span>
                    CERTO
                  </button>

                  <button type="button"
                    (click)="selecionarOpcaoQuestao(q.id, 'errado')"
                    class="p-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
                    [ngClass]="{
                      'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400': questoesRespondidas[q.id] && (q.gabarito === 'errado' || q.gabarito === 'Errado' || q.gabarito === 'E'),
                      'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400': questoesRespondidas[q.id] && respostasUsuario[q.id] === 'errado' && !(q.gabarito === 'errado' || q.gabarito === 'Errado' || q.gabarito === 'E'),
                      'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]': !questoesRespondidas[q.id] && respostasUsuario[q.id] === 'errado',
                      'border-[var(--outline-variant)]/40 hover:border-[var(--primary)]/50 bg-[var(--card-bg)] text-[var(--on-surface)]': (!questoesRespondidas[q.id] && respostasUsuario[q.id] !== 'errado') || (questoesRespondidas[q.id] && !(q.gabarito === 'errado' || q.gabarito === 'Errado' || q.gabarito === 'E') && respostasUsuario[q.id] !== 'errado')
                    }">
                    <span class="material-symbols-outlined !text-[20px]">cancel</span>
                    ERRADO
                  </button>
                </div>

                <!-- Botões de Ação (Responder / Refazer) -->
                <div class="flex items-center justify-between gap-3 pt-2">
                  <div *ngIf="!questoesRespondidas[q.id]">
                    <button type="button"
                      (click)="confirmarRespostaQuestao(q)"
                      [disabled]="!respostasUsuario[q.id]"
                      class="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-500/25 cursor-pointer flex items-center gap-1.5">
                      <span class="material-symbols-outlined !text-[16px]">send</span>
                      Confirmar Resposta
                    </button>
                  </div>

                  <div *ngIf="questoesRespondidas[q.id]" class="flex items-center gap-2">
                    <button type="button"
                      (click)="refazerQuestao(q.id)"
                      class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-all cursor-pointer flex items-center gap-1.5">
                      <span class="material-symbols-outlined !text-[15px]">refresh</span>
                      Refazer
                    </button>
                    <button type="button"
                      (click)="toggleExplicacaoQuestao(q.id)"
                      class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all cursor-pointer flex items-center gap-1.5">
                      <span class="material-symbols-outlined !text-[15px]">{{ explicacoesAbertas[q.id] ? 'visibility_off' : 'lightbulb' }}</span>
                      {{ explicacoesAbertas[q.id] ? 'Ocultar Justificativa' : 'Ver Justificativa' }}
                    </button>
                  </div>
                </div>

                <!-- Justificativa & Comentários do Gabarito -->
                <div *ngIf="questoesRespondidas[q.id] && explicacoesAbertas[q.id]"
                  class="rounded-xl p-4 sm:p-5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined !text-[18px] text-amber-500">lightbulb</span>
                    <h4 class="text-xs font-black uppercase tracking-wider text-[var(--on-surface)]">
                      Gabarito Oficial: <span class="text-[var(--primary)] font-black text-sm">{{ q.gabarito }}</span>
                    </h4>
                  </div>
                  <p class="text-xs sm:text-sm text-[var(--on-surface)] leading-relaxed whitespace-pre-wrap">
                    {{ q.justificativa }}
                  </p>

                  <!-- Justificativas por alternativa -->
                  <div *ngIf="q.justificativas_alternativas" class="mt-2 pt-3 border-t border-[var(--outline-variant)]/30 flex flex-col gap-2">
                    <span class="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-variant)]">Análise Detalhada das Alternativas:</span>
                    <div *ngFor="let altKey of ['A','B','C','D','E']" class="text-xs text-[var(--on-surface-variant)]">
                      <div *ngIf="getJustificativaAlternativa(q, altKey)" class="flex items-start gap-2 p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--outline-variant)]/20">
                        <strong class="text-[var(--on-surface)] font-bold">{{ altKey }}:</strong>
                        <span>{{ getJustificativaAlternativa(q, altKey) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- Paginação de Questões (10 por página) -->
            <div *ngIf="questoesFiltradas.length > itensPorPagina"
              class="neo-raised rounded-2xl p-4 bg-[var(--card-bg)] flex flex-col sm:flex-row items-center justify-between gap-3 border border-[var(--outline-variant)]/30">
              <span class="text-xs text-[var(--on-surface-variant)]">
                Página <strong>{{ paginaAtual }}</strong> de <strong>{{ totalPaginasQuestoes }}</strong>
                (Questões {{ (paginaAtual - 1) * itensPorPagina + 1 }}–{{ getIndiceFimQuestoes() }} de {{ questoesFiltradas.length }})
              </span>

              <div class="flex items-center gap-1.5 flex-wrap justify-center">
                <button type="button"
                  (click)="mudarPaginaQuestoes(paginaAtual - 1)"
                  [disabled]="paginaAtual <= 1"
                  class="p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  [ngClass]="paginaAtual > 1 ? 'bg-[var(--surface-container-low)] text-[var(--on-surface)] border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container)]' : 'border-transparent text-[var(--on-surface-variant)]'">
                  <span class="material-symbols-outlined !text-[16px]">chevron_left</span>
                </button>

                <button *ngFor="let p of paginasArrayQuestoes"
                  type="button"
                  (click)="mudarPaginaQuestoes(p)"
                  class="w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                  [ngClass]="p === paginaAtual
                    ? 'bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white shadow-sm font-black'
                    : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] border border-[var(--outline-variant)]/30'">
                  {{ p }}
                </button>

                <button type="button"
                  (click)="mudarPaginaQuestoes(paginaAtual + 1)"
                  [disabled]="paginaAtual >= totalPaginasQuestoes"
                  class="p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  [ngClass]="paginaAtual < totalPaginasQuestoes ? 'bg-[var(--surface-container-low)] text-[var(--on-surface)] border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container)]' : 'border-transparent text-[var(--on-surface-variant)]'">
                  <span class="material-symbols-outlined !text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>

          </div>

          <!-- ============================================================ -->
          <!-- SUB-ABA 2: FLASHCARDS (INTERATIVO & FLIP 3D)                 -->
          <!-- ============================================================ -->
          <div *ngIf="subAbaConcurso === 'flashcards'" class="flex flex-col gap-4">

            <!-- Alternador de Modo de Visualização dos Flashcards -->
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="text-xs text-[var(--on-surface-variant)]">Total de Flashcards:</span>
                <span class="text-xs font-bold text-[var(--on-surface)]">{{ flashcardsList.length }}</span>
                <span *ngIf="totalFlashcardsDominados > 0" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {{ totalFlashcardsDominados }} dominados
                </span>
                <span *ngIf="totalFlashcardsRevisar > 0" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {{ totalFlashcardsRevisar }} para revisar
                </span>
              </div>

              <div class="inline-flex bg-[var(--surface-container-low)] rounded-xl p-1 gap-1">
                <button (click)="modoVisualizacaoFlashcard = 'interativo'"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  [ngClass]="modoVisualizacaoFlashcard === 'interativo' ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-xs' : 'text-[var(--on-surface-variant)]'">
                  <span class="material-symbols-outlined !text-[15px]">view_carousel</span>
                  Modo Interativo
                </button>
                <button (click)="modoVisualizacaoFlashcard = 'lista'"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  [ngClass]="modoVisualizacaoFlashcard === 'lista' ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-xs' : 'text-[var(--on-surface-variant)]'">
                  <span class="material-symbols-outlined !text-[15px]">list</span>
                  Ver Todos
                </button>
              </div>
            </div>

            <!-- Modo Interativo (Flip Card) -->
            <div *ngIf="modoVisualizacaoFlashcard === 'interativo' && flashcardAtual" class="flex flex-col items-center gap-4">

              <!-- Progresso e Controles no Topo -->
              <div class="w-full max-w-xl flex items-center justify-between text-xs text-[var(--on-surface-variant)]">
                <span>Card <strong>{{ indiceFlashcardAtual + 1 }}</strong> de <strong>{{ flashcardsList.length }}</strong></span>
                <button (click)="embaralharFlashcards()" class="flex items-center gap-1 text-[var(--primary)] font-bold hover:underline cursor-pointer">
                  <span class="material-symbols-outlined !text-[15px]">shuffle</span>
                  Embaralhar
                </button>
              </div>

              <!-- Barra de Progresso do Flashcard -->
              <div class="w-full max-w-xl h-1.5 bg-[var(--surface-container)] rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] transition-all duration-300"
                  [style.width.%]="((indiceFlashcardAtual + 1) / flashcardsList.length) * 100"></div>
              </div>

              <!-- Cartão Flashcard Grande -->
              <div (click)="virarFlashcard()"
                class="w-full max-w-xl min-h-[280px] neo-raised rounded-3xl p-6 sm:p-8 bg-[var(--card-bg)] flex flex-col justify-between gap-6 cursor-pointer select-none transition-all duration-300 border border-[var(--outline-variant)]/40 hover:border-[var(--primary)]/40 hover:shadow-xl relative overflow-hidden group">

                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span *ngIf="flashcardAtual.artigo_numero" class="px-2.5 py-1 rounded-lg text-xs font-black bg-[var(--primary)]/10 text-[var(--primary)]">
                      Art. {{ flashcardAtual.artigo_numero }}
                    </span>
                    <span *ngIf="flashcardAtual.assunto" class="text-xs text-[var(--on-surface-variant)] font-medium">
                      {{ flashcardAtual.assunto }}
                    </span>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="flashcardVirado ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'">
                    {{ flashcardVirado ? 'Resposta' : 'Pergunta' }}
                  </span>
                </div>

                <!-- Conteúdo Frente (Pergunta) -->
                <div *ngIf="!flashcardVirado" class="flex flex-col gap-3 my-auto text-center">
                  <p class="text-base sm:text-lg font-bold text-[var(--on-surface)] leading-relaxed">
                    {{ flashcardAtual.pergunta }}
                  </p>
                  <p class="text-[11px] text-[var(--on-surface-variant)] flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined !text-[14px]">touch_app</span>
                    Clique no card para virar e ver a resposta
                  </p>
                </div>

                <!-- Conteúdo Verso (Resposta) -->
                <div *ngIf="flashcardVirado" class="flex flex-col gap-3 my-auto">
                  <div class="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-emerald-500/30">
                    <p class="text-sm sm:text-[15px] font-medium text-[var(--on-surface)] leading-relaxed whitespace-pre-wrap">
                      {{ flashcardAtual.resposta }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[11px] text-[var(--on-surface-variant)] pt-2 border-t border-[var(--outline-variant)]/20">
                  <span>{{ flashcardVirado ? 'Verso' : 'Frente' }}</span>
                  <span class="flex items-center gap-1 font-semibold text-[var(--primary)]">
                    <span class="material-symbols-outlined !text-[14px]">sync</span>
                    Virar Card
                  </span>
                </div>
              </div>

              <!-- Controles do Flashcard (Ações de Aprendizado) -->
              <div class="w-full max-w-xl flex items-center justify-between gap-3">
                <button (click)="anteriorFlashcard()"
                  [disabled]="indiceFlashcardAtual === 0"
                  class="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[16px]">chevron_left</span>
                  Anterior
                </button>

                <div class="flex items-center gap-2">
                  <button (click)="marcarFlashcardStatus(flashcardAtual.id, 'revisar')"
                    class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-all cursor-pointer flex items-center gap-1.5">
                    <span class="material-symbols-outlined !text-[16px]">warning</span>
                    Preciso Revisar
                  </button>

                  <button (click)="marcarFlashcardStatus(flashcardAtual.id, 'dominado')"
                    class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:opacity-90 shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-1.5">
                    <span class="material-symbols-outlined !text-[16px]">check_circle</span>
                    Já Dominei
                  </button>
                </div>

                <button (click)="proximoFlashcard()"
                  [disabled]="indiceFlashcardAtual >= flashcardsList.length - 1"
                  class="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1">
                  Próximo
                  <span class="material-symbols-outlined !text-[16px]">chevron_right</span>
                </button>
              </div>

            </div>

            <!-- Modo Lista (Todos os Flashcards) -->
            <div *ngIf="modoVisualizacaoFlashcard === 'lista'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let fc of flashcardsList; let i = index"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col justify-between gap-4 border border-[var(--outline-variant)]/40">
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                    #{{ i + 1 }} {{ fc.artigo_numero ? '• Art. ' + fc.artigo_numero : '' }}
                  </span>
                  <span *ngIf="fc.assunto" class="text-[11px] text-[var(--on-surface-variant)] truncate max-w-[150px]">
                    {{ fc.assunto }}
                  </span>
                </div>

                <div>
                  <h4 class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Pergunta</h4>
                  <p class="text-xs sm:text-sm font-bold text-[var(--on-surface)]">{{ fc.pergunta }}</p>
                </div>

                <div class="pt-3 border-t border-[var(--outline-variant)]/30">
                  <h4 class="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Resposta Fundamentada</h4>
                  <p class="text-xs text-[var(--on-surface)] leading-relaxed whitespace-pre-wrap">{{ fc.resposta }}</p>
                </div>
              </div>
            </div>

          </div>

          <!-- ============================================================ -->
          <!-- SUB-ABA 3: PEGADINHAS DE BANCA                               -->
          <!-- ============================================================ -->
          <div *ngIf="subAbaConcurso === 'pegadinhas'" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let peg of materialConcurso.pegadinhas; let i = index"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-3.5 border border-amber-500/30">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                      <span class="material-symbols-outlined !text-[16px]">warning</span>
                    </span>
                    <span class="text-xs font-black text-[var(--on-surface)]">
                      Pegadinha #{{ i + 1 }} {{ peg.artigo_numero ? '— Art. ' + peg.artigo_numero : '' }}
                    </span>
                  </div>
                </div>

                <p class="text-xs font-semibold text-[var(--on-surface)] leading-relaxed">
                  {{ peg.descricao }}
                </p>

                <!-- Como a banca cobra -->
                <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[14px]">dangerous</span>
                    Como o examinador tenta enganar:
                  </span>
                  <p class="text-xs text-[var(--on-surface)]">{{ peg.forma_de_cobranca }}</p>
                </div>

                <!-- Resposta correta -->
                <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-1">
                  <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[14px]">check_circle</span>
                    Regra correta na lei:
                  </span>
                  <p class="text-xs text-[var(--on-surface)]">{{ peg.resposta_correta }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- SUB-ABA 4: PONTOS DE PROVA                                   -->
          <!-- ============================================================ -->
          <div *ngIf="subAbaConcurso === 'pontos'" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let ponto of materialConcurso.pontos_de_prova; let i = index"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-3 border border-[var(--outline-variant)]/40">
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-[var(--primary)]/10 text-[var(--primary)]">
                    Ponto #{{ i + 1 }} {{ ponto.artigo_numero ? '— Art. ' + ponto.artigo_numero : '' }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [ngClass]="{
                      'bg-red-500/15 text-red-600': ponto.prioridade === 'alta',
                      'bg-amber-500/15 text-amber-600': ponto.prioridade === 'media',
                      'bg-slate-500/15 text-slate-500': ponto.prioridade === 'baixa'
                    }">
                    Prioridade {{ ponto.prioridade | uppercase }}
                  </span>
                </div>

                <div>
                  <h4 class="text-xs font-black text-[var(--on-surface)]">{{ ponto.assunto }}</h4>
                  <p class="text-xs text-[var(--on-surface-variant)] mt-1 leading-relaxed">{{ ponto.conteudo }}</p>
                </div>

                <div *ngIf="ponto.motivo_relevancia" class="p-2.5 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 text-xs">
                  <span class="text-[10px] font-black uppercase tracking-wider text-[var(--primary)]">Por que cai em prova:</span>
                  <p class="text-[11px] text-[var(--on-surface)] mt-0.5">{{ ponto.motivo_relevancia }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- SUB-ABA 5: MEMORIZAÇÃO & PRAZOS                              -->
          <!-- ============================================================ -->
          <div *ngIf="subAbaConcurso === 'memorizacao'" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let conc of materialConcurso.conceitos_memorizacao; let i = index"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-3 border border-blue-500/30">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
                      <span class="material-symbols-outlined !text-[16px]">psychology</span>
                    </span>
                    <span class="text-xs font-black text-[var(--on-surface)]">
                      {{ conc.conceito }}
                    </span>
                  </div>
                  <span *ngIf="conc.artigo_numero" class="text-xs font-bold text-[var(--primary)]">
                    Art. {{ conc.artigo_numero }}
                  </span>
                </div>

                <div class="p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 text-xs">
                  <span class="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">O que memorizar:</span>
                  <p class="text-xs font-bold text-[var(--on-surface)] mt-0.5">{{ conc.o_que_memorizar }}</p>
                </div>

                <div *ngIf="conc.estrategia_memorizacao" class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs">
                  <span class="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[14px]">lightbulb</span>
                    Estratégia / Mnemônico:
                  </span>
                  <p class="text-xs text-[var(--on-surface)] mt-0.5">{{ conc.estrategia_memorizacao }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- SUB-ABA 6: COMPARAÇÕES                                       -->
          <!-- ============================================================ -->
          <div *ngIf="subAbaConcurso === 'comparacoes'" class="flex flex-col gap-4">
            <div *ngFor="let comp of materialConcurso.comparacoes; let i = index"
              class="neo-raised rounded-2xl p-5 sm:p-6 bg-[var(--card-bg)] flex flex-col gap-4 border border-[var(--outline-variant)]/40">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-600 flex items-center justify-center">
                  <span class="material-symbols-outlined !text-[18px]">balance</span>
                </span>
                <h3 class="text-sm font-black text-[var(--on-surface)]">{{ comp.titulo }}</h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <!-- Semelhanças -->
                <div class="p-3.5 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col gap-2">
                  <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[14px]">check</span>
                    Semelhanças:
                  </span>
                  <ul class="list-disc list-inside space-y-1 text-[var(--on-surface)]">
                    <li *ngFor="let s of comp.semelhancas">{{ s }}</li>
                  </ul>
                </div>

                <!-- Diferenças -->
                <div class="p-3.5 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col gap-2">
                  <span class="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[14px]">swap_horiz</span>
                    Diferenças:
                  </span>
                  <ul class="list-disc list-inside space-y-1 text-[var(--on-surface)]">
                    <li *ngFor="let d of comp.diferencas">{{ d }}</li>
                  </ul>
                </div>
              </div>

              <div *ngIf="comp.ponto_atencao" class="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-[var(--on-surface)] flex items-start gap-2">
                <span class="material-symbols-outlined !text-[16px] text-red-500 mt-0.5">warning</span>
                <div>
                  <strong class="text-red-600 dark:text-red-400 font-bold">Ponto de Atenção para Prova:</strong>
                  <p class="mt-0.5">{{ comp.ponto_atencao }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
      <!-- FIM ABA MATERIAL DE CONCURSO -->

      <!-- ============================================================ -->
      <!-- ABA: ARTIGOS (existente)                                     -->
      <!-- ============================================================ -->
      <div *ngIf="abaAtiva === 'artigos'">

      <!-- Placeholder quando nenhum artigo selecionado -->
      <div *ngIf="!loading && !artigoSelecionado" class="neo-raised rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-3 bg-[var(--card-bg)]">
        <span class="material-symbols-outlined !text-[48px] text-[var(--on-surface-variant)]/30">article</span>
        <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Selecione um artigo para ver o comentário</p>
      </div>

      <!-- Artigo selecionado (largura total) -->
      <div *ngIf="!loading && artigoSelecionado" class="flex flex-col gap-4">

            <!-- Card: Texto do Artigo -->
            <div class="neo-raised rounded-2xl p-5 sm:p-6 bg-[var(--card-bg)] flex flex-col gap-3.5">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm font-black text-[var(--on-surface)] flex items-center gap-2">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">Art. {{ artigoSelecionado.numero }}</span>
                    <span *ngIf="artigoSelecionado.titulo" class="text-xs text-[var(--on-surface-variant)] font-normal">{{ artigoSelecionado.titulo }}</span>
                  </h3>
                  <span *ngIf="isArtigoLido(artigoSelecionado.numero)"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span class="material-symbols-outlined !text-[12px]">check</span>
                    Estudado
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Botão Marcar como Lido / Desmarcar -->
                  <button type="button"
                    (click)="toggleArtigoLido(artigoSelecionado)"
                    [disabled]="salvandoLido"
                    [title]="isArtigoLido(artigoSelecionado.numero) ? 'Clique para desmarcar leitura' : 'Marcar artigo como lido/estudado'"
                    class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs select-none active:scale-95 cursor-pointer"
                    [ngClass]="isArtigoLido(artigoSelecionado.numero)
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-emerald-500/50 hover:text-emerald-600 hover:bg-emerald-500/5'">
                    <span class="material-symbols-outlined !text-[16px]"
                      [class.text-emerald-500]="isArtigoLido(artigoSelecionado.numero)">
                      {{ isArtigoLido(artigoSelecionado.numero) ? 'check_circle' : 'radio_button_unchecked' }}
                    </span>
                    {{ isArtigoLido(artigoSelecionado.numero) ? 'Artigo Lido' : 'Marcar como Lido' }}
                  </button>

                  <button *ngIf="getComentarioStatus(artigoSelecionado) === 'erro'"
                    (click)="reprocessarArtigo(artigoSelecionado)"
                    [disabled]="reprocessando"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-bold transition-all disabled:opacity-50">
                    <span class="material-symbols-outlined !text-[16px]" [class.animate-spin]="reprocessando">refresh</span>
                    {{ reprocessando ? 'Reprocessando...' : 'Retry' }}
                  </button>
                </div>
              </div>

              <!-- Dedicated Reading Document Surface -->
              <div class="rounded-2xl p-5 sm:p-6 bg-[var(--surface-reading)] border border-[var(--outline-variant)] shadow-2xs">
                <p class="text-sm sm:text-[15px] text-[var(--on-surface)] leading-relaxed whitespace-pre-wrap text-justify" style="line-height: 1.8;">{{ artigoSelecionado.texto_original }}</p>
              </div>
            </div>

            <!-- Loading comentário -->
            <div *ngIf="loadingComentario" class="neo-raised rounded-2xl p-8 flex flex-col items-center gap-3 bg-[var(--card-bg)]">
              <span class="material-symbols-outlined !text-[32px] text-[var(--primary)] animate-pulse">psychology</span>
              <p class="text-sm text-[var(--on-surface-variant)]">Carregando comentário...</p>
            </div>

            <!-- Sem comentário ainda -->
            <div *ngIf="!loadingComentario && !comentarioAtivo && getComentarioStatus(artigoSelecionado) !== 'erro'"
              class="neo-raised rounded-2xl p-8 flex flex-col items-center gap-3 bg-[var(--card-bg)]">
              <span class="material-symbols-outlined !text-[32px] text-[var(--on-surface-variant)]/40 animate-pulse">hourglass_empty</span>
              <p class="text-sm text-[var(--on-surface-variant)]">Aguardando processamento do comentário...</p>
            </div>

            <!-- Erro no comentário -->
            <div *ngIf="!loadingComentario && getComentarioStatus(artigoSelecionado) === 'erro' && !comentarioAtivo"
              class="neo-raised rounded-2xl p-6 bg-[var(--card-bg)] flex flex-col gap-3">
              <div class="rounded-xl p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 flex items-start gap-3">
                <span class="material-symbols-outlined !text-[20px] text-[var(--error)] mt-0.5">error</span>
                <div>
                  <p class="text-sm font-bold text-[var(--error)]">Falha ao processar este artigo</p>
                  <p class="text-xs text-[var(--on-surface-variant)] mt-1">{{ getErroComentario(artigoSelecionado) }}</p>
                </div>
              </div>
            </div>

            <!-- Card: Comentário -->
            <div *ngIf="!loadingComentario && comentarioAtivo" class="flex flex-col gap-4">

              <!-- Relevância + Confiança + Resumo + Seções para Exibir -->
              <div class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-4">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    [ngClass]="{
                      'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20': comentarioAtivo.relevancia_concurso === 'alta',
                      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20': comentarioAtivo.relevancia_concurso === 'media',
                      'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20': comentarioAtivo.relevancia_concurso === 'baixa'
                    }">
                    <span class="material-symbols-outlined !text-[14px]">school</span>
                    Relevância {{ legislacaoService.getRelevanciaLabel(comentarioAtivo.relevancia_concurso) }}
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <span class="material-symbols-outlined !text-[14px]">verified</span>
                    Confiança {{ legislacaoService.getRelevanciaLabel(comentarioAtivo.grau_confianca) }}
                  </span>
                </div>

                <!-- Conteúdo do Resumo (visível se resumo estiver selecionado) -->
                <ng-container *ngIf="secoesSelecionadas['resumo']">
                  <!-- Resumo -->
                  <div class="flex flex-col gap-1">
                    <p class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider">Resumo</p>
                    <p class="text-sm font-semibold text-[var(--on-surface)]">{{ comentarioAtivo.resumo }}</p>
                  </div>

                  <!-- Explicação simples (sem a linha de título) -->
                  <p *ngIf="comentarioAtivo.explicacao_simples" class="text-sm text-[var(--on-surface)] leading-relaxed text-justify" style="line-height: 1.75;">
                    {{ comentarioAtivo.explicacao_simples }}
                  </p>

                  <!-- Comentário técnico / Análise Técnica -->
                  <div *ngIf="comentarioAtivo.comentario_tecnico"
                    class="rounded-2xl p-5 bg-[var(--surface-reading)] border border-[var(--outline-variant)] border-l-4 border-l-[var(--primary)] flex flex-col gap-2 shadow-2xs">
                    <p class="text-xs font-black text-[var(--primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <span class="material-symbols-outlined !text-[16px]">analytics</span>
                      Análise Técnica
                    </p>
                    <p class="text-sm text-[var(--on-surface)] leading-relaxed text-justify" style="line-height: 1.75;">
                      {{ comentarioAtivo.comentario_tecnico }}
                    </p>
                  </div>
                </ng-container>

                <!-- Seletor de opções em Checkbox no final do card de Relevância -->
                <div class="mt-1 pt-3 border-t border-[var(--outline-variant)]/60 flex flex-col gap-2.5">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                      <span class="material-symbols-outlined !text-[15px] text-[var(--primary)]">checklist</span>
                      Seções para Exibir
                    </span>
                    <div class="flex items-center gap-2">
                      <button type="button" (click)="marcarTodasSecoes(true)"
                        class="text-[11px] font-bold text-[var(--primary)] hover:underline cursor-pointer">
                        Marcar todos
                      </button>
                      <span class="text-xs text-[var(--outline-variant)]">|</span>
                      <button type="button" (click)="marcarTodasSecoes(false)"
                        class="text-[11px] font-bold text-[var(--on-surface-variant)] hover:underline cursor-pointer">
                        Apenas Resumo
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <label *ngFor="let op of getOpcoesDisponiveis()"
                      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all border"
                      [ngClass]="secoesSelecionadas[op.key]
                        ? 'shadow-2xs font-bold'
                        : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border-[var(--outline-variant)] hover:bg-[var(--surface-container)] opacity-85 hover:opacity-100'"
                      [style.backgroundColor]="secoesSelecionadas[op.key] ? op.color + '15' : ''"
                      [style.borderColor]="secoesSelecionadas[op.key] ? op.color + '40' : ''"
                      [style.color]="secoesSelecionadas[op.key] ? op.color : ''">
                      <input type="checkbox"
                        [checked]="secoesSelecionadas[op.key]"
                        (change)="toggleSecao(op.key)"
                        [style.accent-color]="op.color"
                        class="w-3.5 h-3.5 rounded cursor-pointer" />
                      <span class="material-symbols-outlined !text-[15px]" [style.color]="op.color">{{ op.icon }}</span>
                      <span>{{ op.label }}</span>
                      <span *ngIf="getBadgeCount(op.key) !== null"
                        class="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                        [style.backgroundColor]="secoesSelecionadas[op.key] ? op.color : ''"
                        [ngClass]="secoesSelecionadas[op.key] ? 'text-white' : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]'">
                        {{ getBadgeCount(op.key) }}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Listas categorizadas -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ng-container *ngFor="let categoria of categorias">
                  <div *ngIf="secoesSelecionadas[categoria.key] && getCategoria(categoria.key).length > 0"
                    class="neo-raised rounded-2xl p-4 bg-[var(--card-bg)] flex flex-col gap-2.5">
                    <p class="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                      [style.color]="categoria.color">
                      <span class="material-symbols-outlined !text-[15px]">{{ categoria.icon }}</span>
                      {{ categoria.label }}
                    </p>
                    <ul class="space-y-2">
                      <li *ngFor="let item of getCategoria(categoria.key)"
                        class="text-xs text-[var(--on-surface)] flex items-start gap-2">
                        <span class="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white"
                          [style.background-color]="categoria.color">
                          <span class="material-symbols-outlined !text-[10px]">{{ categoria.itemIcon }}</span>
                        </span>
                        <span class="leading-relaxed">{{ getItemText(item) }}</span>
                      </li>
                    </ul>
                  </div>
                </ng-container>
              </div>

              <!-- Exemplo prático -->
              <div *ngIf="secoesSelecionadas['resumo'] && comentarioAtivo.exemplo_pratico"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-2">
                <p class="text-xs font-black text-[var(--tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined !text-[15px]">lightbulb</span>
                  Exemplo Prático
                </p>
                <p class="text-sm text-[var(--on-surface)] leading-relaxed bg-[var(--tertiary)]/8 border border-[var(--tertiary)]/20 rounded-xl p-4" style="line-height: 1.75;">
                  {{ comentarioAtivo.exemplo_pratico }}
                </p>
              </div>

              <!-- Observação interpretativa (vinculada à seção Atenção) -->
              <div *ngIf="secoesSelecionadas['pontos_atencao'] && comentarioAtivo.observacao_interpretativa"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-2">
                <p class="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined !text-[15px]">warning_amber</span>
                  Atenção — Observação Interpretativa
                </p>
                <p class="text-sm text-[var(--on-surface)] leading-relaxed bg-amber-500/8 border border-amber-500/20 rounded-xl p-4" style="line-height: 1.75;">
                  {{ comentarioAtivo.observacao_interpretativa }}
                </p>
              </div>

              <!-- Mensagem quando nenhuma seção está selecionada/visível -->
              <div *ngIf="!temSecaoAtivaVisivel()"
                class="neo-raised rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2 bg-[var(--card-bg)]">
                <span class="material-symbols-outlined !text-[36px] text-[var(--on-surface-variant)]/40">tune</span>
                <p class="text-sm font-bold text-[var(--on-surface)]">Nenhuma seção selecionada</p>
                <p class="text-xs text-[var(--on-surface-variant)] max-w-sm">
                  Utilize os seletores acima para ativar as seções que deseja estudar (Resumo, Atenção, Obrigações, etc.).
                </p>
              </div>
            </div>

            <!-- Barra de Navegação no Final do Artigo -->
            <div class="neo-raised rounded-2xl p-4 bg-[var(--card-bg)] flex items-center justify-between gap-3 flex-wrap">
              <!-- Botão Voltar -->
              <button (click)="artigoAnterior()"
                [disabled]="!temArtigoAnterior"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border select-none"
                [ngClass]="temArtigoAnterior
                  ? 'bg-[var(--surface-container-low)] text-[var(--on-surface)] border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container)] hover:border-[var(--primary)]/40 active:scale-95 shadow-sm'
                  : 'opacity-40 cursor-not-allowed text-[var(--on-surface-variant)] border-transparent bg-[var(--surface-container-low)]/50'">
                <span class="material-symbols-outlined !text-[18px]">arrow_back</span>
                <span>Voltar</span>
                <span *ngIf="artigoAnteriorObj" class="hidden sm:inline font-normal text-[var(--on-surface-variant)]">
                  (Art. {{ artigoAnteriorObj.numero }})
                </span>
              </button>

              <!-- Indicador de Artigo Central -->
              <span class="text-xs font-semibold text-[var(--on-surface-variant)]">
                Artigo {{ indiceArtigoAtual + 1 }} de {{ artigos.length }}
              </span>

              <!-- Ações da Direita: Marcar como Lido + Próximo Artigo -->
              <div class="flex items-center gap-2">
                <!-- Botão Marcar como Lido -->
                <button type="button"
                  (click)="toggleArtigoLido(artigoSelecionado)"
                  [disabled]="salvandoLido"
                  [title]="isArtigoLido(artigoSelecionado.numero) ? 'Clique para desmarcar leitura' : 'Marcar artigo como lido/estudado'"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border shadow-sm select-none active:scale-95"
                  [ngClass]="isArtigoLido(artigoSelecionado.numero)
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:border-emerald-500/50 hover:text-emerald-600 hover:bg-emerald-500/5'">
                  <span class="material-symbols-outlined !text-[18px]"
                    [class.text-emerald-500]="isArtigoLido(artigoSelecionado.numero)">
                    {{ isArtigoLido(artigoSelecionado.numero) ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                  <span>{{ isArtigoLido(artigoSelecionado.numero) ? 'Artigo Lido' : 'Marcar como Lido' }}</span>
                </button>

                <!-- Botão Próximo -->
                <button (click)="proximoArtigo()"
                  [disabled]="!temProximoArtigo"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border select-none"
                  [ngClass]="temProximoArtigo
                    ? 'bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white border-transparent shadow-md shadow-purple-500/25 active:scale-95'
                    : 'opacity-40 cursor-not-allowed text-[var(--on-surface-variant)] border-transparent bg-[var(--surface-container-low)]/50'">
                  <span>Próximo Artigo</span>
                  <span *ngIf="proximoArtigoObj" class="hidden sm:inline opacity-90 font-normal">
                    (Art. {{ proximoArtigoObj.numero }})
                  </span>
                  <span class="material-symbols-outlined !text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>


          </div>
        </div>
      </div>
      <!-- FIM ABA ARTIGOS -->

  `,
})
export class LegislacaoDetailComponent implements OnInit, OnDestroy {
  legislacao: Legislacao | null = null;
  artigos: LegislacaoArtigo[] = [];
  processamentos: LegislacaoProcessamento[] = [];
  artigoSelecionado: LegislacaoArtigo | null = null;
  comentarioAtivo: LegislacaoComentario | null = null;
  loading = true;
  loadingComentario = false;
  reprocessando = false;
  private realtimeChannel: any;
  private subs: Subscription[] = [];

  // Progresso de Leitura de Artigos & Cronograma
  artigosLidos: Set<string> = new Set<string>();
  salvandoLido = false;


  // Abas
  abaAtiva: 'artigos' | 'analise' | 'cronograma' | 'concurso' = 'artigos';

  // Agente 3 — Analista Estratégico de Concursos
  analiseEstrategica: LegislacaoAnaliseEstrategica | null = null;
  loadingAnaliseEstrategica = false;
  gerandoAnaliseEstrategica = false;
  filtroPrioridadeAnalise: 'todas' | 'alta' | 'media' | 'baixa' = 'todas';
  buscaArtigoAnalise: string = '';

  // Agente 4 — Cronograma
  plano: LegislacaoPlano | null = null;
  loadingPlano = false;
  gerandoPlano = false;
  modalPreferencias = false;
  blocoExpandido: string | null = null;
  preferencias: PreferenciasEstudante = {
    data_inicio: new Date().toISOString().split('T')[0],
    tempo_diario_minutos: 60,
    dias_disponiveis: [1, 2, 3, 4, 5],
  };
  readonly diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Agente 5 — Especialista em Concursos (Questões, Flashcards, Pegadinhas, etc.)
  materialConcurso: LegislacaoMaterialConcurso | null = null;
  loadingMaterialConcurso = false;
  gerandoMaterialConcurso = false;
  modalConcursoOpcoes = false;
  subAbaConcurso: 'questoes' | 'flashcards' | 'pegadinhas' | 'pontos' | 'memorizacao' | 'comparacoes' = 'questoes';
  opcoesConcurso: ParametrosGeracaoConcurso = { banca: 'Geral / Múltiplas Bancas' };
  bancasDisponiveis = ['Geral / Múltiplas Bancas', 'Cebraspe / CESPE', 'FGV', 'FCC', 'Vunesp', 'IBFC', 'Consulplan', 'AOCP'];

  // Filtros, Paginação e Interação de Questões
  filtroTipoQuestao: 'todos' | 'multipla_escolha' | 'certo_errado' = 'todos';
  filtroDificuldadeQuestao: 'todos' | 'facil' | 'medio' | 'dificil' = 'todos';
  filtroArtigoQuestao: string = 'todos';
  filtroStatusResolucao: 'todas' | 'pendentes' | 'resolvidas' | 'erros' = 'todas';
  paginaAtual: number = 1;
  itensPorPagina: number = 10;
  feedbackGeracao: { novasQuestoes: number; novosFlashcards: number; totalQuestoes: number } | null = null;
  respostasUsuario: { [questaoId: string]: string } = {};
  questoesRespondidas: { [questaoId: string]: boolean } = {};
  explicacoesAbertas: { [questaoId: string]: boolean } = {};

  // Flashcards Interativos
  indiceFlashcardAtual = 0;
  flashcardVirado = false;
  flashcardsStatus: { [flashcardId: string]: 'dominado' | 'revisar' } = {};
  modoVisualizacaoFlashcard: 'interativo' | 'lista' = 'interativo';

  private pollingTimer: any = null;

  categorias = [
    { key: 'obrigacoes', label: 'Obrigações', icon: 'assignment', itemIcon: 'check', color: '#ef4444' },
    { key: 'direitos', label: 'Direitos', icon: 'shield', itemIcon: 'star', color: '#22c55e' },
    { key: 'proibicoes', label: 'Proibições', icon: 'block', itemIcon: 'close', color: '#dc2626' },
    { key: 'permissoes', label: 'Permissões', icon: 'check_circle', itemIcon: 'check', color: '#3b82f6' },
    { key: 'requisitos', label: 'Requisitos', icon: 'fact_check', itemIcon: 'check', color: '#8b5cf6' },
    { key: 'prazos', label: 'Prazos', icon: 'schedule', itemIcon: 'calendar_today', color: '#f59e0b' },
    { key: 'competencias', label: 'Competências', icon: 'account_balance', itemIcon: 'arrow_right', color: '#0ea5e9' },
    { key: 'excecoes', label: 'Exceções', icon: 'rule', itemIcon: 'priority_high', color: '#f97316' },
    { key: 'consequencias', label: 'Consequências', icon: 'gavel', itemIcon: 'arrow_right', color: '#7c3aed' },
    { key: 'pontos_importantes', label: 'Pontos Importantes', icon: 'lightbulb', itemIcon: 'star', color: '#10b981' },
    { key: 'pontos_atencao', label: 'Atenção', icon: 'warning', itemIcon: 'warning', color: '#f59e0b' },
    { key: 'termos_juridicos', label: 'Termos Jurídicos', icon: 'book', itemIcon: 'label', color: '#64748b' },
  ];

  opcoesPrincipais = [
    { key: 'resumo', label: 'Resumo', icon: 'summarize', color: '#7c3aed' },
    { key: 'pontos_atencao', label: 'Atenção', icon: 'warning', color: '#f59e0b' },
    { key: 'obrigacoes', label: 'Obrigações', icon: 'assignment', color: '#ef4444' },
    { key: 'pontos_importantes', label: 'Pontos Importantes', icon: 'lightbulb', color: '#10b981' },
    { key: 'direitos', label: 'Direitos', icon: 'shield', color: '#22c55e' },
    { key: 'termos_juridicos', label: 'Termos Jurídicos', icon: 'book', color: '#64748b' },
  ];

  secoesSelecionadas: { [key: string]: boolean } = {
    resumo: true,
    pontos_atencao: false,
    obrigacoes: false,
    pontos_importantes: false,
    direitos: false,
    termos_juridicos: false,
  };

  dropdownArtigosAberto = false;
  buscaArtigoTermo = '';

  get artigosFiltrados(): LegislacaoArtigo[] {
    if (!this.buscaArtigoTermo.trim()) return this.artigos;
    const termo = this.buscaArtigoTermo.toLowerCase().trim();
    return this.artigos.filter(a =>
      a.numero.toLowerCase().includes(termo) ||
      (a.titulo && a.titulo.toLowerCase().includes(termo)) ||
      (a.texto_original && a.texto_original.toLowerCase().includes(termo))
    );
  }

  selecionarArtigoViaDropdown(artigo: LegislacaoArtigo) {
    this.selecionarArtigo(artigo);
    this.dropdownArtigosAberto = false;
    this.buscaArtigoTermo = '';
  }

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public legislacaoService: LegislacaoService,
    public themeService: ThemeService,
    public authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}
  trackById(index: number, item: any): string {
    return item?.id || index;
  }

  trackByEtapa(index: number, item: any): string {
    return item?.etapa || index;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.carregar(id);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.legislacaoService.unsubscribe(this.realtimeChannel);
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  carregar(id: string) {
    this.loading = true;
    const sub = this.legislacaoService.detalhar(id).subscribe({
      next: (data: any) => {
        this.ngZone.run(() => {
          this.legislacao = data;
          this.artigos = data.artigos || [];
          this.processamentos = data.processamentos || [];
          if (data.artigos_lidos && Array.isArray(data.artigos_lidos)) {
            this.artigosLidos = new Set<string>(data.artigos_lidos.map((x: any) => String(x).trim()));
          }
          this.loading = false;
          // Seleciona o primeiro artigo automaticamente
          if (this.artigos.length > 0 && !this.artigoSelecionado) {
            this.selecionarArtigo(this.artigos[0]);
          }
          // Pré-carrega a análise estratégica se existir
          this.carregarAnaliseEstrategica();
          // Pré-carrega o plano de cronograma se existir
          this.carregarPlano();
          // Pré-carrega o material de concursos se existir
          this.carregarMaterialConcurso();
          // Inicia Realtime e Polling ativo se estiver processando
          this.subscribeRealtime(id);
          this.iniciarPolling(id);
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
    });
    this.subs.push(sub);
  }

  reprocessar() {
    if (!this.legislacao || this.legislacao.status !== 'erro') return;
    
    // Altera otimisticamente o status para dar feedback imediato
    this.legislacao.status = 'pendente';
    this.cdr.markForCheck();

    const sub = this.legislacaoService.reprocessarLegislacao(this.legislacao.id).subscribe({
      next: () => {
        // Reinicia o polling se precisar
        this.iniciarPolling(this.legislacao!.id);
      },
      error: (err) => {
        console.error('Erro ao reprocessar:', err);
        // Volta para erro em caso de falha de rede
        if (this.legislacao) {
          this.legislacao.status = 'erro';
          this.cdr.markForCheck();
        }
      }
    });
    this.subs.push(sub);
  }

  iniciarPolling(id: string) {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    // Se já estiver concluída ou com erro, não precisa fazer polling
    if (!this.isProcessing && (this.legislacao?.status === 'concluida' || this.legislacao?.status === 'erro')) {
      return;
    }

    this.pollingTimer = setInterval(() => {
      // Faz fetch silencioso dos dados
      this.legislacaoService.detalhar(id).subscribe({
        next: (data: any) => {
          this.ngZone.run(() => {
            const prevStatus = this.legislacao?.status;
            this.legislacao = data;
            this.processamentos = data.processamentos || [];
            this.artigos = data.artigos || [];
            if (this.artigoSelecionado) {
              const prevComentarioStatus = this.getComentarioStatus(this.artigoSelecionado);
              const atualizado = this.artigos.find((a: LegislacaoArtigo) => a.id === this.artigoSelecionado!.id);
              if (atualizado) {
                this.artigoSelecionado = atualizado;
                if (this.getComentarioStatus(atualizado) === 'concluido' && prevComentarioStatus !== 'concluido') {
                  this.carregarComentario();
                }
              }
            }

            // Se terminou o processamento, para o polling
            if (!this.isProcessing && (data.status === 'concluida' || data.status === 'erro')) {
              clearInterval(this.pollingTimer);
              this.pollingTimer = null;
            }
            this.cdr.markForCheck();
          });
        },
        error: () => {},
      });
    }, 2500);
  }

  subscribeRealtime(id: string) {
    this.realtimeChannel = this.legislacaoService.subscribeLegislacao(id, (_payload: any) => {
      this.ngZone.run(() => {
        // Recarrega os dados ao receber qualquer mudança via Realtime
        const sub = this.legislacaoService.detalhar(id).subscribe({
          next: (data: any) => {
            const prevStatus = this.legislacao?.status;
            this.legislacao = data;
            this.processamentos = data.processamentos || [];
            const novosArtigos = data.artigos || [];
            this.artigos = novosArtigos;
            if (this.artigoSelecionado) {
              const prevComentarioStatus = this.getComentarioStatus(this.artigoSelecionado);
              const atualizado = novosArtigos.find((a: LegislacaoArtigo) => a.id === this.artigoSelecionado!.id);
              if (atualizado) {
                this.artigoSelecionado = atualizado;
                if (this.getComentarioStatus(atualizado) === 'concluido' && prevComentarioStatus !== 'concluido') {
                  this.carregarComentario();
                }
              }
            }
            this.cdr.markForCheck();
          },
          error: () => {},
        });
        this.subs.push(sub);
      });
    });
  }

  selecionarArtigo(artigo: LegislacaoArtigo) {
    this.artigoSelecionado = artigo;
    this.comentarioAtivo = null;
    this.resetSecoes();
    this.carregarComentario();
  }

  resetSecoes() {
    this.secoesSelecionadas = {
      resumo: true,
      pontos_atencao: false,
      obrigacoes: false,
      pontos_importantes: false,
      direitos: false,
      termos_juridicos: false,
    };
  }

  toggleSecao(key: string) {
    this.secoesSelecionadas[key] = !this.secoesSelecionadas[key];
  }

  marcarTodasSecoes(todas: boolean) {
    if (todas) {
      this.getOpcoesDisponiveis().forEach(op => {
        this.secoesSelecionadas[op.key] = true;
      });
    } else {
      this.resetSecoes();
    }
  }

  getOpcoesDisponiveis() {
    const list = [...this.opcoesPrincipais];
    if (this.comentarioAtivo) {
      for (const cat of this.categorias) {
        if (!this.opcoesPrincipais.some(o => o.key === cat.key) && this.getCategoria(cat.key).length > 0) {
          list.push({ key: cat.key, label: cat.label, icon: cat.icon, color: cat.color });
        }
      }
    }
    return list;
  }

  getBadgeCount(key: string): number | null {
    if (key === 'resumo') return null;
    if (!this.comentarioAtivo) return null;
    if (key === 'pontos_atencao') {
      const items = this.getCategoria('pontos_atencao').length;
      const obs = this.comentarioAtivo.observacao_interpretativa ? 1 : 0;
      return items + obs;
    }
    return this.getCategoria(key).length;
  }

  temSecaoAtivaVisivel(): boolean {
    if (this.secoesSelecionadas['resumo']) return true;
    for (const key of Object.keys(this.secoesSelecionadas)) {
      if (this.secoesSelecionadas[key] && key !== 'resumo') {
        if (key === 'pontos_atencao' && this.comentarioAtivo?.observacao_interpretativa) return true;
        if (this.getCategoria(key).length > 0) return true;
      }
    }
    return false;
  }

  carregarComentario() {
    if (!this.legislacao || !this.artigoSelecionado) return;
    this.loadingComentario = true;
    const sub = this.legislacaoService.getComentario(this.legislacao.id, this.artigoSelecionado.id).subscribe({
      next: (res: any) => {
        this.comentarioAtivo = res?.data || null;
        this.loadingComentario = false;
      },
      error: () => { this.loadingComentario = false; },
    });
    this.subs.push(sub);
  }

  // -----------------------------------------------------------------------
  // Agente 3 — Analista Estratégico de Concursos
  // -----------------------------------------------------------------------

  carregarAnaliseEstrategica() {
    if (!this.legislacao || this.loadingAnaliseEstrategica) return;
    this.loadingAnaliseEstrategica = true;
    const sub = this.legislacaoService.getAnaliseEstrategica(this.legislacao.id).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.analiseEstrategica = res?.data || null;
          this.loadingAnaliseEstrategica = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.loadingAnaliseEstrategica = false;
          this.cdr.markForCheck();
        });
      },
    });
    this.subs.push(sub);
  }

  confirmarGerarAnaliseEstrategica() {
    if (!this.legislacao || this.gerandoAnaliseEstrategica) return;
    this.gerandoAnaliseEstrategica = true;
    const sub = this.legislacaoService.gerarAnaliseEstrategica(this.legislacao.id).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.analiseEstrategica = res?.data || null;
          this.gerandoAnaliseEstrategica = false;
          this.cdr.markForCheck();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.gerandoAnaliseEstrategica = false;
          this.analiseEstrategica = {
            ...(this.analiseEstrategica || {} as any),
            status: 'erro',
            erro: err?.error?.message || err?.message || 'Falha na geração da análise estratégica com o Agente 3.',
          };
          this.cdr.markForCheck();
        });
      },
    });
    this.subs.push(sub);
  }

  get artigosAnaliseFiltrados(): AnaliseArtigoConcurso[] {
    const list = this.analiseEstrategica?.analise_concurso || [];
    return list.filter(item => {
      const matchPrioridade = this.filtroPrioridadeAnalise === 'todas' || item.prioridade === this.filtroPrioridadeAnalise;
      const termo = this.buscaArtigoAnalise.toLowerCase().trim();
      const matchBusca = !termo ||
        (item.artigo_numero && item.artigo_numero.toLowerCase().includes(termo)) ||
        (item.justificativa && item.justificativa.toLowerCase().includes(termo)) ||
        (item.riscos_de_erro && item.riscos_de_erro.some(r => r.toLowerCase().includes(termo)));
      return matchPrioridade && matchBusca;
    });
  }

  get totalArtigosAltaPrioridade(): number {
    return (this.analiseEstrategica?.analise_concurso || []).filter(a => a.prioridade === 'alta').length;
  }

  get totalArtigosMediaPrioridade(): number {
    return (this.analiseEstrategica?.analise_concurso || []).filter(a => a.prioridade === 'media').length;
  }

  get totalArtigosBaixaPrioridade(): number {
    return (this.analiseEstrategica?.analise_concurso || []).filter(a => a.prioridade === 'baixa').length;
  }

  // -----------------------------------------------------------------------
  // Agente 4 — Cronograma
  // -----------------------------------------------------------------------

  carregarPlano() {
    if (!this.legislacao || this.loadingPlano) return;
    this.loadingPlano = true;
    const sub = this.legislacaoService.getPlano(this.legislacao.id).subscribe({
      next: (res: any) => {
        this.plano = res?.data || null;
        if (res?.data?.artigos_lidos && Array.isArray(res.data.artigos_lidos)) {
          for (const a of res.data.artigos_lidos) {
            this.artigosLidos.add(String(a).trim());
          }
          this.artigosLidos = new Set(this.artigosLidos);
        }
        this.loadingPlano = false;
      },
      error: () => { this.loadingPlano = false; },
    });
    this.subs.push(sub);
  }


  abrirModalPreferencias() {
    if (!this.preferencias.data_inicio) {
      this.preferencias.data_inicio = new Date().toISOString().split('T')[0];
    }
    this.modalPreferencias = true;
  }

  confirmarGerarPlano() {
    if (!this.legislacao || this.gerandoPlano) return;
    this.modalPreferencias = false;
    this.gerandoPlano = true;
    const sub = this.legislacaoService.gerarPlano(this.legislacao.id, this.preferencias).subscribe({
      next: (res: any) => {
        this.plano = res?.data || null;
        this.gerandoPlano = false;
      },
      error: (err: any) => {
        this.gerandoPlano = false;
        // Mesmo com erro o plano pode ter sido salvo com status='erro'; recarrega
        this.carregarPlano();
      },
    });
    this.subs.push(sub);
  }

  toggleBloco(id: string) {
    this.blocoExpandido = this.blocoExpandido === id ? null : id;
  }

  toggleDia(idx: number) {
    const dias = this.preferencias.dias_disponiveis || [];
    const i = dias.indexOf(idx);
    if (i >= 0) {
      this.preferencias.dias_disponiveis = dias.filter(d => d !== idx);
    } else {
      this.preferencias.dias_disponiveis = [...dias, idx].sort();
    }
  }

  isDiaSelecionado(idx: number): boolean {
    return (this.preferencias.dias_disponiveis || []).includes(idx);
  }

  get sessoesPorData(): { data: string; sessoes: SessaoEstudo[] }[] {
    if (!this.plano?.sessoes) return [];
    const map = new Map<string, SessaoEstudo[]>();
    for (const s of this.plano.sessoes) {
      if (!map.has(s.data)) map.set(s.data, []);
      map.get(s.data)!.push(s);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, sessoes]) => ({ data, sessoes }));
  }

  formatDataSessao(d: string): string {
    if (!d) return '';
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    } catch { return d; }
  }

  formatMinutos(min: number): string {
    if (!min) return '0min';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
  }

  getTotalMinutosDia(sessoes: SessaoEstudo[]): number {
    return sessoes.reduce((acc, s) => acc + (s.tempo_minutos || 0), 0);
  }

  getPrioridadeBg(p: string): string {
    return { alta: 'bg-red-500', media: 'bg-amber-500', baixa: 'bg-slate-400' }[p] || 'bg-slate-400';
  }

  getPrioridadeClass(p: string): string {
    return {
      alta: 'bg-red-500/15 text-red-600 dark:text-red-400',
      media: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      baixa: 'bg-slate-500/15 text-slate-500',
    }[p] || 'bg-slate-500/15 text-slate-500';
  }

  getTipoSessaoLabel(tipo: string): string {
    const map: Record<string, string> = {
      leitura_inicial: 'Leitura Inicial',
      estudo_detalhado: 'Estudo Detalhado',
      revisao_24h: 'Revisão 24h',
      revisao_7_dias: 'Revisão 7 dias',
      revisao_30_dias: 'Revisão 30 dias',
      revisao_final: 'Revisão Final',
      consolidacao: 'Consolidação',
    };
    return map[tipo] || tipo;
  }

  getTipoSessaoIcon(tipo: string): string {
    const map: Record<string, string> = {
      leitura_inicial: 'menu_book',
      estudo_detalhado: 'psychology',
      revisao_24h: 'replay',
      revisao_7_dias: 'replay',
      revisao_30_dias: 'replay',
      revisao_final: 'star',
      consolidacao: 'check_circle',
    };
    return map[tipo] || 'event';
  }

  getTipoSessaoIconColor(tipo: string): string {
    if (tipo.startsWith('revisao')) return 'text-purple-500';
    if (tipo === 'estudo_detalhado') return 'text-[var(--primary)]';
    if (tipo === 'consolidacao') return 'text-emerald-500';
    return 'text-amber-500';
  }

  getTipoSessaoClass(tipo: string): string {
    if (tipo.startsWith('revisao')) return 'bg-purple-500/5 border-purple-500/20';
    if (tipo === 'estudo_detalhado') return 'bg-[var(--primary)]/5 border-[var(--primary)]/20';
    if (tipo === 'consolidacao') return 'bg-emerald-500/5 border-emerald-500/20';
    return 'bg-amber-500/5 border-amber-500/20';
  }

  // -----------------------------------------------------------------------
  // Progresso de Leitura de Artigos & Cronograma
  // -----------------------------------------------------------------------

  isArtigoLido(numero: string | null | undefined): boolean {
    if (!numero) return false;
    return this.artigosLidos.has(String(numero).trim());
  }

  get totalArtigosLidos(): number {
    return this.artigosLidos.size;
  }

  get progressoLeituraPercent(): number {
    if (!this.artigos || this.artigos.length === 0) return 0;
    return Math.round((this.artigosLidos.size / this.artigos.length) * 100);
  }

  toggleArtigoLido(artigo: LegislacaoArtigo | null, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.legislacao || !artigo) return;

    const num = String(artigo.numero).trim();
    const jaLido = this.artigosLidos.has(num);
    const novoStatus = !jaLido;

    // Atualização otimista imediata na UI
    if (novoStatus) {
      this.artigosLidos.add(num);
    } else {
      this.artigosLidos.delete(num);
    }
    this.artigosLidos = new Set(this.artigosLidos);

    if (this.plano) {
      this.plano.artigos_lidos = Array.from(this.artigosLidos);
    }

    this.salvandoLido = true;
    const sub = this.legislacaoService.toggleArtigoLido(
      this.legislacao.id,
      artigo.id,
      num,
      novoStatus,
    ).subscribe({
      next: (res) => {
        this.salvandoLido = false;
        if (res?.artigos_lidos) {
          this.artigosLidos = new Set(res.artigos_lidos.map((x: any) => String(x).trim()));
          if (this.plano) this.plano.artigos_lidos = res.artigos_lidos;
        }
      },
      error: () => {
        this.salvandoLido = false;
        if (jaLido) {
          this.artigosLidos.add(num);
        } else {
          this.artigosLidos.delete(num);
        }
        this.artigosLidos = new Set(this.artigosLidos);
      },
    });
    this.subs.push(sub);
  }

  marcarLidoEAvancar() {
    if (!this.artigoSelecionado) return;
    if (!this.isArtigoLido(this.artigoSelecionado.numero)) {
      this.toggleArtigoLido(this.artigoSelecionado);
    }
    if (this.temProximoArtigo) {
      this.proximoArtigo();
    }
  }

  getArtigosLidosDoBloco(bloco: BlocoEstudo): number {
    if (!bloco?.artigos) return 0;
    return bloco.artigos.filter(a => this.isArtigoLido(a)).length;
  }

  isBlocoConcluido(bloco: BlocoEstudo): boolean {
    if (!bloco?.artigos || bloco.artigos.length === 0) return false;
    return bloco.artigos.every(a => this.isArtigoLido(a));
  }

  getBlocoProgressoPercent(bloco: BlocoEstudo): number {
    if (!bloco?.artigos || bloco.artigos.length === 0) return 0;
    const lidos = this.getArtigosLidosDoBloco(bloco);
    return Math.round((lidos / bloco.artigos.length) * 100);
  }

  getArtigosLidosDaSessao(sessao: SessaoEstudo): number {
    if (!sessao?.artigos) return 0;
    return sessao.artigos.filter(a => this.isArtigoLido(a)).length;
  }

  isSessaoConcluida(sessao: SessaoEstudo): boolean {
    if (!sessao?.artigos || sessao.artigos.length === 0) return false;
    return sessao.artigos.every(a => this.isArtigoLido(a));
  }

  get totalSessoesConcluidas(): number {
    if (!this.plano?.sessoes) return 0;
    return this.plano.sessoes.filter(s => this.isSessaoConcluida(s)).length;
  }

  get progressoSessoesPercent(): number {
    if (!this.plano?.sessoes || this.plano.sessoes.length === 0) return 0;
    return Math.round((this.totalSessoesConcluidas / this.plano.sessoes.length) * 100);
  }

  irParaArtigo(artigoNumero: string) {
    const art = this.artigos.find(a => String(a.numero).trim() === String(artigoNumero).trim());
    if (art) {
      this.selecionarArtigo(art);
      this.abaAtiva = 'artigos';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }


  reprocessarArtigo(artigo: LegislacaoArtigo) {
    if (!this.legislacao) return;
    this.reprocessando = true;
    const sub = this.legislacaoService.reprocessarArtigo(this.legislacao.id, artigo.id).subscribe({
      next: () => { this.reprocessando = false; },
      error: () => { this.reprocessando = false; },
    });
    this.subs.push(sub);
  }

  get isProcessing(): boolean {
    const s = this.legislacao?.status;
    return s === 'extraindo' || s === 'comentando';
  }

  get podeExibirProgresso(): boolean {
    if (!this.legislacao) return false;
    // Durante o processo de análise/extração, exibe para qualquer usuário
    if (this.isProcessing || this.legislacao.status !== 'concluida') {
      return true;
    }
    // Após a legislação estar concluída/salva, somente o admin pode ver
    return this.authService.isAdmin();
  }

  private getComentarioObj(artigo: LegislacaoArtigo): any {
    const c: any = artigo?.legislacao_comentarios;
    if (!c) return null;
    if (Array.isArray(c)) return c[0] || null;
    return c;
  }

  getComentarioStatus(artigo: LegislacaoArtigo): string {
    const c = this.getComentarioObj(artigo);
    return c?.status || '';
  }

  getComentarioIcon(artigo: LegislacaoArtigo): string {
    const status = this.getComentarioStatus(artigo);
    return { concluido: 'check', processando: 'sync', pendente: 'hourglass_empty', erro: 'close' }[status] || 'radio_button_unchecked';
  }

  getErroComentario(artigo: LegislacaoArtigo): string {
    const c = this.getComentarioObj(artigo);
    return c?.erro || 'Erro desconhecido';
  }

  getEtapaLabel(etapa: string): string {
    return { extracao: 'Extração de Artigos', comentarios: 'Geração de Comentários', finalizacao: 'Finalização' }[etapa] || etapa;
  }

  getPercent(p: LegislacaoProcessamento): number {
    if (!p.quantidade_total) return p.status === 'concluido' ? 100 : 0;
    return Math.round((p.quantidade_processada / p.quantidade_total) * 100);
  }

  getCategoria(key: string): any[] {
    if (!this.comentarioAtivo) return [];
    const arr = (this.comentarioAtivo as any)[key];
    return Array.isArray(arr) ? arr : [];
  }

  getItemText(item: any): string {
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
      return item.descricao || item.texto || item.prazo || item.termo || item.nome || JSON.stringify(item);
    }
    return String(item);
  }

  formatDate(d: string | null): string {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
  }

  get indiceArtigoAtual(): number {
    if (!this.artigoSelecionado || !this.artigos.length) return -1;
    return this.artigos.findIndex(a => a.id === this.artigoSelecionado!.id);
  }

  get temArtigoAnterior(): boolean {
    return this.indiceArtigoAtual > 0;
  }

  get temProximoArtigo(): boolean {
    const idx = this.indiceArtigoAtual;
    return idx >= 0 && idx < this.artigos.length - 1;
  }

  get artigoAnteriorObj(): LegislacaoArtigo | null {
    const idx = this.indiceArtigoAtual;
    return idx > 0 ? this.artigos[idx - 1] : null;
  }

  get proximoArtigoObj(): LegislacaoArtigo | null {
    const idx = this.indiceArtigoAtual;
    return (idx >= 0 && idx < this.artigos.length - 1) ? this.artigos[idx + 1] : null;
  }

  artigoAnterior() {
    const idx = this.indiceArtigoAtual;
    if (idx > 0) {
      this.selecionarArtigo(this.artigos[idx - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  proximoArtigo() {
    const idx = this.indiceArtigoAtual;
    if (idx >= 0 && idx < this.artigos.length - 1) {
      this.selecionarArtigo(this.artigos[idx + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // -----------------------------------------------------------------------
  // Agente 5 — Especialista em Concursos
  // -----------------------------------------------------------------------

  carregarMaterialConcurso() {
    if (!this.legislacao || this.loadingMaterialConcurso) return;
    this.loadingMaterialConcurso = true;
    const sub = this.legislacaoService.getMaterialConcurso(this.legislacao.id).subscribe({
      next: (res: any) => {
        this.materialConcurso = res?.data || null;
        this.carregarRespostasSalvas();
        this.loadingMaterialConcurso = false;
      },
      error: () => { this.loadingMaterialConcurso = false; },
    });
    this.subs.push(sub);
  }

  abrirModalConcursoOpcoes(modo: 'adicionar' | 'substituir' = 'adicionar') {
    this.opcoesConcurso.modo = modo;
    this.modalConcursoOpcoes = true;
  }

  confirmarGerarMaterialConcurso() {
    if (!this.legislacao) return;
    this.gerandoMaterialConcurso = true;
    this.modalConcursoOpcoes = false;

    const qtdQuestoesAntes = this.materialConcurso?.questoes?.length || 0;
    const qtdFlashcardsAntes = this.materialConcurso?.flashcards?.length || 0;

    const sub = this.legislacaoService.gerarMaterialConcurso(
      this.legislacao.id,
      this.opcoesConcurso,
    ).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.gerandoMaterialConcurso = false;
          if (res?.data) {
            this.materialConcurso = res.data;
            this.subAbaConcurso = 'questoes';

            const totalQ = res.data.questoes?.length || 0;
            const totalF = res.data.flashcards?.length || 0;
            const novasQ = this.opcoesConcurso.modo === 'adicionar' ? Math.max(0, totalQ - qtdQuestoesAntes) : totalQ;
            const novosF = this.opcoesConcurso.modo === 'adicionar' ? Math.max(0, totalF - qtdFlashcardsAntes) : totalF;

            this.feedbackGeracao = {
              novasQuestoes: novasQ,
              novosFlashcards: novosF,
              totalQuestoes: totalQ,
            };

            this.carregarRespostasSalvas();
            this.paginaAtual = 1;
          }
          this.cdr.markForCheck();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.gerandoMaterialConcurso = false;
          this.materialConcurso = {
            ...(this.materialConcurso || {} as any),
            status: 'erro',
            erro: err?.error?.message || err?.message || 'Falha na geração com o Agente 5.',
          };
          this.cdr.markForCheck();
        });
      },
    });
    this.subs.push(sub);
  }

  // --- Persistência Local de Respostas ---
  private getStorageKey(): string {
    return `aprovando_questoes_${this.legislacao?.id || 'default'}`;
  }

  carregarRespostasSalvas() {
    if (!this.legislacao?.id) return;
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.respostasUsuario) this.respostasUsuario = { ...this.respostasUsuario, ...parsed.respostasUsuario };
        if (parsed.questoesRespondidas) this.questoesRespondidas = { ...this.questoesRespondidas, ...parsed.questoesRespondidas };
        if (parsed.explicacoesAbertas) this.explicacoesAbertas = { ...this.explicacoesAbertas, ...parsed.explicacoesAbertas };
      }
    } catch (e) {
      console.warn('Erro ao ler respostas salvas do localStorage:', e);
    }
  }

  salvarRespostasLocalmente() {
    if (!this.legislacao?.id) return;
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify({
        respostasUsuario: this.respostasUsuario,
        questoesRespondidas: this.questoesRespondidas,
        explicacoesAbertas: this.explicacoesAbertas,
      }));
    } catch (e) {
      console.warn('Erro ao salvar respostas no localStorage:', e);
    }
  }

  // --- Questões e Simulado ---
  selecionarOpcaoQuestao(questaoId: string, opcao: string) {
    if (this.questoesRespondidas[questaoId]) return;
    this.respostasUsuario[questaoId] = opcao;
  }

  confirmarRespostaQuestao(questao: QuestaoConcurso) {
    if (!this.respostasUsuario[questao.id]) return;
    this.questoesRespondidas[questao.id] = true;
    this.explicacoesAbertas[questao.id] = true;
    this.salvarRespostasLocalmente();
  }

  refazerQuestao(questaoId: string) {
    delete this.questoesRespondidas[questaoId];
    delete this.respostasUsuario[questaoId];
    delete this.explicacoesAbertas[questaoId];
    this.salvarRespostasLocalmente();
  }

  toggleExplicacaoQuestao(questaoId: string) {
    this.explicacoesAbertas[questaoId] = !this.explicacoesAbertas[questaoId];
    this.salvarRespostasLocalmente();
  }

  isQuestaoAcertou(questao: QuestaoConcurso): boolean {
    const resposta = this.respostasUsuario[questao.id];
    if (!resposta) return false;
    return String(resposta).trim().toLowerCase() === String(questao.gabarito).trim().toLowerCase();
  }

  resetarSimulado() {
    this.respostasUsuario = {};
    this.questoesRespondidas = {};
    this.explicacoesAbertas = {};
    this.salvarRespostasLocalmente();
  }

  get questoesList(): QuestaoConcurso[] {
    return this.materialConcurso?.questoes || [];
  }

  get questoesFiltradas(): QuestaoConcurso[] {
    let list = this.questoesList;
    if (this.filtroTipoQuestao !== 'todos') {
      list = list.filter(q => q.tipo === this.filtroTipoQuestao);
    }
    if (this.filtroDificuldadeQuestao !== 'todos') {
      list = list.filter(q => q.dificuldade === this.filtroDificuldadeQuestao);
    }
    if (this.filtroArtigoQuestao !== 'todos') {
      list = list.filter(q => String(q.artigo_numero).trim() === String(this.filtroArtigoQuestao).trim());
    }
    if (this.filtroStatusResolucao === 'pendentes') {
      list = list.filter(q => !this.questoesRespondidas[q.id]);
    } else if (this.filtroStatusResolucao === 'resolvidas') {
      list = list.filter(q => !!this.questoesRespondidas[q.id]);
    } else if (this.filtroStatusResolucao === 'erros') {
      list = list.filter(q => !!this.questoesRespondidas[q.id] && !this.isQuestaoAcertou(q));
    }
    return list;
  }

  get questoesPaginadas(): QuestaoConcurso[] {
    const start = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.questoesFiltradas.slice(start, start + this.itensPorPagina);
  }

  get totalPaginasQuestoes(): number {
    return Math.max(1, Math.ceil(this.questoesFiltradas.length / this.itensPorPagina));
  }

  get paginasArrayQuestoes(): number[] {
    const total = this.totalPaginasQuestoes;
    const arr: number[] = [];
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  }

  mudarPaginaQuestoes(novaPagina: number) {
    if (novaPagina >= 1 && novaPagina <= this.totalPaginasQuestoes) {
      this.paginaAtual = novaPagina;
      const el = document.getElementById('secao-questoes-topo');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  getIndiceFimQuestoes(): number {
    return Math.min(this.paginaAtual * this.itensPorPagina, this.questoesFiltradas.length);
  }

  get temFiltrosQuestoesAtivos(): boolean {
    return this.filtroTipoQuestao !== 'todos' ||
           this.filtroDificuldadeQuestao !== 'todos' ||
           this.filtroArtigoQuestao !== 'todos' ||
           this.filtroStatusResolucao !== 'todas';
  }

  limparFiltrosQuestoes() {
    this.filtroTipoQuestao = 'todos';
    this.filtroDificuldadeQuestao = 'todos';
    this.filtroArtigoQuestao = 'todos';
    this.filtroStatusResolucao = 'todas';
    this.paginaAtual = 1;
  }

  onFiltroQuestaoChange() {
    this.paginaAtual = 1;
  }

  getDesempenhoArtigo(artigoNumero: string | number | undefined) {
    if (!artigoNumero) return null;
    const num = String(artigoNumero).trim();
    const questoesDoArt = (this.materialConcurso?.questoes || []).filter(q => String(q.artigo_numero).trim() === num);
    if (!questoesDoArt.length) return null;
    const respondidas = questoesDoArt.filter(q => !!this.questoesRespondidas[q.id]);
    const acertos = respondidas.filter(q => this.isQuestaoAcertou(q));
    return {
      total: questoesDoArt.length,
      respondidas: respondidas.length,
      acertos: acertos.length,
      percentual: respondidas.length > 0 ? Math.round((acertos.length / respondidas.length) * 100) : null,
    };
  }

  get totalQuestoesRespondidas(): number {
    return Object.keys(this.questoesRespondidas).filter(id => this.questoesRespondidas[id]).length;
  }

  get totalQuestoesAcertos(): number {
    return this.questoesList.filter(q => this.questoesRespondidas[q.id] && this.isQuestaoAcertou(q)).length;
  }

  get totalQuestoesErros(): number {
    return this.questoesList.filter(q => this.questoesRespondidas[q.id] && !this.isQuestaoAcertou(q)).length;
  }

  get percentualAcertos(): number {
    if (this.totalQuestoesRespondidas === 0) return 0;
    return Math.round((this.totalQuestoesAcertos / this.totalQuestoesRespondidas) * 100);
  }

  // --- Flashcards ---
  get flashcardsList(): FlashcardConcurso[] {
    return this.materialConcurso?.flashcards || [];
  }

  get flashcardAtual(): FlashcardConcurso | null {
    if (!this.flashcardsList.length) return null;
    const idx = Math.max(0, Math.min(this.indiceFlashcardAtual, this.flashcardsList.length - 1));
    return this.flashcardsList[idx] || null;
  }

  virarFlashcard() {
    this.flashcardVirado = !this.flashcardVirado;
  }

  proximoFlashcard() {
    if (this.indiceFlashcardAtual < this.flashcardsList.length - 1) {
      this.indiceFlashcardAtual++;
      this.flashcardVirado = false;
    }
  }

  anteriorFlashcard() {
    if (this.indiceFlashcardAtual > 0) {
      this.indiceFlashcardAtual--;
      this.flashcardVirado = false;
    }
  }

  marcarFlashcardStatus(id: string, status: 'dominado' | 'revisar') {
    this.flashcardsStatus[id] = status;
    if (this.indiceFlashcardAtual < this.flashcardsList.length - 1) {
      this.proximoFlashcard();
    }
  }

  embaralharFlashcards() {
    if (!this.materialConcurso?.flashcards) return;
    const arr = [...this.materialConcurso.flashcards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.materialConcurso.flashcards = arr;
    this.indiceFlashcardAtual = 0;
    this.flashcardVirado = false;
  }

  get totalFlashcardsDominados(): number {
    return Object.values(this.flashcardsStatus).filter(s => s === 'dominado').length;
  }

  get totalFlashcardsRevisar(): number {
    return Object.values(this.flashcardsStatus).filter(s => s === 'revisar').length;
  }

  get artigosComQuestoes(): string[] {
    const set = new Set<string>();
    this.questoesList.forEach(q => { if (q.artigo_numero) set.add(String(q.artigo_numero)); });
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }

  getAlternativaTexto(q: QuestaoConcurso, optKey: string): string {
    if (!q?.alternativas) return '';
    return (q.alternativas as any)[optKey] || '';
  }

  getJustificativaAlternativa(q: QuestaoConcurso, altKey: string): string | null {
    if (!q?.justificativas_alternativas) return null;
    return (q.justificativas_alternativas as any)[altKey] || null;
  }
}
