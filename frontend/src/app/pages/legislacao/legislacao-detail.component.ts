import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  LegislacaoService, Legislacao, LegislacaoArtigo,
  LegislacaoComentario, LegislacaoProcessamento, LegislacaoPlano, PreferenciasEstudante,
  BlocoEstudo, SessaoEstudo,
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
                <h1 class="text-sm font-black text-[var(--on-surface)] line-clamp-2 leading-snug" [title]="legislacao?.titulo">
                  {{ legislacao?.titulo }}
                </h1>
              </div>
            </div>
            <button (click)="router.navigate(['/legislacao'])"
              title="Voltar para a lista"
              class="btn-neo px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 text-[var(--primary)] flex-shrink-0">
              <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
              <span class="hidden sm:inline">Voltar</span>
            </button>
          </div>

          <div class="flex items-center justify-between gap-2 pt-2 border-t border-[var(--outline-variant)]/30 text-xs">
            <span class="text-[var(--on-surface-variant)] truncate">
              {{ legislacao?.tipo }} {{ legislacao?.numero ? 'nº ' + legislacao?.numero : '' }}{{ legislacao?.ano ? '/' + legislacao?.ano : '' }}
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex-shrink-0"
              [style.background-color]="legislacaoService.getStatusColor(legislacao.status) + '15'"
              [style.color]="legislacaoService.getStatusColor(legislacao.status)"
              [style.border-color]="legislacaoService.getStatusColor(legislacao.status) + '40'">
              <span *ngIf="isProcessing" class="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                [style.background-color]="legislacaoService.getStatusColor(legislacao.status)"></span>
              {{ legislacaoService.getStatusLabel(legislacao?.status || 'pendente') }}
            </span>
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
                    'bg-slate-200 text-slate-500': !getComentarioStatus(artigoSelecionado)
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
                <button *ngFor="let artigo of artigosFiltrados"
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
                        'bg-slate-200 text-slate-500': !getComentarioStatus(artigo)
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
        <div *ngFor="let p of processamentos" class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-[var(--on-surface)] flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                [ngClass]="{
                  'bg-emerald-500 text-white': p.status === 'concluido',
                  'bg-amber-500 text-white': p.status === 'processando',
                  'bg-red-500 text-white': p.status === 'erro',
                  'bg-slate-200 text-slate-500': p.status === 'pendente'
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
      <!-- ABA SWITCHER: Artigos / Cronograma                           -->
      <!-- ============================================================ -->
      <div *ngIf="!loading && legislacao" class="mb-4">
        <div class="inline-flex bg-[var(--surface-container-low)] rounded-2xl p-1 gap-1">
          <button (click)="abaAtiva = 'artigos'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            [ngClass]="abaAtiva === 'artigos'
              ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">article</span>
              Artigos
            </span>
          </button>
          <button (click)="abaAtiva = 'cronograma'; carregarPlano()"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            [ngClass]="abaAtiva === 'cronograma'
              ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">calendar_month</span>
              Cronograma
              <span *ngIf="plano?.status === 'concluido'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </span>
          </button>
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
                class="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <span *ngIf="gerandoPlano" class="material-symbols-outlined !text-[16px] animate-spin">sync</span>
                {{ gerandoPlano ? 'Gerando...' : 'Gerar Cronograma' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Estado: Sem plano ainda -->
        <div *ngIf="!loadingPlano && !plano" class="neo-raised rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-[var(--card-bg)]">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5d3bf6]/20 to-[#7c3aed]/20 flex items-center justify-center">
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
            class="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-2">
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
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border select-none active:scale-95"
                    [ngClass]="isArtigoLido(art)
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 shadow-sm'
                      : 'bg-[var(--primary)]/10 border-transparent text-[var(--primary)] hover:bg-[var(--primary)]/20'">
                    <span *ngIf="isArtigoLido(art)" class="material-symbols-outlined !text-[12px] text-emerald-500">check</span>
                    Art. {{ art }}
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
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all border select-none active:scale-95"
                          [ngClass]="isArtigoLido(art)
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/25'
                            : 'bg-[var(--surface-container)] border-transparent text-[var(--on-surface-variant)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'">
                          <span *ngIf="isArtigoLido(art)" class="material-symbols-outlined !text-[11px] text-emerald-500">check</span>
                          Art. {{ art }}
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
            <div class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm font-black text-[var(--on-surface)] flex items-center gap-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-[#7c3aed]/15 text-[#7c3aed] dark:text-purple-300">Art. {{ artigoSelecionado.numero }}</span>
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
                    class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm select-none active:scale-95"
                    [ngClass]="isArtigoLido(artigoSelecionado.numero)
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)]/40 text-[var(--on-surface-variant)] hover:border-emerald-500/50 hover:text-emerald-600 hover:bg-emerald-500/5'">
                    <span class="material-symbols-outlined !text-[16px]"
                      [class.text-emerald-500]="isArtigoLido(artigoSelecionado.numero)">
                      {{ isArtigoLido(artigoSelecionado.numero) ? 'check_circle' : 'radio_button_unchecked' }}
                    </span>
                    {{ isArtigoLido(artigoSelecionado.numero) ? 'Artigo Lido' : 'Marcar como Lido' }}
                  </button>

                  <button *ngIf="getComentarioStatus(artigoSelecionado) === 'erro'"
                    (click)="reprocessarArtigo(artigoSelecionado)"
                    [disabled]="reprocessando"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all disabled:opacity-50">
                    <span class="material-symbols-outlined !text-[16px]" [class.animate-spin]="reprocessando">refresh</span>
                    {{ reprocessando ? 'Reprocessando...' : 'Retry' }}
                  </button>
                </div>
              </div>

              <div class="rounded-xl p-4 bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40">
                <p class="text-sm text-[var(--on-surface)] leading-relaxed whitespace-pre-wrap text-justify">{{ artigoSelecionado.texto_original }}</p>
              </div>

              <!-- Seletor de opções em Checkbox no Card do Artigo -->
              <div class="mt-2 pt-3 border-t border-[var(--outline-variant)]/30 flex flex-col gap-2.5">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <span class="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined !text-[15px] text-[var(--primary)]">checklist</span>
                    Seções para Exibir
                  </span>
                  <div class="flex items-center gap-2">
                    <button type="button" (click)="marcarTodasSecoes(true)"
                      class="text-[11px] font-semibold text-[var(--primary)] hover:underline">
                      Marcar todos
                    </button>
                    <span class="text-xs text-[var(--outline-variant)]">|</span>
                    <button type="button" (click)="marcarTodasSecoes(false)"
                      class="text-[11px] font-semibold text-[var(--on-surface-variant)] hover:underline">
                      Apenas Resumo
                    </button>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <label *ngFor="let op of getOpcoesDisponiveis()"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all border"
                    [ngClass]="secoesSelecionadas[op.key]
                      ? 'shadow-sm font-bold'
                      : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container)] opacity-80 hover:opacity-100'"
                    [style.backgroundColor]="secoesSelecionadas[op.key] ? op.color + '18' : ''"
                    [style.borderColor]="secoesSelecionadas[op.key] ? op.color + '55' : ''"
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

              <!-- Relevância + Confiança + Resumo -->
              <div *ngIf="secoesSelecionadas['resumo']" class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-4">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    [ngClass]="{
                      'bg-red-500/15 text-red-600 dark:text-red-400': comentarioAtivo.relevancia_concurso === 'alta',
                      'bg-amber-500/15 text-amber-600 dark:text-amber-400': comentarioAtivo.relevancia_concurso === 'media',
                      'bg-slate-500/15 text-slate-500': comentarioAtivo.relevancia_concurso === 'baixa'
                    }">
                    <span class="material-symbols-outlined !text-[14px]">school</span>
                    Relevância {{ legislacaoService.getRelevanciaLabel(comentarioAtivo.relevancia_concurso) }}
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <span class="material-symbols-outlined !text-[14px]">verified</span>
                    Confiança {{ legislacaoService.getRelevanciaLabel(comentarioAtivo.grau_confianca) }}
                  </span>
                </div>

                <!-- Resumo -->
                <div class="flex flex-col gap-1">
                  <p class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider">Resumo</p>
                  <p class="text-sm font-semibold text-[var(--on-surface)]">{{ comentarioAtivo.resumo }}</p>
                </div>

                <!-- Explicação simples -->
                <div *ngIf="comentarioAtivo.explicacao_simples" class="flex flex-col gap-1">
                  <p class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider">Em linguagem simples</p>
                  <p class="text-sm text-[var(--on-surface)] leading-relaxed text-justify">{{ comentarioAtivo.explicacao_simples }}</p>
                </div>

                <!-- Comentário técnico / Análise Técnica -->
                <div *ngIf="comentarioAtivo.comentario_tecnico"
                  class="rounded-xl p-4 bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/40 border-l-4 border-l-[var(--primary)] flex flex-col gap-2">
                  <p class="text-xs font-black text-[var(--primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined !text-[15px]">analytics</span>
                    Análise Técnica
                  </p>
                  <p class="text-sm text-[var(--on-surface)] leading-relaxed text-justify">
                    {{ comentarioAtivo.comentario_tecnico }}
                  </p>
                </div>
              </div>

              <!-- Listas categorizadas -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ng-container *ngFor="let categoria of categorias">
                  <div *ngIf="secoesSelecionadas[categoria.key] && getCategoria(categoria.key).length > 0"
                    class="neo-raised rounded-xl p-4 bg-[var(--card-bg)] flex flex-col gap-2">
                    <p class="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                      [style.color]="categoria.color">
                      <span class="material-symbols-outlined !text-[14px]">{{ categoria.icon }}</span>
                      {{ categoria.label }}
                    </p>
                    <ul class="space-y-1.5">
                      <li *ngFor="let item of getCategoria(categoria.key)"
                        class="text-xs text-[var(--on-surface)] flex items-start gap-2">
                        <span class="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white"
                          [style.background-color]="categoria.color">
                          <span class="material-symbols-outlined !text-[10px]">{{ categoria.itemIcon }}</span>
                        </span>
                        <span class="leading-snug">{{ getItemText(item) }}</span>
                      </li>
                    </ul>
                  </div>
                </ng-container>
              </div>

              <!-- Exemplo prático -->
              <div *ngIf="secoesSelecionadas['resumo'] && comentarioAtivo.exemplo_pratico"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-2">
                <p class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined !text-[14px] text-[var(--tertiary)]">lightbulb</span>
                  Exemplo Prático
                </p>
                <p class="text-sm text-[var(--on-surface)] leading-relaxed bg-[var(--tertiary)]/8 border border-[var(--tertiary)]/20 rounded-xl p-4">
                  {{ comentarioAtivo.exemplo_pratico }}
                </p>
              </div>

              <!-- Observação interpretativa (vinculada à seção Atenção) -->
              <div *ngIf="secoesSelecionadas['pontos_atencao'] && comentarioAtivo.observacao_interpretativa"
                class="neo-raised rounded-2xl p-5 bg-[var(--card-bg)] flex flex-col gap-2">
                <p class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined !text-[14px] text-amber-500">warning_amber</span>
                  Atenção — Observação Interpretativa
                </p>
                <p class="text-sm text-[var(--on-surface)] leading-relaxed border-l-2 border-amber-400/60 pl-3">
                  {{ comentarioAtivo.observacao_interpretativa }}
                </p>
              </div>

              <!-- Mensagem quando nenhuma seção está selecionada/visível -->
              <div *ngIf="!temSecaoAtivaVisivel()"
                class="neo-raised rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2 bg-[var(--card-bg)]">
                <span class="material-symbols-outlined !text-[36px] text-[var(--on-surface-variant)]/40">tune</span>
                <p class="text-sm font-bold text-[var(--on-surface)]">Nenhuma seção selecionada</p>
                <p class="text-xs text-[var(--on-surface-variant)] max-w-sm">
                  Utilize os checkboxes no card do artigo para ativar as seções que deseja estudar (Resumo, Atenção, Obrigações, etc.).
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
                    ? 'bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white border-transparent hover:opacity-95 shadow-md active:scale-95'
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


  // Agente 3 — Cronograma
  abaAtiva: 'artigos' | 'cronograma' = 'artigos';
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
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.carregar(id);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.legislacaoService.unsubscribe(this.realtimeChannel);
  }

  carregar(id: string) {
    this.loading = true;
    const sub = this.legislacaoService.detalhar(id).subscribe({
      next: (data: any) => {
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
        // Pré-carrega o plano de cronograma se existir
        this.carregarPlano();
        // Inicia Realtime
        this.subscribeRealtime(id);
      },
      error: () => { this.loading = false; },
    });
    this.subs.push(sub);
  }


  subscribeRealtime(id: string) {
    this.realtimeChannel = this.legislacaoService.subscribeLegislacao(id, (_payload: any) => {
      // Recarrega os dados ao receber qualquer mudança
      const sub = this.legislacaoService.detalhar(id).subscribe({
        next: (data: any) => {
          const prevStatus = this.legislacao?.status;
          this.legislacao = data;
          this.processamentos = data.processamentos || [];
          const novosArtigos = data.artigos || [];
          // Atualiza artigos mantendo a seleção
          this.artigos = novosArtigos;
          if (this.artigoSelecionado) {
            const atualizado = novosArtigos.find((a: LegislacaoArtigo) => a.id === this.artigoSelecionado!.id);
            if (atualizado) {
              this.artigoSelecionado = atualizado;
              // Se o comentário do artigo selecionado ficou concluído, recarrega
              if (this.getComentarioStatus(atualizado) === 'concluido' && prevStatus !== 'concluida') {
                this.carregarComentario();
              }
            }
          }
        },
        error: () => {},
      });
      this.subs.push(sub);
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
  // Agente 3 — Cronograma
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
}
