import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService } from '../../services/theme.service';

export interface CheckedItemState {
  [key: string]: boolean;
}

@Component({
  selector: 'app-disciplines-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen w-full bg-[var(--background)] text-[var(--on-surface)] transition-colors duration-300">
      <div class="max-w-7xl mx-auto p-4 md:p-8">
      <!-- Back Navigation & Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
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

        <div class="flex items-center gap-2 flex-wrap">
          <span class="bg-[var(--secondary)]/15 text-[var(--secondary)] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
            <span class="material-symbols-outlined !text-[14px]">grid_view</span>
            Mapa das Disciplinas
          </span>
        </div>
      </div>

      <!-- Main Edital Info Card -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8 space-y-4">
        <!-- Top Row: Badges (Left) & Action Buttons: Cronograma + Pareto (Right) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--outline-variant)]/30">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-[var(--primary)]/15 text-[var(--primary)] text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
              <span class="material-symbols-outlined !text-[13px]">emoji_events</span>
              {{ edital?.concurso || 'Edital Oficial' }}
            </span>
            <span *ngIf="edital?.cargo" class="bg-[var(--secondary)]/15 text-[var(--secondary)] text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
              <span class="material-symbols-outlined !text-[13px]">badge</span>
              {{ edital.cargo }}
            </span>
          </div>

          <!-- Action Buttons on Top Right of Card -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <!-- Botão Cronograma (leva para /sprints se feito ou abre gerador se não) -->
            <button
               (click)="handleCronogramaClick()"
               class="btn-neo px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-[var(--on-surface)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all cursor-pointer shadow-xs"
               [title]="hasSchedule ? 'Abrir Cronograma de Estudos' : 'Configurar e Gerar Cronograma de Estudos'">
              <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">
                {{ hasSchedule ? 'calendar_month' : 'calendar_add_on' }}
              </span>
              <span class="whitespace-nowrap">{{ hasSchedule ? 'Ver Cronograma' : 'Gerar Cronograma' }}</span>
            </button>

            <!-- Botão Ver Pareto (se já analisado) -->
            <a *ngIf="paretoData?.pareto_analisado"
               [routerLink]="['/pareto', editalId]"
               class="btn-mesh px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
               title="Ver Relatório Pareto 80/20">
              <span class="material-symbols-outlined !text-[16px]">donut_large</span>
              <span class="whitespace-nowrap">Ver Pareto</span>
            </a>

            <!-- Botão Executar Análise de Pareto (se ainda não analisado) -->
            <button *ngIf="!paretoData?.pareto_analisado"
                    (click)="runParetoAnalysis()"
                    [disabled]="isAnalyzingPareto"
                    class="bg-gradient-to-r from-[#433fe5] to-[#6b38d4] text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Executar Análise de Pareto com IA">
              <span class="material-symbols-outlined !text-[16px]" [class.animate-spin]="isAnalyzingPareto">donut_large</span>
              <span class="whitespace-nowrap">{{ isAnalyzingPareto ? 'Analisando...' : 'Análise de Pareto' }}</span>
            </button>
          </div>
        </div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl md:text-3xl font-black text-[var(--on-surface)] mb-2">Mapa Geral das Disciplinas</h1>
            <p class="text-xs text-[var(--on-surface-variant)] font-medium">Visão estruturada de todo o conteúdo programático do edital em 3 camadas (Disciplinas, Tópicos e Subtópicos) gerada automaticamente a partir do edital.</p>
          </div>

          <!-- Overall Progress Card -->
          <div class="neo-pressed rounded-2xl p-5 min-w-[240px] text-center">
            <p class="text-xs font-extrabold text-[var(--on-surface-variant)] mb-1">Progresso Geral do Edital</p>
            <div class="text-3xl font-black text-[var(--primary)] mb-2">{{ totalProgressPercentage }}%</div>
            <div class="w-full h-2.5 bg-[var(--surface-container-high)] rounded-full overflow-hidden p-0.5">
              <div class="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--tertiary-container)] rounded-full transition-all duration-500"
                   [style.width.%]="totalProgressPercentage"></div>
            </div>
            <p class="text-[10px] text-[var(--on-surface-variant)] font-semibold mt-2">
              <strong>{{ totalCompletedItems }}</strong> de <strong>{{ totalCheckableItems }}</strong> assuntos concluídos
            </p>
          </div>
        </div>

        <!-- Stat Badges Row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--outline-variant)]/40">
          <div class="neo-pressed rounded-xl p-3 text-center">
            <span class="text-[10px] font-extrabold text-[var(--on-surface-variant)] block">Disciplinas Totais</span>
            <span class="text-lg font-black text-[var(--on-surface)]">{{ allDisciplines.length }}</span>
          </div>
          <div class="neo-pressed rounded-xl p-3 text-center">
            <span class="text-[10px] font-extrabold text-[var(--on-surface-variant)] block">Prioritárias (20% Pareto)</span>
            <span class="text-lg font-black text-[var(--primary)]">{{ paretoData?.high_priority_subjects || specificDisciplines.length }}</span>
          </div>
          <div class="neo-pressed rounded-xl p-3 text-center">
            <span class="text-[10px] font-extrabold text-[var(--on-surface-variant)] block">Cobertura Estimada</span>
            <span class="text-lg font-black text-[#00845a] dark:text-[#4edea3]">{{ paretoData?.coverage_percentage || 80 }}%</span>
          </div>
          <div class="neo-pressed rounded-xl p-3 text-center">
            <span class="text-[10px] font-extrabold text-[var(--on-surface-variant)] block">Tópicos Quentes 🔥</span>
            <span class="text-lg font-black text-[var(--error)]">{{ paretoData?.total_hot_topics || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Controls & Search Bar -->
      <div class="neo-raised rounded-3xl p-6 mb-8 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <!-- Search input -->
          <div class="md:col-span-5 neo-pressed rounded-2xl p-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[20px]">search</span>
            <input
              [(ngModel)]="searchQuery"
              type="text"
              placeholder="Buscar disciplina, tópico ou assunto..."
              class="w-full bg-transparent border-none outline-none text-xs md:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)] font-medium">
          </div>

          <!-- Filter Category (Básicas / Específicas / Todas) -->
          <div class="md:col-span-4 flex gap-1.5 bg-[var(--surface-container)] p-1 rounded-xl">
            <button
              (click)="categoryFilter = 'todas'"
              [ngClass]="categoryFilter === 'todas' ? 'bg-[var(--card-bg)] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
              class="flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all">
              Todas ({{ allDisciplines.length }})
            </button>
            <button
              (click)="categoryFilter = 'basicas'"
              [ngClass]="categoryFilter === 'basicas' ? 'bg-[var(--card-bg)] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
              class="flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all">
              Básicas ({{ basicDisciplines.length }})
            </button>
            <button
              (click)="categoryFilter = 'especificas'"
              [ngClass]="categoryFilter === 'especificas' ? 'bg-[var(--card-bg)] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
              class="flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all">
              Específicas ({{ specificDisciplines.length }})
            </button>
          </div>

          <!-- Status Filter -->
          <div class="md:col-span-3 flex gap-2 justify-end">
            <select
              [(ngModel)]="statusFilter"
              class="bg-[var(--card-bg)] border border-[var(--outline-variant)] rounded-xl text-xs font-bold px-3 py-2 text-[var(--on-surface)] outline-none cursor-pointer">
              <option value="todos">Todos os Status</option>
              <option value="pendentes">Apenas Pendentes</option>
              <option value="concluidos">Apenas Concluídos</option>
            </select>
          </div>
        </div>

        <!-- Secondary Controls Bar -->
        <div class="flex items-center justify-between text-xs text-[var(--on-surface-variant)] font-semibold pt-2 border-t border-[var(--outline-variant)]/40 flex-wrap gap-2">
          <div class="flex items-center gap-3">
            <button (click)="expandAll()" class="hover:text-[var(--primary)] text-[var(--on-surface-variant)] font-extrabold flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">unfold_more</span>
              Expandir Tudo
            </button>
            <span>•</span>
            <button (click)="collapseAll()" class="hover:text-[var(--primary)] text-[var(--on-surface-variant)] font-extrabold flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">unfold_less</span>
              Recolher Tudo
            </button>
          </div>

          <div class="flex items-center gap-3">
            <button (click)="reanalyzeMapaGeral()" [disabled]="isReanalyzing" class="text-[var(--primary)] hover:underline font-extrabold flex items-center gap-1 disabled:opacity-50">
              <span class="material-symbols-outlined !text-[15px]" [class.animate-spin]="isReanalyzing">autorenew</span>
              <span>{{ isReanalyzing ? 'Reanalisando Mapa Geral...' : 'Reanalisar / Refazer Mapa' }}</span>
            </button>
            <span>•</span>
            <button (click)="resetChecklist()" class="text-[var(--error)] hover:underline font-extrabold flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">restart_alt</span>
              Resetar Progresso
            </button>
          </div>
        </div>
      </div>

      <!-- Control Bar View Mode Toggle (Tabela vs Cards) -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-[var(--on-surface)]">Modo de Visualização:</span>
          <div class="flex items-center gap-1 bg-[var(--surface-container)] p-1 rounded-xl">
            <button (click)="changeViewMode('table')" [ngClass]="viewMode === 'table' ? 'bg-[var(--card-bg)] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">table_chart</span>
              <span>Tabela Tática</span>
            </button>
            <button (click)="changeViewMode('cards')" [ngClass]="viewMode === 'cards' ? 'bg-[var(--card-bg)] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">view_agenda</span>
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW MODE 1: TABELA ESTRUTURADA DE CONTEÚDOS (3 CAMADAS) -->
      <div *ngIf="viewMode === 'table' && filteredDisciplines.length > 0" class="neo-raised rounded-3xl p-4 md:p-6 mb-8 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr class="bg-[var(--surface-container-high)] text-[var(--on-surface)] text-[11px] font-black uppercase tracking-wider border-b border-[var(--outline-variant)]">
                <th class="py-3.5 px-4 w-16 text-center">Status</th>
                <th class="py-3.5 px-4 w-3/12">Tópico (Camada 2)</th>
                <th class="py-3.5 px-4 w-1/2">Subtópico / Assunto (Camada 3)</th>
                <th class="py-3.5 px-1 w-20 text-center">CB</th>
                <th class="py-3.5 px-1 w-20 text-center">Métricas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--outline-variant)]/40 text-xs">
              <ng-container *ngFor="let disc of filteredDisciplines">
                <!-- Disciplina (Camada 1) — Linha Única por Disciplina -->
                <tr class="bg-[var(--surface-container-low)] font-bold text-[var(--on-surface)] border-y border-[var(--outline-variant)]/60">
                  <td colspan="5" class="py-3.5 px-4">
                    <div class="flex items-center justify-between flex-wrap gap-3">
                      <div class="flex items-center gap-2.5">
                        <span [ngClass]="disc.isBasica ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'bg-[var(--secondary)]/15 text-[var(--secondary)]'" class="text-[10px] font-black uppercase px-2.5 py-1 rounded">
                          {{ disc.isBasica ? 'Básica' : 'Específica' }}
                        </span>
                        <span *ngIf="disc.prioridade" [ngClass]="{
                          'bg-[#00845a]/15 text-[#00845a] dark:bg-[#4edea3]/20 dark:text-[#4edea3]': disc.prioridade === 'PRIORITÁRIA',
                          'bg-[var(--secondary)]/15 text-[var(--secondary)]': disc.prioridade === 'COMPLEMENTAR',
                          'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)]': disc.prioridade === 'RESIDUAL'
                        }" class="text-[10px] font-black uppercase px-2.5 py-1 rounded">
                          {{ disc.prioridade === 'PRIORITÁRIA' ? '🔥 20% PARETO' : disc.prioridade }}
                        </span>
                        <span class="text-base font-black text-[var(--on-surface)]">{{ disc.nome }}</span>
                      </div>
                      <div class="flex items-center gap-4 text-xs">
                        <span *ngIf="disc.percentual_questoes" class="text-[var(--on-surface-variant)] font-semibold">~{{ disc.percentual_questoes }}% questões</span>
                        <span *ngIf="disc.percentual_tempo" class="text-[var(--secondary)] font-bold">⏳ {{ disc.percentual_tempo }}% tempo</span>
                        <span class="text-[var(--primary)] font-extrabold bg-[var(--card-bg)] px-3 py-1 rounded-xl border border-[var(--outline-variant)]/60 shadow-sm">
                          {{ getDisciplineCompletedCount(disc) }}/{{ getDisciplineTotalCheckableCount(disc) }} assuntos ({{ getDisciplineProgressPercentage(disc) }}%)
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Tópicos (Camada 2) e Subtópicos (Camada 3) -->
                <ng-container *ngFor="let topic of disc.camada_2_topicos">
                  
                  <!-- Caso 1: Sem subtópicos (Camada 3 vazia) -->
                  <tr *ngIf="!topic.camada_3_subtopicos || topic.camada_3_subtopicos.length === 0"
                      class="hover:bg-[var(--surface-container-low)]/80 transition-colors border-b border-[var(--outline-variant)]/20"
                      [ngClass]="{ 'bg-[#eefff2]/20 dark:bg-[#005236]/20': isTopicChecked(disc.nome, topic) }">
                    <td class="py-3 px-4 text-center align-top pt-3.5">
                      <input
                        type="checkbox"
                        [checked]="isTopicChecked(disc.nome, topic)"
                        (change)="toggleTopicCheck(disc.nome, topic, $event)"
                        class="w-5 h-5 accent-[var(--primary)] cursor-pointer rounded transition-transform hover:scale-110"
                        title="Concluir Tópico (Camada 2)">
                    </td>
                    <td class="py-3 px-4 align-top">
                      <div class="flex items-start gap-2 flex-wrap">
                        <span [class]="getTopicBadgeClass(topic.temperatura)" class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                          {{ topic.temperatura || 'GERAL' }}
                        </span>
                        <span class="font-bold text-sm text-[var(--on-surface)]" [class.line-through]="isTopicChecked(disc.nome, topic)" [class.opacity-60]="isTopicChecked(disc.nome, topic)">
                          {{ topic.nome }}
                        </span>
                      </div>
                      <p *ngIf="topic.frequencia_historica" class="text-[11px] text-[var(--on-surface-variant)] mt-1 font-medium">
                        Frequência: {{ topic.frequencia_historica }}
                      </p>
                      <!-- Barra de Progresso do Tópico (Camada 2) -->
                      <div class="mt-2.5 pt-2 border-t border-[var(--outline-variant)]/20">
                        <div class="flex items-center justify-between text-[10px] font-extrabold mb-1">
                          <span class="text-[var(--on-surface-variant)]">Progresso</span>
                          <span class="text-[var(--primary)] font-black">{{ getTopicProgressPercentage(disc.nome, topic) }}%</span>
                        </div>
                        <div class="w-full h-1.5 bg-[var(--surface-container-high)] rounded-full overflow-hidden p-0.5">
                          <div class="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--tertiary-container)] rounded-full transition-all duration-300"
                               [style.width.%]="getTopicProgressPercentage(disc.nome, topic)"></div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4 align-top text-xs text-[var(--on-surface-variant)] italic">
                      Estudo completo do tópico
                    </td>
                    <td class="py-3 px-3 text-center align-middle"></td>
                    <td class="py-3 px-3 text-center align-middle"></td>
                  </tr>

                  <!-- Caso 2: Com subtópicos (Uma linha (tr) por subtópico) -->
                  <ng-container *ngIf="topic.camada_3_subtopicos && topic.camada_3_subtopicos.length > 0">
                    <tr *ngFor="let sub of topic.camada_3_subtopicos; let i = index; let last = last"
                        class="hover:bg-[var(--surface-container-low)]/80 transition-colors"
                        [ngClass]="{ 
                          'bg-[#eefff2]/20 dark:bg-[#005236]/20': isTopicChecked(disc.nome, topic),
                          'border-b border-[var(--outline-variant)]/20': last 
                        }">
                      
                      <!-- Coluna 1 & 2 (aparecem apenas na primeira linha, com rowspan) -->
                      <td *ngIf="i === 0" [attr.rowspan]="topic.camada_3_subtopicos.length" class="py-3 px-4 text-center align-top pt-3.5 border-b border-[var(--outline-variant)]/20">
                        <input
                          type="checkbox"
                          [checked]="isTopicChecked(disc.nome, topic)"
                          (change)="toggleTopicCheck(disc.nome, topic, $event)"
                          class="w-5 h-5 accent-[var(--primary)] cursor-pointer rounded transition-transform hover:scale-110"
                          title="Concluir Tópico (Camada 2)">
                      </td>
                      <td *ngIf="i === 0" [attr.rowspan]="topic.camada_3_subtopicos.length" class="py-3 px-4 align-top border-b border-[var(--outline-variant)]/20">
                        <div class="flex items-start gap-2 flex-wrap">
                          <span [class]="getTopicBadgeClass(topic.temperatura)" class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                            {{ topic.temperatura || 'GERAL' }}
                          </span>
                          <span class="font-bold text-sm text-[var(--on-surface)]" [class.line-through]="isTopicChecked(disc.nome, topic)" [class.opacity-60]="isTopicChecked(disc.nome, topic)">
                            {{ topic.nome }}
                          </span>
                        </div>
                        <p *ngIf="topic.frequencia_historica" class="text-[11px] text-[var(--on-surface-variant)] mt-1 font-medium">
                          Frequência: {{ topic.frequencia_historica }}
                        </p>
                        <!-- Barra de Progresso do Tópico (Camada 2) -->
                        <div class="mt-2.5 pt-2 border-t border-[var(--outline-variant)]/20">
                          <div class="flex items-center justify-between text-[10px] font-extrabold mb-1 gap-1">
                            <span class="text-[var(--on-surface-variant)] font-semibold truncate">
                              {{ getTopicCompletedCount(disc.nome, topic) }}/{{ getTopicTotalCount(topic) }} assuntos
                            </span>
                            <span class="text-[var(--primary)] font-black shrink-0">{{ getTopicProgressPercentage(disc.nome, topic) }}%</span>
                          </div>
                          <div class="w-full h-1.5 bg-[var(--surface-container-high)] rounded-full overflow-hidden p-0.5">
                            <div class="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--tertiary-container)] rounded-full transition-all duration-300"
                                 [style.width.%]="getTopicProgressPercentage(disc.nome, topic)"></div>
                          </div>
                        </div>
                      </td>

                      <!-- Coluna 3: Subtópico / Assunto -->
                      <td class="py-2.5 px-4 align-middle" [ngClass]="{'border-b border-[var(--outline-variant)]/10': !last}">
                        <div class="flex items-start gap-2 text-[13px] leading-snug">
                          <input
                            type="checkbox"
                            [checked]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))"
                            (change)="toggleSubtopicCheck(disc.nome, topic, sub.nome)"
                            class="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer rounded mt-0.5 shrink-0">
                          <div>
                            <span class="font-semibold text-[var(--on-surface)]" [class.line-through]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))" [class.opacity-60]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))">
                              {{ sub.nome }}
                            </span>
                            <p *ngIf="sub.justificativa" class="text-[11px] text-[var(--on-surface-variant)] italic mt-0.5">
                              {{ sub.justificativa }}
                            </p>
                          </div>
                        </div>
                      </td>

                      <!-- Coluna 4: CB -->
                      <td class="py-2.5 px-0.5 text-center align-middle" [ngClass]="{'border-b border-[var(--outline-variant)]/10': !last}">
                        <span *ngIf="sub.custo_beneficio" [ngClass]="{
                          'bg-[#6058cc] text-[#ffffff] dark:bg-[#6058cc]/80 dark:text-[#e0e0ff]': sub.custo_beneficio === 'Alto',
                          'bg-[#ff9933] text-[#ffffff] dark:bg-[#ff9933]/80 dark:text-[#fff2e0]': sub.custo_beneficio === 'Médio',
                          'bg-[#3399ff] text-[#ffffff] dark:bg-[#3399ff]/80 dark:text-[#e0f4ff]': sub.custo_beneficio === 'Baixo'
                        }" class="text-[9px] font-black px-0.5 py-0.5 rounded-md inline-flex items-center justify-center gap-1 uppercase w-[76px]">
                          <span *ngIf="sub.custo_beneficio === 'Alto'">⭐️ ALTO</span>
                          <span *ngIf="sub.custo_beneficio === 'Médio'">🔥 MÉDIO</span>
                          <span *ngIf="sub.custo_beneficio === 'Baixo'">🧊 BAIXO</span>
                        </span>
                      </td>

                      <!-- Coluna 5: Métricas (Dificuldade) -->
                      <td class="py-2.5 px-0.5 text-center align-middle" [ngClass]="{'border-b border-[var(--outline-variant)]/10': !last}">
                        <span *ngIf="sub.dificuldade" [class]="getDificuldadeBadgeClass(sub.dificuldade)" class="text-[9px] px-1.5 py-0.5 rounded-md inline-flex items-center justify-center uppercase w-[70px]">
                          {{ sub.dificuldade }}
                        </span>
                      </td>

                    </tr>
                  </ng-container>
                </ng-container>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>

      <!-- VIEW MODE 2: CARDS ACCORDION -->
      <div *ngIf="viewMode === 'cards'" class="space-y-6">
        <div *ngFor="let disc of filteredDisciplines; let discIdx = index" class="neo-raised rounded-3xl p-6 transition-all">
          
          <!-- Discipline Header -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
               (click)="toggleDisciplineExpand(disc.nome)">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <button class="w-8 h-8 rounded-xl neo-pressed flex items-center justify-center shrink-0 text-[var(--primary)]">
                <span class="material-symbols-outlined transition-transform duration-200"
                      [class.rotate-90]="expandedDisciplines.has(disc.nome)">
                  chevron_right
                </span>
              </button>
              <div>
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span [ngClass]="disc.isBasica ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'bg-[var(--secondary)]/15 text-[var(--secondary)]'"
                        class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    {{ disc.isBasica ? 'Básica' : 'Específica' }}
                  </span>
                  <span *ngIf="disc.prioridade" [ngClass]="{
                    'bg-[#00845a]/15 text-[#00845a] dark:bg-[#4edea3]/20 dark:text-[#4edea3]': disc.prioridade === 'PRIORITÁRIA',
                    'bg-[var(--secondary)]/15 text-[var(--secondary)]': disc.prioridade === 'COMPLEMENTAR',
                    'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)]': disc.prioridade === 'RESIDUAL'
                  }" class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    {{ disc.prioridade === 'PRIORITÁRIA' ? '🔥 PRIORITÁRIA (20% PARETO)' : disc.prioridade }}
                  </span>
                  <span *ngIf="disc.percentual_questoes" class="text-[10px] font-bold text-[var(--on-surface-variant)]">
                    ~{{ disc.percentual_questoes }}% das questões
                  </span>
                  <span *ngIf="disc.percentual_tempo" class="text-[10px] font-bold text-[var(--secondary)] bg-[var(--secondary)]/10 px-2 py-0.5 rounded-md">
                    ⏳ {{ disc.percentual_tempo }}% do tempo
                  </span>
                </div>
                <h2 class="text-base md:text-lg font-black text-[var(--on-surface)]">{{ disc.nome }}</h2>
              </div>
            </div>

            <!-- Discipline Progress Bar -->
            <div class="flex items-center gap-4 shrink-0 min-w-[200px]">
              <div class="flex-1">
                <div class="flex justify-between items-center text-xs font-extrabold mb-1">
                  <span class="text-[var(--on-surface-variant)]">Concluído</span>
                  <span class="text-[var(--primary)]">{{ getDisciplineProgressPercentage(disc) }}%</span>
                </div>
                <div class="w-full h-2 bg-[var(--surface-container-high)] rounded-full overflow-hidden p-0.5">
                  <div class="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                       [style.width.%]="getDisciplineProgressPercentage(disc)"></div>
                </div>
              </div>
              <span class="text-xs font-black text-[var(--on-surface)]">
                {{ getDisciplineCompletedCount(disc) }}/{{ getDisciplineTotalCheckableCount(disc) }}
              </span>
            </div>
          </div>

          <!-- Topics & Subtopics List (Expanded Content) -->
          <div *ngIf="expandedDisciplines.has(disc.nome)" class="mt-6 pt-6 border-t border-[var(--outline-variant)]/40 space-y-4 animate-fadeIn">
            
            <div *ngIf="!disc.camada_2_topicos || disc.camada_2_topicos.length === 0" class="text-xs text-[var(--on-surface-variant)] italic p-4 bg-[var(--surface-container-low)] rounded-xl">
              Nenhum tópico detalhado para esta disciplina no edital.
            </div>

            <div *ngFor="let topic of disc.camada_2_topicos; let topicIdx = index" class="neo-pressed rounded-2xl p-4 md:p-5">
              
              <!-- Topic Row -->
              <div class="flex items-center justify-between gap-3 mb-2">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <span [class]="getTopicBadgeClass(topic.temperatura)" class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                    {{ topic.temperatura || 'GERAL' }}
                  </span>
                  <h3 class="text-xs md:text-sm font-bold text-[var(--on-surface)]">{{ topic.nome }}</h3>
                </div>

                <div class="flex items-center gap-2">
                  <span *ngIf="topic.frequencia_historica" class="text-[11px] text-[var(--on-surface-variant)] font-semibold hidden sm:inline">
                    {{ topic.frequencia_historica }}
                  </span>
                  <!-- Topic Master Checkbox -->
                  <label class="flex items-center gap-1.5 cursor-pointer bg-[var(--card-bg)] px-2.5 py-1 rounded-xl neo-raised-sm hover:border-[var(--primary)]">
                    <input
                      type="checkbox"
                      [checked]="isTopicFullyChecked(disc.nome, topic)"
                      (change)="toggleTopicAll(disc.nome, topic, $event)"
                      class="w-4 h-4 accent-[var(--primary)] cursor-pointer rounded">
                    <span class="text-[11px] font-bold text-[var(--primary)]">Concluir Tópico</span>
                  </label>
                </div>
              </div>

              <!-- Barra de Progresso do Tópico (Camada 2) -->
              <div class="mb-3">
                <div class="flex items-center justify-between text-[11px] font-extrabold text-[var(--on-surface-variant)] mb-1">
                  <span>Progresso do Tópico</span>
                  <span class="text-[var(--primary)] font-black">
                    {{ getTopicProgressPercentage(disc.nome, topic) }}% ({{ getTopicCompletedCount(disc.nome, topic) }}/{{ getTopicTotalCount(topic) }})
                  </span>
                </div>
                <div class="w-full h-1.5 bg-[var(--surface-container-high)] rounded-full overflow-hidden p-0.5">
                  <div class="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--tertiary-container)] rounded-full transition-all duration-300"
                       [style.width.%]="getTopicProgressPercentage(disc.nome, topic)"></div>
                </div>
              </div>

              <!-- Subtopics / Assuntos List -->
              <div class="space-y-2 pl-2 md:pl-4 border-l-2 border-[var(--primary)]/30 mt-3">
                
                <!-- If no subtopics exist, show topic as single checkable item -->
                <div *ngIf="!topic.camada_3_subtopicos || topic.camada_3_subtopicos.length === 0"
                     class="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container)] transition-colors">
                  <label class="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      [checked]="isChecked(getItemKey(disc.nome, topic.nome, topic.nome))"
                      (change)="toggleCheck(getItemKey(disc.nome, topic.nome, topic.nome))"
                      class="w-4 h-4 accent-[var(--primary)] cursor-pointer rounded shrink-0">
                    <span class="text-xs text-[var(--on-surface)]" [class.line-through]="isChecked(getItemKey(disc.nome, topic.nome, topic.nome))" [class.opacity-60]="isChecked(getItemKey(disc.nome, topic.nome, topic.nome))">
                      Estudo completo do tópico
                    </span>
                  </label>
                </div>

                <div *ngFor="let sub of topic.camada_3_subtopicos; let subIdx = index"
                     class="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container)] transition-colors gap-2">
                  
                  <label class="flex items-start sm:items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      [checked]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))"
                      (change)="toggleCheck(getItemKey(disc.nome, topic.nome, sub.nome))"
                      class="w-4 h-4 accent-[var(--primary)] cursor-pointer rounded shrink-0 mt-0.5 sm:mt-0">
                    <span class="text-[13px] leading-snug font-semibold text-[var(--on-surface)]"
                          [class.line-through]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))"
                          [class.opacity-60]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))">
                      {{ sub.nome }}
                    </span>
                  </label>

                  <div class="flex items-center gap-2 pl-7 sm:pl-0">
                    <span *ngIf="sub.custo_beneficio" [ngClass]="{
                      'bg-[#ffe4e1] text-[#990000] dark:bg-[#7f1d1d]/80 dark:text-[#fecaca]': sub.custo_beneficio === 'Alto',
                      'bg-[#ffedd5] text-[#9a3412] dark:bg-[#7c2d12]/80 dark:text-[#fed7aa]': sub.custo_beneficio === 'Médio',
                      'bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0c4a6e]/80 dark:text-[#bae6fd]': sub.custo_beneficio === 'Baixo'
                    }" class="text-[9px] font-black px-1.5 py-0.5 rounded-md inline-flex items-center justify-center gap-1 uppercase w-[76px]">
                      <span *ngIf="sub.custo_beneficio === 'Alto'">⭐️ ALTO</span>
                      <span *ngIf="sub.custo_beneficio === 'Médio'">🔥 MÉDIO</span>
                      <span *ngIf="sub.custo_beneficio === 'Baixo'">🧊 BAIXO</span>
                    </span>
                    <span *ngIf="sub.dificuldade" [class]="getDificuldadeBadgeClass(sub.dificuldade)" class="text-[9px] px-1.5 py-0.5 rounded-md inline-flex items-center justify-center uppercase w-[70px]">
                      {{ sub.dificuldade }}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>

      <!-- EMPTY STATE: Nenhuma disciplina encontrada -->
      <div *ngIf="allDisciplines.length === 0" class="neo-raised rounded-3xl p-8 md:p-12 text-center space-y-4 my-8">
        <div class="w-16 h-16 bg-[var(--primary)]/15 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined !text-[36px]">find_in_page</span>
        </div>
        <h3 class="text-xl font-extrabold text-[var(--on-surface)]">Conteúdo Programático não Gerado para este Edital</h3>
        <p class="text-xs md:text-sm text-[var(--on-surface-variant)] max-w-lg mx-auto">
          Este edital ainda não possui o Mapa Geral de Disciplinas estruturado em 3 camadas. Clique no botão abaixo para processar o edital e gerar o mapa completo das disciplinas.
        </p>
        <div class="pt-2">
          <button (click)="reanalyzeMapaGeral()" [disabled]="isReanalyzing" class="btn-neo px-6 py-3 rounded-2xl text-xs font-bold text-[var(--primary)] flex items-center gap-2 mx-auto disabled:opacity-50">
            <span class="material-symbols-outlined !text-[20px]" [class.animate-spin]="isReanalyzing">autorenew</span>
            <span>{{ isReanalyzing ? 'Gerando Mapa das Disciplinas com IA...' : 'Gerar Mapa das Disciplinas Agora' }}</span>
          </button>
        </div>
      </div>

      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- MODAL: Configurar / Gerar Cronograma                       -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div *ngIf="showScheduleModal"
           class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="closeScheduleModal()">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-[#1a1a2e] text-[var(--on-surface)] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[var(--outline-variant)]/40 animate-fadeIn"
             (click)="$event.stopPropagation()">

          <!-- Header do modal -->
          <div class="p-5 sm:p-6 border-b border-[var(--outline-variant)]/30 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
                <span class="material-symbols-outlined !text-[22px]">calendar_month</span>
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-black text-[var(--on-surface)]">Gerar Cronograma de Estudos</h3>
                <p class="text-[11px] text-[var(--on-surface-variant)]">Defina seu ritmo para distribuir as disciplinas em sprints</p>
              </div>
            </div>
            <button (click)="closeScheduleModal()" class="w-8 h-8 rounded-xl neo-pressed flex items-center justify-center text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">close</span>
            </button>
          </div>

          <!-- Corpo do modal -->
          <div class="p-5 sm:p-6 space-y-4">
            <!-- Edital selecionado -->
            <div class="bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20 rounded-xl px-4 py-3 border border-[var(--primary)]/20">
              <p class="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wide mb-0.5">Edital</p>
              <p class="text-xs font-bold text-[var(--on-surface)] truncate">{{ edital?.cargo || edital?.title || 'Edital Oficial' }}</p>
            </div>

            <!-- Data da prova -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                <span class="material-symbols-outlined !text-[14px]">event</span>
                Data da Prova (Opcional)
              </label>
              <div class="neo-pressed rounded-xl p-3 flex items-center gap-2 bg-[var(--card-bg)]">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">event</span>
                <input
                  [(ngModel)]="scheduleDataProva"
                  type="date"
                  [min]="today"
                  class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)]">
              </div>
            </div>

            <!-- Horas por dia -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                <span class="material-symbols-outlined !text-[14px]">schedule</span>
                Horas de Estudo por Dia <span class="text-red-500">*</span>
              </label>
              <div class="neo-pressed rounded-xl p-3 flex items-center gap-2 bg-[var(--card-bg)]">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">schedule</span>
                <input
                  [(ngModel)]="scheduleHorasPorDia"
                  type="number"
                  min="0.5" max="24" step="0.5"
                  placeholder="Ex: 2"
                  class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
                <span class="text-xs text-[var(--on-surface-variant)] shrink-0 font-bold">h/dia</span>
              </div>
            </div>

            <!-- Dias por semana -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                <span class="material-symbols-outlined !text-[14px]">calendar_view_week</span>
                Dias de Estudo por Semana <span class="text-red-500">*</span>
              </label>
              <div class="neo-pressed rounded-xl p-3 flex items-center gap-2 bg-[var(--card-bg)]">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">calendar_view_week</span>
                <input
                  [(ngModel)]="scheduleDiasPorSemana"
                  type="number"
                  min="1" max="7" step="1"
                  placeholder="Ex: 5"
                  class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
                <span class="text-xs text-[var(--on-surface-variant)] shrink-0 font-bold">dias/sem</span>
              </div>
            </div>
          </div>

          <!-- Footer do modal -->
          <div class="p-5 sm:p-6 border-t border-[var(--outline-variant)]/30 flex items-center gap-3">
            <button
              (click)="closeScheduleModal()"
              class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] transition-all cursor-pointer">
              Cancelar
            </button>
            <button
              (click)="saveScheduleAndOpen()"
              [disabled]="!scheduleHorasPorDia || !scheduleDiasPorSemana || isSavingSchedule"
              class="flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold btn-mesh flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-50">
              <span class="material-symbols-outlined !text-[16px]">{{ isSavingSchedule ? 'hourglass_top' : 'auto_awesome' }}</span>
              <span>{{ isSavingSchedule ? 'Gerando...' : 'Gerar Cronograma' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DisciplinesSheetComponent implements OnInit {
  public themeService = inject(ThemeService);
  editalId: string | null = null;
  edital: any = null;
  paretoData: any = null;
  hasSchedule: boolean = false;
  currentUser: any = null;

  showScheduleModal: boolean = false;
  isSavingSchedule: boolean = false;
  scheduleHorasPorDia: number | null = 3;
  scheduleDiasPorSemana: number | null = 5;
  scheduleDataProva: string = '';
  today: string = new Date().toISOString().split('T')[0];

  searchQuery: string = '';
  categoryFilter: 'todas' | 'basicas' | 'especificas' = 'todas';
  statusFilter: 'todos' | 'pendentes' | 'concluidos' = 'todos';
  viewMode: 'table' | 'cards' = 'table';

  expandedDisciplines: Set<string> = new Set();
  checkedItems: CheckedItemState = {};
  isReanalyzing: boolean = false;
  isAnalyzingPareto: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit(): void {
    const savedMode = localStorage.getItem('aprovando_disciplines_view_mode') as 'table' | 'cards';
    if (savedMode === 'table' || savedMode === 'cards') {
      this.viewMode = savedMode;
    }
    this.editalId = this.route.snapshot.paramMap.get('id');
    if (this.editalId) {
      this.loadEditalDetails(this.editalId);
      this.loadCheckedState();
      this.checkUserSchedule(this.editalId);
    }
  }

  checkUserSchedule(editalId: string): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
      if (user?.id) {
        this.apiService.getUserSchedule(user.id, editalId).subscribe({
          next: (res: any) => {
            const data = res?.data || res;
            if (data && (Array.isArray(data) ? data.length > 0 : (data.id || data.horas_por_dia))) {
              this.hasSchedule = true;
              const sched = Array.isArray(data) ? data[0] : data;
              if (sched?.horas_por_dia) this.scheduleHorasPorDia = sched.horas_por_dia;
              if (sched?.dias_por_semana) this.scheduleDiasPorSemana = sched.dias_por_semana;
              if (sched?.data_prova) this.scheduleDataProva = sched.data_prova;
            }
          },
          error: () => {
            this.hasSchedule = false;
          }
        });
      }
    });
  }

  handleCronogramaClick(): void {
    if (this.hasSchedule) {
      this.router.navigate(['/sprints', this.editalId]);
    } else {
      this.openScheduleModal();
    }
  }

  openScheduleModal(): void {
    if (this.edital?.data_prova && !this.scheduleDataProva) {
      this.scheduleDataProva = this.edital.data_prova;
    }
    this.showScheduleModal = true;
  }

  closeScheduleModal(): void {
    if (!this.isSavingSchedule) {
      this.showScheduleModal = false;
    }
  }

  saveScheduleAndOpen(): void {
    if (!this.currentUser?.id || !this.editalId) return;
    if (!this.scheduleHorasPorDia || !this.scheduleDiasPorSemana) return;

    this.isSavingSchedule = true;
    this.apiService.saveUserSchedule({
      userId: this.currentUser.id,
      editalId: this.editalId,
      horas_por_dia: this.scheduleHorasPorDia,
      dias_por_semana: this.scheduleDiasPorSemana,
      data_prova: this.scheduleDataProva || undefined,
    }).subscribe({
      next: () => {
        this.isSavingSchedule = false;
        this.hasSchedule = true;
        this.showScheduleModal = false;
        this.router.navigate(['/sprints', this.editalId]);
      },
      error: (err: any) => {
        this.isSavingSchedule = false;
        console.error('Erro ao salvar cronograma:', err);
      }
    });
  }

  changeViewMode(mode: 'table' | 'cards'): void {
    this.viewMode = mode;
    localStorage.setItem('aprovando_disciplines_view_mode', mode);
  }

  loadEditalDetails(id: string) {
    this.apiService.getEditalDetails(id).subscribe({
      next: (res: any) => {
        const ed = res?.data || res;
        let pd = ed?.pareto_data || ed || {};
        if (typeof pd === 'string') {
          try { pd = JSON.parse(pd); } catch (e) { }
        }
        this.paretoData = pd;
        if (ed?.user_schedule || ed?.schedule || (pd?.cronograma_estudos?.semanas && pd.cronograma_estudos.semanas.length > 0) || (pd?.sprints && pd.sprints.length > 0)) {
          this.hasSchedule = true;
        }
        // Auto expand all disciplines initially
        this.expandAll();
      },
      error: (err: any) => {
        console.error('Erro ao carregar edital:', err);
      }
    });
  }

  /** Executa a Análise Pareto 80/20 sob demanda atualizando a tabela existente */
  runParetoAnalysis() {
    if (!this.editalId || this.isAnalyzingPareto) return;
    this.isAnalyzingPareto = true;

    const userContext = {
      cargo: this.edital?.cargo || 'Cargo Principal',
      concurso: this.edital?.concurso || 'Edital Oficial',
      dataProva: this.edital?.data_prova,
      horasPorDia: this.edital?.horas_por_dia || 4,
      diasPorSemana: this.edital?.dias_por_semana || 5,
    };

    this.apiService.analyzeEditalPareto(this.editalId, userContext).subscribe({
      next: (res: any) => {
        this.isAnalyzingPareto = false;
        if (res?.data?.pareto_data) {
          this.edital = res.data;
          this.paretoData = res.data.pareto_data;
        } else {
          this.loadEditalDetails(this.editalId!);
        }
        this.expandAll();
      },
      error: (err: any) => {
        this.isAnalyzingPareto = false;
        console.error('Erro ao executar Análise Pareto:', err);
      }
    });
  }

  reanalyzeMapaGeral() {
    if (!this.editalId || this.isReanalyzing) return;
    this.isReanalyzing = true;

    const userContext = {
      cargo: this.edital?.cargo || 'Cargo Principal',
      concurso: this.edital?.concurso || 'Edital Oficial',
      dataProva: this.edital?.data_prova,
      horasPorDia: this.edital?.horas_por_dia || 4,
      diasPorSemana: this.edital?.dias_por_semana || 5,
    };

    this.apiService.reanalyzeEdital(this.editalId, null, '', userContext).subscribe({
      next: (res: any) => {
        this.isReanalyzing = false;
        if (res?.data?.pareto_data) {
          this.edital = res.data;
          this.paretoData = res.data.pareto_data;
        } else {
          this.loadEditalDetails(this.editalId!);
        }
        this.expandAll();
      },
      error: (err: any) => {
        this.isReanalyzing = false;
        console.error('Erro ao reanalisar Mapa Geral:', err);
      }
    });
  }

  goBack() {
    window.history.back();
  }

  get allDisciplines(): any[] {
    let pd = this.paretoData || this.edital?.pareto_data || this.edital || {};
    if (typeof pd === 'string') {
      try { pd = JSON.parse(pd); } catch (e) { }
    }

    let basicas: any[] = [];
    let especificas: any[] = [];

    // Helper para extrair grupo de disciplinas (suporta Array do novo schema e Dicionário)
    const parseCategoryGroup = (groupData: any, isBasica: boolean) => {
      const items: any[] = [];
      if (!groupData) return items;

      if (Array.isArray(groupData)) {
        for (const item of groupData) {
          if (!item) continue;
          const discName = item.disciplina || item.nome || item.name || 'Disciplina';
          const rawTopicos = Array.isArray(item.topicos) ? item.topicos : (Array.isArray(item.topics) ? item.topics : (Array.isArray(item.camada_2_topicos) ? item.camada_2_topicos : []));

          const topicosList = rawTopicos.map((t: any) => {
            const topName = typeof t === 'string' ? t : (t.nome || t.name || String(discName));
            const rawSubs = Array.isArray(t.subtopicos) ? t.subtopicos : (Array.isArray(t.assuntos) ? t.assuntos : (Array.isArray(t.camada_3_subtopicos) ? t.camada_3_subtopicos : []));
            return {
              nome: String(topName).trim(),
              temperatura: t.temperatura || t.temperature || (isBasica ? 'MORNO' : 'QUENTE'),
              camada_3_subtopicos: rawSubs.map((s: any) => typeof s === 'string' ? { nome: s.trim() } : { ...s, nome: String(s.nome || s.name || 'Assunto').trim() })
            };
          });

          items.push({
            nome: String(discName).trim(),
            isBasica: isBasica,
            prioridade: item.prioridade || (isBasica ? 'COMPLEMENTAR' : 'PRIORITÁRIA'),
            camada_2_topicos: topicosList.length > 0 ? topicosList : [{ nome: String(discName).trim(), temperatura: isBasica ? 'MORNO' : 'QUENTE', camada_3_subtopicos: [] }]
          });
        }
      } else if (typeof groupData === 'object') {
        for (const [discName, discVal] of Object.entries<any>(groupData)) {
          if (!discName) continue;
          const subs = Array.isArray(discVal?.subtopicos) ? discVal.subtopicos : (Array.isArray(discVal) ? discVal : []);
          items.push({
            nome: discName,
            isBasica: isBasica,
            prioridade: isBasica ? 'COMPLEMENTAR' : 'PRIORITÁRIA',
            camada_2_topicos: [{ nome: discName, temperatura: isBasica ? 'MORNO' : 'QUENTE', camada_3_subtopicos: subs.map((s: any) => ({ nome: typeof s === 'string' ? s : (s.nome || s) })) }]
          });
        }
      }
      return items;
    };

    // 1. Tenta mapa_geral / mapa_geral_extraido / mapa_completo
    const mapaGeral = pd.mapa_geral || pd.mapa_geral_extraido || pd.mapa_completo;

    if (mapaGeral) {
      if (Array.isArray(mapaGeral.disciplinas_basicas) || Array.isArray(mapaGeral.disciplinas_especificas)) {
        const b = (mapaGeral.disciplinas_basicas || []).map((d: any) => ({ ...d, isBasica: true }));
        const e = (mapaGeral.disciplinas_especificas || []).map((d: any) => ({ ...d, isBasica: false }));
        if (b.length > 0 || e.length > 0) {
          basicas = b;
          especificas = e;
        }
      } else if (Array.isArray(mapaGeral.disciplinas) && mapaGeral.disciplinas.length > 0) {
        const discs = mapaGeral.disciplinas;
        basicas = discs.filter((d: any) => d.prioridade === 'COMPLEMENTAR' || d.prioridade === 'RESIDUAL' || d.isBasica).map((d: any) => ({ ...d, isBasica: true }));
        especificas = discs.filter((d: any) => d.prioridade === 'PRIORITÁRIA' || (!d.prioridade && !d.isBasica)).map((d: any) => ({ ...d, isBasica: false }));
      }
    }

    // 2. Tenta conteudo_programatico (suporta array e dicionário)
    if (basicas.length === 0 && especificas.length === 0) {
      const cp = pd.conteudo_programatico?.conteudo_programatico || pd.conteudo_programatico || pd;
      if (cp) {
        basicas = parseCategoryGroup(cp.conhecimentos_gerais || cp.disciplinas_basicas, true);
        especificas = parseCategoryGroup(cp.conhecimentos_especificos || cp.disciplinas_especificas, false);
      }
    }

    // 3. Tenta camada_1_mapa_prioridades
    if (basicas.length === 0 && especificas.length === 0 && Array.isArray(pd.camada_1_mapa_prioridades?.disciplinas)) {
      const discs = pd.camada_1_mapa_prioridades.disciplinas;
      especificas = discs
        .filter((d: any) => {
          const p = String(d.prioridade || '').toUpperCase();
          return p.includes('PRIORIT') || p.includes('ALTA') || p.includes('20%') || p.includes('HIGH') || !d.prioridade;
        })
        .map((d: any) => ({ ...d, isBasica: false }));

      basicas = discs
        .filter((d: any) => {
          const p = String(d.prioridade || '').toUpperCase();
          return p.includes('COMPLEMENTAR') || p.includes('RESIDUAL') || p.includes('MÉDIA') || p.includes('MEDIA') || p.includes('BAIXA') || p.includes('LOW');
        })
        .map((d: any) => ({ ...d, isBasica: true }));

      if (especificas.length === 0 && basicas.length === 0 && discs.length > 0) {
        especificas = discs.map((d: any) => ({ ...d, isBasica: false }));
      }
    }

    // 4. Tenta subjects
    if (basicas.length === 0 && especificas.length === 0 && Array.isArray(pd.subjects)) {
      especificas = pd.subjects.map((s: any) => ({
        nome: s.name || s.nome,
        isBasica: false,
        prioridade: s.priority || 'PRIORITÁRIA',
        camada_2_topicos: (s.topics || []).map((t: any) => ({
          nome: t.name || t.nome,
          temperatura: t.temperature || 'MORNO',
          camada_3_subtopicos: (t.subtopics || []).map((sub: any) => ({
            nome: typeof sub === 'string' ? sub : (sub.name || sub.nome),
            custo_beneficio: sub.costBenefit || 'Médio'
          }))
        }))
      }));
    }

    // 5. Tenta array genérico em pd.disciplinas ou no próprio pd
    if (basicas.length === 0 && especificas.length === 0) {
      const genericArray = Array.isArray(pd.disciplinas) ? pd.disciplinas : (Array.isArray(pd) ? pd : []);
      if (genericArray.length > 0) {
        especificas = genericArray.map((d: any) => ({ ...d, isBasica: false }));
      }
    }

    const result = [...especificas, ...basicas];

    // Normalização defensiva de nome, tópicos e subtópicos para exibição impecável na tabela
    result.forEach(d => {
      d.nome = String(d.nome || d.disciplina || d.name || 'Disciplina').trim();

      if (!Array.isArray(d.camada_2_topicos)) {
        d.camada_2_topicos = Array.isArray(d.topicos) ? d.topicos : (Array.isArray(d.topics) ? d.topics : []);
      }

      if (d.camada_2_topicos.length === 0 && d.nome) {
        d.camada_2_topicos = [{ nome: d.nome, temperatura: 'MORNO', camada_3_subtopicos: [] }];
      }

      d.camada_2_topicos.forEach((t: any) => {
        if (!t) return;
        t.nome = String(t.nome || t.name || t.titulo || d.nome || 'Tópico').trim();

        if (!Array.isArray(t.camada_3_subtopicos)) {
          t.camada_3_subtopicos = Array.isArray(t.subtopicos) ? t.subtopicos : (Array.isArray(t.assuntos) ? t.assuntos : (Array.isArray(t.subtopics) ? t.subtopics : []));
        }

        if (t.camada_3_subtopicos.length === 0 && t.nome) {
          t.camada_3_subtopicos = [{ nome: t.nome, custo_beneficio: 'Médio' }];
        }

        t.camada_3_subtopicos = t.camada_3_subtopicos.map((sub: any) => {
          if (typeof sub === 'string') return { nome: sub, custo_beneficio: 'Médio' };
          if (sub && typeof sub === 'object') return { ...sub, nome: String(sub.nome || sub.name || sub.titulo || 'Subtópico').trim() };
          return { nome: String(sub), custo_beneficio: 'Médio' };
        });
      });
    });

    return result;
  }

  get basicDisciplines(): any[] {
    return this.allDisciplines.filter(d => d.isBasica);
  }

  get specificDisciplines(): any[] {
    return this.allDisciplines.filter(d => !d.isBasica);
  }

  get filteredDisciplines(): any[] {
    let list = this.allDisciplines;

    if (this.categoryFilter === 'basicas') {
      list = list.filter(d => d.isBasica);
    } else if (this.categoryFilter === 'especificas') {
      list = list.filter(d => !d.isBasica);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(d => {
        const discMatch = (d.nome || '').toLowerCase().includes(q);
        const topicMatch = (d.camada_2_topicos || []).some((t: any) =>
          (t?.nome || '').toLowerCase().includes(q) ||
          (t?.camada_3_subtopicos || []).some((s: any) => (s?.nome || '').toLowerCase().includes(q))
        );
        return discMatch || topicMatch;
      });
    }

    return list;
  }

  toggleDisciplineExpand(name: string) {
    if (this.expandedDisciplines.has(name)) {
      this.expandedDisciplines.delete(name);
    } else {
      this.expandedDisciplines.add(name);
    }
  }

  expandAll() {
    this.allDisciplines.forEach(d => this.expandedDisciplines.add(d.nome));
  }

  collapseAll() {
    this.expandedDisciplines.clear();
  }

  getItemKey(discName: string, topicName: string, subName: string): string {
    return `${discName}::${topicName}::${subName}`;
  }

  getTopicKey(discName: string, topicName: string): string {
    return `${discName}::${topicName}::__TOPIC__`;
  }

  isChecked(key: string): boolean {
    return !!this.checkedItems[key];
  }

  toggleCheck(key: string) {
    const newState = !this.checkedItems[key];
    this.checkedItems[key] = newState;
    this.saveCheckedState([{ topicId: key, completed: newState }]);
  }

  isTopicChecked(discName: string, topic: any): boolean {
    const topicKey = this.getTopicKey(discName, topic.nome);
    if (this.checkedItems[topicKey]) return true;

    const subs = topic.camada_3_subtopicos || [];
    if (subs.length > 0) {
      return subs.every((s: any) => this.isChecked(this.getItemKey(discName, topic.nome, s.nome)));
    }
    return false;
  }

  toggleTopicCheck(discName: string, topic: any, event?: Event) {
    const isChecked = event ? (event.target as HTMLInputElement).checked : !this.isTopicChecked(discName, topic);
    const topicKey = this.getTopicKey(discName, topic.nome);
    this.checkedItems[topicKey] = isChecked;

    const itemsToSync: { topicId: string; completed: boolean }[] = [
      { topicId: topicKey, completed: isChecked }
    ];

    const subs = topic.camada_3_subtopicos || [];
    subs.forEach((s: any) => {
      const subKey = this.getItemKey(discName, topic.nome, s.nome);
      this.checkedItems[subKey] = isChecked;
      itemsToSync.push({ topicId: subKey, completed: isChecked });
    });

    this.saveCheckedState(itemsToSync);
  }

  toggleSubtopicCheck(discName: string, topic: any, subName: string) {
    const subKey = this.getItemKey(discName, topic.nome, subName);
    const newState = !this.isChecked(subKey);
    this.checkedItems[subKey] = newState;

    const topicKey = this.getTopicKey(discName, topic.nome);
    const subs = topic.camada_3_subtopicos || [];
    const isTopicFullyChecked = subs.length > 0 && subs.every((s: any) => this.isChecked(this.getItemKey(discName, topic.nome, s.nome)));
    this.checkedItems[topicKey] = isTopicFullyChecked;

    const itemsToSync: { topicId: string; completed: boolean }[] = [
      { topicId: subKey, completed: newState },
      { topicId: topicKey, completed: isTopicFullyChecked }
    ];

    this.saveCheckedState(itemsToSync);
  }

  isTopicFullyChecked(discName: string, topic: any): boolean {
    return this.isTopicChecked(discName, topic);
  }

  toggleTopicAll(discName: string, topic: any, event: Event) {
    this.toggleTopicCheck(discName, topic, event);
  }

  getDisciplineTotalCheckableCount(disc: any): number {
    let total = 0;
    (disc.camada_2_topicos || []).forEach((t: any) => {
      total += this.getTopicTotalCount(t);
    });
    return total;
  }

  getDisciplineCompletedCount(disc: any): number {
    let count = 0;
    (disc.camada_2_topicos || []).forEach((t: any) => {
      count += this.getTopicCompletedCount(disc.nome, t);
    });
    return count;
  }

  getDificuldadeBadgeClass(dificuldade: string): string {
    const d = String(dificuldade || '').toLowerCase().trim();
    if (d.includes('fácil') || d.includes('facil') || d.includes('baix')) {
      return 'bg-[#00845a]/20 text-[#00845a] dark:bg-[#4edea3]/25 dark:text-[#4edea3] font-bold border border-[#00845a]/30';
    }
    if (d.includes('difícil') || d.includes('dificil') || d.includes('alt') || d.includes('complex')) {
      return 'bg-[#ba1a1a]/20 text-[#ba1a1a] dark:bg-[#ffb4ab]/25 dark:text-[#ffb4ab] font-bold border border-[#ba1a1a]/30';
    }
    // Médio / Intermediário (Sky Blue / Cyan)
    return 'bg-[#0288d1]/20 text-[#0288d1] dark:bg-[#81d4fa]/25 dark:text-[#81d4fa] font-bold border border-[#0288d1]/30';
  }

  getTopicBadgeClass(temperatura: string | undefined): string {
    const val = String(temperatura || '').toUpperCase().trim();
    if (val === 'QUENTE' || val === 'PRIORITÁRIA' || val === 'ALTO') {
      return 'bg-[#ba1a1a]/15 text-[#ba1a1a] dark:bg-[#ffb4ab]/20 dark:text-[#ffb4ab]';
    }
    if (val === 'MORNO' || val === 'COMPLEMENTAR' || val === 'MÉDIO') {
      return 'bg-[#e65100]/15 text-[#e65100] dark:bg-[#ffb74d]/20 dark:text-[#ffb74d]';
    }
    if (val === 'ESSENCIAL' || val === 'BÁSICA') {
      return 'bg-[#6058cc]/15 text-[#6058cc] dark:bg-[#a59eff]/25 dark:text-[#c1c1ff]';
    }
    // FRIO or default/GERAL
    return 'bg-[#0288d1]/15 text-[#0288d1] dark:bg-[#81d4fa]/20 dark:text-[#81d4fa]';
  }

  getTopicCompletedCount(discName: string, topic: any): number {
    const subs = topic.camada_3_subtopicos || [];
    if (subs.length === 0) {
      return this.isTopicChecked(discName, topic) ? 1 : 0;
    }
    return subs.filter((s: any) => this.isChecked(this.getItemKey(discName, topic.nome, s.nome))).length;
  }

  getTopicTotalCount(topic: any): number {
    const subs = topic.camada_3_subtopicos || [];
    return subs.length > 0 ? subs.length : 1;
  }

  getTopicProgressPercentage(discName: string, topic: any): number {
    const total = this.getTopicTotalCount(topic);
    if (total === 0) return 0;
    const completed = this.getTopicCompletedCount(discName, topic);
    return Math.round((completed / total) * 100);
  }

  getDisciplineProgressPercentage(disc: any): number {
    const total = this.getDisciplineTotalCheckableCount(disc);
    if (total === 0) return 0;
    const completed = this.getDisciplineCompletedCount(disc);
    return Math.round((completed / total) * 100);
  }

  get totalCheckableItems(): number {
    let total = 0;
    this.allDisciplines.forEach(d => {
      total += this.getDisciplineTotalCheckableCount(d);
    });
    return total;
  }

  get totalCompletedItems(): number {
    let completed = 0;
    this.allDisciplines.forEach(d => {
      completed += this.getDisciplineCompletedCount(d);
    });
    return completed;
  }

  get totalProgressPercentage(): number {
    if (this.totalCheckableItems === 0) return 0;
    return Math.round((this.totalCompletedItems / this.totalCheckableItems) * 100);
  }

  private getStorageKey(): string {
    return `edital_checklist_${this.editalId || 'default'}`;
  }

  async loadCheckedState() {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        this.checkedItems = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao ler checklist do localStorage:', e);
    }

    if (this.editalId) {
      try {
        const remoteMap = await this.supabaseService.getUserEditalChecklist(this.editalId);
        if (remoteMap && Object.keys(remoteMap).length > 0) {
          this.checkedItems = { ...this.checkedItems, ...remoteMap };
          localStorage.setItem(this.getStorageKey(), JSON.stringify(this.checkedItems));
        }
      } catch (e) {
        console.error('Erro ao sincronizar checklist do Supabase:', e);
      }
    }
  }

  saveCheckedState(itemsToSync?: { topicId: string; completed: boolean }[]) {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.checkedItems));
    } catch (e) {
      console.error('Erro ao salvar checklist no localStorage:', e);
    }

    if (this.editalId) {
      if (itemsToSync && itemsToSync.length > 0) {
        this.supabaseService.saveUserTopicProgressBatch(this.editalId, itemsToSync);
      } else {
        const batch = Object.keys(this.checkedItems).map(k => ({
          topicId: k,
          completed: !!this.checkedItems[k]
        }));
        if (batch.length > 0) {
          this.supabaseService.saveUserTopicProgressBatch(this.editalId, batch);
        }
      }
    }
  }

  resetChecklist() {
    if (confirm('Tem certeza que deseja resetar todo o progresso do checklist deste edital?')) {
      this.checkedItems = {};
      try {
        localStorage.removeItem(this.getStorageKey());
      } catch (e) {}
      if (this.editalId) {
        this.supabaseService.resetUserEditalProgress(this.editalId);
      }
    }
  }
}
