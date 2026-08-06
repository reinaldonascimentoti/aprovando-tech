import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

export interface CheckedItemState {
  [key: string]: boolean;
}

@Component({
  selector: 'app-disciplines-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#f7f9fc] p-4 md:p-8 max-w-7xl mx-auto">
      <!-- Back Navigation & Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button (click)="goBack()" class="btn-neo px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span class="material-symbols-outlined !text-[18px]">arrow_back</span>
          <span>Voltar ao Painel</span>
        </button>

        <div class="flex items-center gap-2 flex-wrap">
          <span class="bg-[#e9ddff] text-[#5516be] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
            <span class="material-symbols-outlined !text-[14px]">grid_view</span>
            Mapa das Disciplinas
          </span>

          <!-- Passo 3: Botão Análise de Pareto -->
          <button (click)="runParetoAnalysis()" [disabled]="isAnalyzingPareto" class="bg-gradient-to-r from-[#433fe5] to-[#6b38d4] text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
            <span class="material-symbols-outlined !text-[18px]" [class.animate-spin]="isAnalyzingPareto">donut_large</span>
            <span>{{ isAnalyzingPareto ? 'Realizando Análise de Pareto...' : 'Análise de Pareto' }}</span>
          </button>

          <!-- Passo 4: Opção Ver Pareto -->
          <a *ngIf="editalId && paretoData?.pareto_analisado" [routerLink]="['/pareto', editalId]" class="btn-mesh px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
            <span class="material-symbols-outlined !text-[18px]">analytics</span>
            <span>Ver Pareto</span>
          </a>
        </div>
      </div>

      <!-- Main Edital Info Card -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="bg-[#e1dfff] text-[#2b20d2] text-[11px] font-extrabold px-3 py-1 rounded-full">
                {{ edital?.concurso || 'Edital Oficial' }}
              </span>
              <span *ngIf="edital?.cargo" class="bg-[#e9ddff] text-[#5516be] text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                <span class="material-symbols-outlined !text-[13px]">badge</span>
                {{ edital.cargo }}
              </span>
            </div>
            <h1 class="text-2xl md:text-3xl font-black text-[#191c1e] mb-2">Mapa Geral das Disciplinas</h1>
            <p class="text-xs text-[#464556] mb-4">Visão estruturada de todo o conteúdo programático do edital em 3 camadas (Disciplinas, Tópicos e Subtópicos) gerada automaticamente a partir do edital.</p>
            
            <div class="flex items-center gap-3 flex-wrap">
              <!-- Passo 3: Botão Análise de Pareto -->
              <button (click)="runParetoAnalysis()" [disabled]="isAnalyzingPareto" class="bg-gradient-to-r from-[#433fe5] to-[#6b38d4] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
                <span class="material-symbols-outlined !text-[18px]" [class.animate-spin]="isAnalyzingPareto">donut_large</span>
                <span>{{ isAnalyzingPareto ? 'Realizando Análise de Pareto...' : 'Análise de Pareto' }}</span>
              </button>

              <!-- Passo 4: Opção Ver Pareto -->
              <a *ngIf="editalId && paretoData?.pareto_analisado" [routerLink]="['/pareto', editalId]" class="btn-mesh px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
                <span class="material-symbols-outlined !text-[18px]">analytics</span>
                <span>Ver Pareto</span>
              </a>
            </div>
          </div>

          <!-- Overall Progress Card -->
          <div class="neo-pressed rounded-2xl p-5 min-w-[240px] text-center">
            <p class="text-xs font-bold text-[#464556] mb-1">Progresso Geral do Edital</p>
            <div class="text-3xl font-black text-[#433fe5] mb-2">{{ totalProgressPercentage }}%</div>
            <div class="w-full h-2.5 bg-[#dce1e9] rounded-full overflow-hidden p-0.5">
              <div class="h-full bg-gradient-to-r from-[#433fe5] to-[#00845a] rounded-full transition-all duration-500"
                   [style.width.%]="totalProgressPercentage"></div>
            </div>
            <p class="text-[10px] text-[#767587] mt-2">
              <strong>{{ totalCompletedItems }}</strong> de <strong>{{ totalCheckableItems }}</strong> assuntos concluídos
            </p>
          </div>
        </div>

        <!-- Stat Badges Row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#c7c4d8]/30">
          <div class="neo-pressed rounded-xl p-3 text-center">
            <span class="text-[10px] font-bold text-[#767587] block">Disciplinas Totais</span>
            <span class="text-lg font-black text-[#191c1e]">{{ allDisciplines.length }}</span>
          </div>
          <div class="neo-pressed rounded-xl p-3 text-center">
            <span class="text-[10px] font-bold text-[#767587] block">Prioritárias (20% Pareto)</span>
            <span class="text-lg font-black text-[#433fe5]">{{ paretoData?.high_priority_subjects || specificDisciplines.length }}</span>
          </div>
          <div class="neo-pressed rounded-xl p-3 text-center">
            <span class="text-[10px] font-bold text-[#767587] block">Cobertura Estimada</span>
            <span class="text-lg font-black text-[#00845a]">{{ paretoData?.coverage_percentage || 80 }}%</span>
          </div>
          <div class="neo-pressed rounded-xl p-3 text-center">
            <span class="text-[10px] font-bold text-[#767587] block">Tópicos Quentes 🔥</span>
            <span class="text-lg font-black text-[#ba1a1a]">{{ paretoData?.total_hot_topics || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Controls & Search Bar -->
      <div class="neo-raised rounded-3xl p-6 mb-8 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <!-- Search input -->
          <div class="md:col-span-5 neo-pressed rounded-2xl p-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#433fe5] !text-[20px]">search</span>
            <input
              [(ngModel)]="searchQuery"
              type="text"
              placeholder="Buscar disciplina, tópico ou assunto..."
              class="w-full bg-transparent border-none outline-none text-xs md:text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
          </div>

          <!-- Filter Category (Básicas / Específicas / Todas) -->
          <div class="md:col-span-4 flex gap-1.5 bg-[#eceef1] p-1 rounded-xl">
            <button
              (click)="categoryFilter = 'todas'"
              [ngClass]="categoryFilter === 'todas' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all">
              Todas ({{ allDisciplines.length }})
            </button>
            <button
              (click)="categoryFilter = 'basicas'"
              [ngClass]="categoryFilter === 'basicas' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all">
              Básicas ({{ basicDisciplines.length }})
            </button>
            <button
              (click)="categoryFilter = 'especificas'"
              [ngClass]="categoryFilter === 'especificas' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all">
              Específicas ({{ specificDisciplines.length }})
            </button>
          </div>

          <!-- Status Filter -->
          <div class="md:col-span-3 flex gap-2 justify-end">
            <select
              [(ngModel)]="statusFilter"
              class="bg-white border border-[#c7c4d8] rounded-xl text-xs font-bold px-3 py-2 text-[#191c1e] outline-none cursor-pointer">
              <option value="todos">Todos os Status</option>
              <option value="pendentes">Apenas Pendentes</option>
              <option value="concluidos">Apenas Concluídos</option>
            </select>
          </div>
        </div>

        <!-- Secondary Controls Bar -->
        <div class="flex items-center justify-between text-xs text-[#767587] pt-2 border-t border-[#c7c4d8]/40 flex-wrap gap-2">
          <div class="flex items-center gap-3">
            <button (click)="expandAll()" class="hover:text-[#433fe5] font-bold flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">unfold_more</span>
              Expandir Tudo
            </button>
            <span>•</span>
            <button (click)="collapseAll()" class="hover:text-[#433fe5] font-bold flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">unfold_less</span>
              Recolher Tudo
            </button>
          </div>

          <div class="flex items-center gap-3">
            <button (click)="reanalyzeMapaGeral()" [disabled]="isReanalyzing" class="text-[#433fe5] hover:underline font-bold flex items-center gap-1 disabled:opacity-50">
              <span class="material-symbols-outlined !text-[15px]" [class.animate-spin]="isReanalyzing">autorenew</span>
              <span>{{ isReanalyzing ? 'Reanalisando Mapa Geral...' : 'Reanalisar / Refazer Mapa' }}</span>
            </button>
            <span>•</span>
            <button (click)="resetChecklist()" class="text-[#ba1a1a] hover:underline font-bold flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">restart_alt</span>
              Resetar Progresso
            </button>
          </div>
        </div>
      </div>

      <!-- Control Bar View Mode Toggle (Tabela vs Cards) -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-[#464556]">Modo de Visualização:</span>
          <div class="flex items-center gap-1 bg-[#eceef1] p-1 rounded-xl">
            <button (click)="viewMode = 'table'" [ngClass]="viewMode === 'table' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">table_chart</span>
              <span>Tabela Tática</span>
            </button>
            <button (click)="viewMode = 'cards'" [ngClass]="viewMode === 'cards' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1">
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
              <tr class="bg-[#eceef1] text-[#464556] text-[11px] font-black uppercase tracking-wider border-b border-[#c7c4d8]">
                <th class="py-3 px-3 w-12 text-center">Status</th>
                <th class="py-3 px-3 w-1/4">Disciplina (Camada 1)</th>
                <th class="py-3 px-3 w-1/4">Tópico (Camada 2)</th>
                <th class="py-3 px-3 w-1/3">Subtópico / Assunto (Camada 3)</th>
                <th class="py-3 px-3 w-28 text-center">Métricas & CB</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#c7c4d8]/40 text-xs">
              <ng-container *ngFor="let disc of filteredDisciplines">
                <!-- Group Header Row for Discipline -->
                <tr class="bg-[#f0f3f8] font-bold text-[#191c1e]">
                  <td colspan="5" class="py-3 px-3 border-y-2 border-[#433fe5]/20">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div class="flex items-center gap-2">
                        <span [ngClass]="disc.isBasica ? 'bg-[#e1dfff] text-[#2b20d2]' : 'bg-[#e9ddff] text-[#5516be]'" class="text-[9px] font-black uppercase px-2 py-0.5 rounded">
                          {{ disc.isBasica ? 'Básica' : 'Específica' }}
                        </span>
                        <span *ngIf="disc.prioridade" [ngClass]="{
                          'bg-[#eefff2] text-[#005236]': disc.prioridade === 'PRIORITÁRIA',
                          'bg-[#e9ddff] text-[#5516be]': disc.prioridade === 'COMPLEMENTAR',
                          'bg-[#eceef1] text-[#464556]': disc.prioridade === 'RESIDUAL'
                        }" class="text-[9px] font-black uppercase px-2 py-0.5 rounded">
                          {{ disc.prioridade === 'PRIORITÁRIA' ? '🔥 20% PARETO' : disc.prioridade }}
                        </span>
                        <span class="text-sm font-black text-[#191c1e]">{{ disc.nome }}</span>
                      </div>
                      <div class="flex items-center gap-3 text-[11px]">
                        <span *ngIf="disc.percentual_questoes" class="text-[#767587]">~{{ disc.percentual_questoes }}% questões</span>
                        <span *ngIf="disc.percentual_tempo" class="text-[#6b38d4] font-bold">⏳ {{ disc.percentual_tempo }}% tempo</span>
                        <span class="text-[#433fe5] font-extrabold bg-white px-2 py-0.5 rounded-lg border border-[#c7c4d8]/40">
                          {{ getDisciplineCompletedCount(disc) }}/{{ getDisciplineTotalCheckableCount(disc) }} ({{ getDisciplineProgressPercentage(disc) }}%)
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Rows for Topics & Subtopics -->
                <ng-container *ngFor="let topic of disc.camada_2_topicos">
                  <!-- If no subtopics, single topic row -->
                  <tr *ngIf="!topic.camada_3_subtopicos || topic.camada_3_subtopicos.length === 0"
                      class="hover:bg-white/80 transition-colors"
                      [ngClass]="{ 'bg-[#eefff2]/40': isChecked(getItemKey(disc.nome, topic.nome, topic.nome)) }">
                    <td class="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        [checked]="isChecked(getItemKey(disc.nome, topic.nome, topic.nome))"
                        (change)="toggleCheck(getItemKey(disc.nome, topic.nome, topic.nome))"
                        class="w-4 h-4 accent-[#433fe5] cursor-pointer rounded">
                    </td>
                    <td class="py-2.5 px-3 text-[#767587] font-medium">{{ disc.nome }}</td>
                    <td class="py-2.5 px-3 font-bold text-[#191c1e]">
                      <div class="flex items-center gap-1.5">
                        <span [ngClass]="{
                          'bg-[#ffdad6] text-[#ba1a1a]': topic.temperatura === 'QUENTE',
                          'bg-[#fff3e0] text-[#e65100]': topic.temperatura === 'MORNO',
                          'bg-[#e1f5fe] text-[#0288d1]': topic.temperatura === 'FRIO' || !topic.temperatura
                        }" class="text-[9px] font-black px-1.5 py-0.5 rounded">
                          {{ topic.temperatura || 'GERAL' }}
                        </span>
                        <span>{{ topic.nome }}</span>
                      </div>
                    </td>
                    <td class="py-2.5 px-3 text-[#464556]" [class.line-through]="isChecked(getItemKey(disc.nome, topic.nome, topic.nome))">
                      Estudo completo do tópico
                    </td>
                    <td class="py-2.5 px-3 text-center">
                      <span class="text-[10px] text-[#767587]">{{ topic.frequencia_historica || '-' }}</span>
                    </td>
                  </tr>

                  <!-- Rows for Subtopics -->
                  <tr *ngFor="let sub of topic.camada_3_subtopicos"
                      class="hover:bg-white/80 transition-colors"
                      [ngClass]="{ 'bg-[#eefff2]/40': isChecked(getItemKey(disc.nome, topic.nome, sub.nome)) }">
                    <td class="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        [checked]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))"
                        (change)="toggleCheck(getItemKey(disc.nome, topic.nome, sub.nome))"
                        class="w-4 h-4 accent-[#433fe5] cursor-pointer rounded">
                    </td>
                    <td class="py-2.5 px-3 text-[#767587] font-medium">{{ disc.nome }}</td>
                    <td class="py-2.5 px-3 font-semibold text-[#191c1e]">
                      <div class="flex items-center gap-1.5">
                        <span [ngClass]="{
                          'bg-[#ffdad6] text-[#ba1a1a]': topic.temperatura === 'QUENTE',
                          'bg-[#fff3e0] text-[#e65100]': topic.temperatura === 'MORNO',
                          'bg-[#e1f5fe] text-[#0288d1]': topic.temperatura === 'FRIO' || !topic.temperatura
                        }" class="text-[9px] font-black px-1.5 py-0.5 rounded">
                          {{ topic.temperatura || 'GERAL' }}
                        </span>
                        <span>{{ topic.nome }}</span>
                      </div>
                    </td>
                    <td class="py-2.5 px-3">
                      <span class="font-semibold text-[#191c1e]" [class.line-through]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))" [class.text-[#767587]]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))">
                        {{ sub.nome }}
                      </span>
                      <p *ngIf="sub.justificativa" class="text-[10px] text-[#767587] italic mt-0.5">{{ sub.justificativa }}</p>
                    </td>
                    <td class="py-2.5 px-3 text-center">
                      <div class="flex items-center justify-center gap-1 flex-wrap">
                        <span *ngIf="sub.custo_beneficio" [ngClass]="{
                          'bg-[#eefff2] text-[#005236]': sub.custo_beneficio === 'Alto',
                          'bg-[#fff3e0] text-[#e65100]': sub.custo_beneficio === 'Médio',
                          'bg-[#eceef1] text-[#464556]': sub.custo_beneficio === 'Baixo'
                        }" class="text-[9px] font-bold px-1.5 py-0.5 rounded">
                          CB: {{ sub.custo_beneficio }}
                        </span>
                        <span *ngIf="sub.dificuldade" class="text-[9px] text-[#767587] bg-[#f2f4f7] px-1.5 py-0.5 rounded">
                          {{ sub.dificuldade }}
                        </span>
                      </div>
                    </td>
                  </tr>
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
              <button class="w-8 h-8 rounded-xl neo-pressed flex items-center justify-center shrink-0 text-[#433fe5]">
                <span class="material-symbols-outlined transition-transform duration-200"
                      [class.rotate-90]="expandedDisciplines.has(disc.nome)">
                  chevron_right
                </span>
              </button>
              <div>
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span [ngClass]="disc.isBasica ? 'bg-[#e1dfff] text-[#2b20d2]' : 'bg-[#e9ddff] text-[#5516be]'"
                        class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    {{ disc.isBasica ? 'Básica' : 'Específica' }}
                  </span>
                  <span *ngIf="disc.prioridade" [ngClass]="{
                    'bg-[#eefff2] text-[#005236]': disc.prioridade === 'PRIORITÁRIA',
                    'bg-[#e9ddff] text-[#5516be]': disc.prioridade === 'COMPLEMENTAR',
                    'bg-[#eceef1] text-[#464556]': disc.prioridade === 'RESIDUAL'
                  }" class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    {{ disc.prioridade === 'PRIORITÁRIA' ? '🔥 PRIORITÁRIA (20% PARETO)' : disc.prioridade }}
                  </span>
                  <span *ngIf="disc.percentual_questoes" class="text-[11px] font-bold text-[#767587]">
                    ~{{ disc.percentual_questoes }}% das questões
                  </span>
                  <span *ngIf="disc.percentual_tempo" class="text-[11px] font-bold text-[#6b38d4] bg-[#f0e7ff] px-2 py-0.5 rounded-md">
                    ⏳ {{ disc.percentual_tempo }}% do tempo
                  </span>
                </div>
                <h2 class="text-base md:text-lg font-black text-[#191c1e]">{{ disc.nome }}</h2>
              </div>
            </div>

            <!-- Discipline Progress Bar -->
            <div class="flex items-center gap-4 shrink-0 min-w-[200px]">
              <div class="flex-1">
                <div class="flex justify-between items-center text-xs font-extrabold mb-1">
                  <span class="text-[#767587]">Concluído</span>
                  <span class="text-[#433fe5]">{{ getDisciplineProgressPercentage(disc) }}%</span>
                </div>
                <div class="w-full h-2 bg-[#eceef1] rounded-full overflow-hidden p-0.5">
                  <div class="h-full bg-[#433fe5] rounded-full transition-all duration-300"
                       [style.width.%]="getDisciplineProgressPercentage(disc)"></div>
                </div>
              </div>
              <span class="text-xs font-bold text-[#464556]">
                {{ getDisciplineCompletedCount(disc) }}/{{ getDisciplineTotalCheckableCount(disc) }}
              </span>
            </div>
          </div>

          <!-- Topics & Subtopics List (Expanded Content) -->
          <div *ngIf="expandedDisciplines.has(disc.nome)" class="mt-6 pt-6 border-t border-[#c7c4d8]/40 space-y-4 animate-fadeIn">
            
            <div *ngIf="!disc.camada_2_topicos || disc.camada_2_topicos.length === 0" class="text-xs text-[#767587] italic p-4 bg-white/60 rounded-xl">
              Nenhum tópico detalhado para esta disciplina no edital.
            </div>

            <div *ngFor="let topic of disc.camada_2_topicos; let topicIdx = index" class="neo-pressed rounded-2xl p-4 md:p-5">
              
              <!-- Topic Row -->
              <div class="flex items-center justify-between gap-3 mb-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <span [ngClass]="{
                    'bg-[#ffdad6] text-[#ba1a1a]': topic.temperatura === 'QUENTE',
                    'bg-[#fff3e0] text-[#e65100]': topic.temperatura === 'MORNO',
                    'bg-[#e1f5fe] text-[#0288d1]': topic.temperatura === 'FRIO' || !topic.temperatura
                  }" class="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                    {{ topic.temperatura || 'GERAL' }}
                  </span>
                  <h3 class="text-xs md:text-sm font-bold text-[#191c1e]">{{ topic.nome }}</h3>
                </div>

                <div class="flex items-center gap-2">
                  <span *ngIf="topic.frequencia_historica" class="text-[11px] text-[#767587] hidden sm:inline">
                    {{ topic.frequencia_historica }}
                  </span>
                  <!-- Topic Master Checkbox -->
                  <label class="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-xl neo-raised-sm hover:border-[#433fe5]">
                    <input
                      type="checkbox"
                      [checked]="isTopicFullyChecked(disc.nome, topic)"
                      (change)="toggleTopicAll(disc.nome, topic, $event)"
                      class="w-4 h-4 accent-[#433fe5] cursor-pointer rounded">
                    <span class="text-[11px] font-bold text-[#433fe5]">Concluir Tópico</span>
                  </label>
                </div>
              </div>

              <!-- Subtopics / Assuntos List -->
              <div class="space-y-2 pl-2 md:pl-4 border-l-2 border-[#433fe5]/30 mt-3">
                
                <!-- If no subtopics exist, show topic as single checkable item -->
                <div *ngIf="!topic.camada_3_subtopicos || topic.camada_3_subtopicos.length === 0"
                     class="flex items-center justify-between p-2.5 rounded-xl bg-white/70 hover:bg-white transition-colors">
                  <label class="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      [checked]="isChecked(getItemKey(disc.nome, topic.nome, topic.nome))"
                      (change)="toggleCheck(getItemKey(disc.nome, topic.nome, topic.nome))"
                      class="w-4 h-4 accent-[#433fe5] cursor-pointer rounded shrink-0">
                    <span class="text-xs text-[#191c1e]" [class.line-through]="isChecked(getItemKey(disc.nome, topic.nome, topic.nome))" [class.text-[#767587]="isChecked(getItemKey(disc.nome, topic.nome, topic.nome))">
                      Estudo completo do tópico
                    </span>
                  </label>
                </div>

                <div *ngFor="let sub of topic.camada_3_subtopicos; let subIdx = index"
                     class="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-white/70 hover:bg-white transition-colors gap-2">
                  
                  <label class="flex items-start sm:items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      [checked]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))"
                      (change)="toggleCheck(getItemKey(disc.nome, topic.nome, sub.nome))"
                      class="w-4 h-4 accent-[#433fe5] cursor-pointer rounded shrink-0 mt-0.5 sm:mt-0">
                    <span class="text-xs font-semibold text-[#191c1e]"
                          [class.line-through]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))"
                          [class.text-[#767587]]="isChecked(getItemKey(disc.nome, topic.nome, sub.nome))">
                      {{ sub.nome }}
                    </span>
                  </label>

                  <div class="flex items-center gap-2 pl-7 sm:pl-0">
                    <span *ngIf="sub.custo_beneficio" [ngClass]="{
                      'bg-[#eefff2] text-[#005236]': sub.custo_beneficio === 'Alto',
                      'bg-[#fff3e0] text-[#e65100]': sub.custo_beneficio === 'Médio',
                      'bg-[#eceef1] text-[#464556]': sub.custo_beneficio === 'Baixo'
                    }" class="text-[10px] font-bold px-2 py-0.5 rounded">
                      CB: {{ sub.custo_beneficio }}
                    </span>
                    <span *ngIf="sub.dificuldade" class="text-[10px] text-[#767587] bg-[#f2f4f7] px-2 py-0.5 rounded">
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
        <div class="w-16 h-16 bg-[#e1dfff] text-[#433fe5] rounded-full flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined !text-[36px]">find_in_page</span>
        </div>
        <h3 class="text-xl font-extrabold text-[#191c1e]">Conteúdo Programático não Gerado para este Edital</h3>
        <p class="text-xs md:text-sm text-[#767587] max-w-lg mx-auto">
          Este edital ainda não possui o Mapa Geral de Disciplinas estruturado em 3 camadas. Clique no botão abaixo para processar o edital e gerar o mapa completo das disciplinas.
        </p>
        <div class="pt-2">
          <button (click)="reanalyzeMapaGeral()" [disabled]="isReanalyzing" class="btn-neo px-6 py-3 rounded-2xl text-xs font-bold text-[#433fe5] flex items-center gap-2 mx-auto disabled:opacity-50">
            <span class="material-symbols-outlined !text-[20px]" [class.animate-spin]="isReanalyzing">autorenew</span>
            <span>{{ isReanalyzing ? 'Gerando Mapa das Disciplinas com IA...' : 'Gerar Mapa das Disciplinas Agora' }}</span>
          </button>
        </div>
      </div>

    </div>
  `
})
export class DisciplinesSheetComponent implements OnInit {
  editalId: string | null = null;
  edital: any = null;
  paretoData: any = null;

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
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.editalId = this.route.snapshot.paramMap.get('id');
    if (this.editalId) {
      this.loadEditalDetails(this.editalId);
      this.loadCheckedState();
    }
  }

  loadEditalDetails(id: string) {
    this.apiService.getEditalDetails(id).subscribe({
      next: (res: any) => {
        const ed = res?.data || res;
        this.edital = ed;
        let pd = ed?.pareto_data || ed || {};
        if (typeof pd === 'string') {
          try { pd = JSON.parse(pd); } catch (e) {}
        }
        this.paretoData = pd;
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
      try { pd = JSON.parse(pd); } catch (e) {}
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

  isChecked(key: string): boolean {
    return !!this.checkedItems[key];
  }

  toggleCheck(key: string) {
    this.checkedItems[key] = !this.checkedItems[key];
    this.saveCheckedState();
  }

  isTopicFullyChecked(discName: string, topic: any): boolean {
    const subs = topic.camada_3_subtopicos || [];
    if (subs.length === 0) {
      return this.isChecked(this.getItemKey(discName, topic.nome, topic.nome));
    }
    return subs.every((s: any) => this.isChecked(this.getItemKey(discName, topic.nome, s.nome)));
  }

  toggleTopicAll(discName: string, topic: any, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const subs = topic.camada_3_subtopicos || [];

    if (subs.length === 0) {
      this.checkedItems[this.getItemKey(discName, topic.nome, topic.nome)] = isChecked;
    } else {
      subs.forEach((s: any) => {
        this.checkedItems[this.getItemKey(discName, topic.nome, s.nome)] = isChecked;
      });
    }
    this.saveCheckedState();
  }

  getDisciplineTotalCheckableCount(disc: any): number {
    let count = 0;
    (disc.camada_2_topicos || []).forEach((t: any) => {
      const subs = t.camada_3_subtopicos || [];
      count += subs.length > 0 ? subs.length : 1;
    });
    return count;
  }

  getDisciplineCompletedCount(disc: any): number {
    let count = 0;
    (disc.camada_2_topicos || []).forEach((t: any) => {
      const subs = t.camada_3_subtopicos || [];
      if (subs.length === 0) {
        if (this.isChecked(this.getItemKey(disc.nome, t.nome, t.nome))) count++;
      } else {
        subs.forEach((s: any) => {
          if (this.isChecked(this.getItemKey(disc.nome, t.nome, s.nome))) count++;
        });
      }
    });
    return count;
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

  loadCheckedState() {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        this.checkedItems = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao ler checklist do localStorage:', e);
    }
  }

  saveCheckedState() {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.checkedItems));
    } catch (e) {
      console.error('Erro ao salvar checklist no localStorage:', e);
    }
  }

  resetChecklist() {
    if (confirm('Tem certeza que deseja resetar todo o progresso do checklist deste edital?')) {
      this.checkedItems = {};
      this.saveCheckedState();
    }
  }
}
