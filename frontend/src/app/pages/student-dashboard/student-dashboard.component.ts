import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { EditalCardComponent } from '../../components/edital-card/edital-card.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditalCardComponent],
  template: `
    <div class="min-h-screen bg-[#f7f9fc] p-4 md:p-8">
      <!-- Top Navigation Bar -->
      <header class="neo-raised rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 neo-raised rounded-xl flex items-center justify-center text-[#433fe5]">
            <span class="material-symbols-outlined !text-[28px] filled">school</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-[#191c1e]">Painel do Estudante</h1>
            <p class="text-xs text-[#464556]">Aprovando Tech • Estudo Estratégico Pareto 80/20</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-semibold text-[#464556]">Bem-vindo, <strong class="text-[#433fe5]">{{ user?.full_name }}</strong></span>
          <button (click)="logout()" class="btn-neo px-4 py-2 rounded-xl text-xs flex items-center gap-1">
            <span class="material-symbols-outlined !text-[16px]">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <!-- Linha 1: Navigation Tabs Bar -->
      <div class="neo-raised rounded-3xl p-4 md:p-6 mb-8 bg-white shadow-lg border border-[#e4d9ff]">
        <div class="flex border-b border-[#c7c4d8]/40 pb-2 gap-2 sm:gap-4 overflow-x-auto">
          <button 
            (click)="activeTab = 'editais'"
            [class.border-b-2]="activeTab === 'editais'"
            [class.border-[#433fe5]]="activeTab === 'editais'"
            [class.text-[#433fe5]]="activeTab === 'editais'"
            class="pb-3 px-3 text-xs sm:text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined !text-[20px]">folder_special</span>
            <span>1. Meus Editais ({{ editais.length }})</span>
          </button>

          <button 
            (click)="activeTab = 'cronogramas'"
            [class.border-b-2]="activeTab === 'cronogramas'"
            [class.border-[#433fe5]]="activeTab === 'cronogramas'"
            [class.text-[#433fe5]]="activeTab === 'cronogramas'"
            class="pb-3 px-3 text-xs sm:text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined !text-[20px]">calendar_month</span>
            <span>2. Cronogramas</span>
          </button>

          <button 
            (click)="activeTab = 'mapa'"
            [class.border-b-2]="activeTab === 'mapa'"
            [class.border-[#433fe5]]="activeTab === 'mapa'"
            [class.text-[#433fe5]]="activeTab === 'mapa'"
            class="pb-3 px-3 text-xs sm:text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined !text-[20px]">map</span>
            <span>3. Mapa de Disciplinas</span>
          </button>

          <button 
            (click)="activeTab = 'questions'"
            [class.border-b-2]="activeTab === 'questions'"
            [class.border-[#433fe5]]="activeTab === 'questions'"
            [class.text-[#433fe5]]="activeTab === 'questions'"
            class="pb-3 px-3 text-xs sm:text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined !text-[20px]">quiz</span>
            <span>4. Questões ({{ questions.length }})</span>
          </button>

          <button 
            (click)="openUploadModal()"
            class="ml-auto pb-3 text-xs sm:text-sm font-extrabold text-[#5516be] transition-colors flex items-center gap-1.5 whitespace-nowrap hover:opacity-80">
            <span class="material-symbols-outlined !text-[20px]">cloud_upload</span>
            <span>+ Enviar Novo Edital</span>
          </button>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="neo-raised rounded-3xl p-6 md:p-8">

        <!-- 1. My Editais List & Fluxo Banner -->
        <div *ngIf="activeTab === 'editais'" class="space-y-8">
          <!-- Editais Cards List (Full Width) -->
          <div class="flex flex-col gap-6 w-full">
            <div *ngFor="let ed of editais" class="w-full">
              <app-edital-card
                [edital]="ed"
                [isAdmin]="false"
                [dismissConfirmId]="dismissConfirmId"
                (editEdital)="openEditModal($event)"
                (requestDismiss)="confirmDismiss($event)"
                (confirmDismiss)="executeDismiss($event)"
                (cancelDismiss)="dismissConfirmId = null">
              </app-edital-card>
            </div>

            <!-- Empty state -->
            <div *ngIf="editais.length === 0" class="w-full flex flex-col items-center justify-center py-16 text-center gap-4">
              <span class="material-symbols-outlined !text-[64px] text-[#c7c4d8]">folder_open</span>
              <p class="text-sm font-semibold text-[#767587]">Nenhuma análise de edital ainda.</p>
              <button (click)="openUploadModal()" class="btn-mesh px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined">add</span>Analisar Primeiro Edital
              </button>
            </div>
          </div>

          <!-- Fluxo Estratégico de Estudos (Pareto 80/20 Hierárquico) Banner (Abaixo dos cards dos editais) -->
          <div class="neo-raised rounded-3xl p-5 md:p-6 bg-gradient-to-br from-[#ffffff] via-[#f7f4ff] to-[#f0eaff] border border-[#e4d9ff] relative overflow-hidden shadow-xl mt-8">
            <!-- Subtle background glow decoration -->
            <div class="absolute -top-16 -right-16 w-64 h-64 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-16 -left-16 w-64 h-64 bg-[#433fe5]/10 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Header Title & Explanatory Badge -->
            <div class="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 text-center md:text-left relative z-10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md shadow-[#5d3bf6]/30 shrink-0">
                  <span class="material-symbols-outlined !text-[22px]">settings_suggest</span>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                    <h2 class="text-lg md:text-xl font-black text-[#1c0d45]">Fluxo Estratégico de Estudos</h2>
                    <span class="text-[#6b38d4] text-xs md:text-sm font-extrabold font-sans">(Pareto 80/20 Hierárquico)</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold text-[#5516be] mt-0.5 justify-center md:justify-start">
                    <span>Rumo à Aprovação!</span>
                    <span class="h-0.5 w-16 bg-gradient-to-r from-[#5516be] to-transparent rounded-full"></span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 bg-[#f2ecff] text-[#5516be] border border-[#d8c7ff] text-[11px] font-extrabold px-3 py-1 rounded-full shrink-0">
                <span class="material-symbols-outlined !text-[15px]">info</span>
                <span>Fluxo de Atividades</span>
              </div>
            </div>

            <!-- 7 Steps Flow + Hover Explanations + Animated Arrows (Single Clean Row) -->
            <div class="flex flex-row items-stretch justify-between gap-1 overflow-x-auto py-3 relative z-10 w-full no-scrollbar">
              
              <!-- Step 1: Upload do Edital -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[#191c1e] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Upload do Edital
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[#433fe5] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    Ponto de partida: com o documento oficial em mãos, a IA analisa todas as exigências da prova.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_upload_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[#5516be] bg-[#e9ddff]/80 px-2.5 py-0.5 rounded-full">Ponto de partida</span>
              </div>

              <!-- Flow Arrow 1 -> 2 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 2: Mapa Geral das Disciplinas -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[#191c1e] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Mapa Geral das Disciplinas
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[#433fe5] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    IA analisa todo o conteúdo programático da prova, gerando um mapa geral das disciplinas.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_map_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[#5516be] bg-[#e9ddff]/80 px-2.5 py-0.5 rounded-full">Visão Macro</span>
              </div>

              <!-- Flow Arrow 2 -> 3 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 3: Análise de Pareto 80/20 -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[#191c1e] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Análise de Pareto 80/20
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[#433fe5] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    O conteúdo é organizado em 3 camadas, destacando os tópicos de maior impacto na prova.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_pareto_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[#5516be] bg-[#e9ddff]/80 px-2.5 py-0.5 rounded-full">Tópicos-Chave</span>
              </div>

              <!-- Flow Arrow 3 -> 4 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 4: Mapa Inteligente de Prioridades -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[#191c1e] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Mapa Inteligente de Prioridades
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[#433fe5] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    Visão clara do que estudar primeiro, o que revisar e o que deixar para fases finais.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_priority_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[#5516be] bg-[#e9ddff]/80 px-2.5 py-0.5 rounded-full">Foco Hierárquico</span>
              </div>

              <!-- Flow Arrow 4 -> 5 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 5: Régua de Corte -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[#191c1e] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Régua de Corte
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[#433fe5] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    Assuntos que só entram após os 80% (Pareto), pois não contribuem significativamente.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_cutoff_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-black text-[#047857] bg-[#d1fae5] px-2.5 py-0.5 rounded-full shadow-sm">Essencial</span>
              </div>

              <!-- Flow Arrow 5 -> 6 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 6: Alertas da Banca -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[#191c1e] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Alertas da Banca
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[#433fe5] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    Destaca as pegadinhas e padrões de cobrança típicos da banca examinadora.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_alerts_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[#5516be] bg-[#e9ddff]/80 px-2.5 py-0.5 rounded-full">Padrões e Dicas</span>
              </div>

              <!-- Flow Arrow 6 -> 7 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 7: Cronograma Adaptado -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[#191c1e] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Cronograma Adaptado
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[#433fe5] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    O plano de estudos é ajustado ao seu tempo disponível, garantindo ritmo e constância.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_schedule_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[#5516be] bg-[#e9ddff]/80 px-2.5 py-0.5 rounded-full">Seu Ritmo</span>
              </div>

            </div>

            <!-- Bottom CTA Bar with Glowing Line & Central Button -->
            <div class="mt-6 pt-4 border-t border-[#e4d9ff] flex items-center justify-center relative z-10">
              <div class="w-full h-0.5 bg-gradient-to-r from-transparent via-[#5d3bf6]/30 to-transparent absolute top-0 inset-x-0"></div>
              <button
                (click)="openUploadModal()"
                class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#6b38d4] via-[#5d3bf6] to-[#7c3aed] text-white font-extrabold text-sm flex items-center gap-2.5 shadow-xl shadow-[#5d3bf6]/30 hover:shadow-[#5d3bf6]/50 hover:scale-105 active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-outlined !text-[22px] animate-pulse">auto_awesome</span>
                <span>Criar Plano Estratégico</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Cronogramas Tab -->
        <div *ngIf="activeTab === 'cronogramas'" class="space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f0eaff] p-4 md:p-6 rounded-3xl border border-[#e4d9ff]">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md shrink-0">
                <span class="material-symbols-outlined !text-[26px]">calendar_month</span>
              </div>
              <div>
                <h3 class="text-lg font-black text-[#191c1e]">Cronogramas Adaptados de Estudo</h3>
                <p class="text-xs text-[#5516be] font-medium">Selecione o edital para acessar o planejamento de sprints e ritmo diário de estudos.</p>
              </div>
            </div>

            <!-- Edital Selector Dropdown -->
            <div *ngIf="editais.length > 0" class="flex items-center gap-2">
              <label class="text-xs font-bold text-[#464556] whitespace-nowrap">Edital:</label>
              <select 
                [(ngModel)]="selectedCronogramaEditalId"
                class="neo-pressed rounded-xl px-3 py-2 text-xs font-bold text-[#191c1e] bg-white border border-[#c7c4d8] outline-none cursor-pointer focus:border-[#433fe5]">
                <option *ngFor="let ed of editais" [value]="ed.id">
                  {{ ed.cargo || ed.title }} ({{ ed.concurso || 'Edital' }})
                </option>
              </select>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="editais.length === 0" class="flex flex-col items-center justify-center py-16 text-center gap-4">
            <span class="material-symbols-outlined !text-[64px] text-[#c7c4d8]">event_busy</span>
            <p class="text-sm font-semibold text-[#767587]">Você ainda não possui editais cadastrados para gerar um cronograma.</p>
            <button (click)="openUploadModal()" class="btn-mesh px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
              <span class="material-symbols-outlined">add</span>Cadastrar Primeiro Edital
            </button>
          </div>

          <!-- Selected Edital Cronograma Card -->
          <div *ngIf="selectedCronogramaEdital" class="neo-pressed rounded-3xl p-6 md:p-8 space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c7c4d8]/40 pb-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-[#e1dfff] text-[#2b20d2] text-[11px] font-extrabold px-3 py-1 rounded-full">
                    {{ selectedCronogramaEdital.concurso || 'Concurso Alvo' }}
                  </span>
                  <span *ngIf="selectedCronogramaEdital.cargo" class="bg-[#e9ddff] text-[#5516be] text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[13px]">badge</span>
                    {{ selectedCronogramaEdital.cargo }}
                  </span>
                </div>
                <h2 class="text-xl md:text-2xl font-black text-[#191c1e]">{{ selectedCronogramaEdital.title }}</h2>
              </div>

              <div class="flex items-center gap-3">
                <button (click)="openEditalCronograma(selectedCronogramaEdital.id)" class="btn-mesh px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all">
                  <span class="material-symbols-outlined !text-[20px]">play_circle</span>
                  <span>Abrir Cronograma Completo (Sprints)</span>
                </button>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="neo-raised rounded-2xl p-4 text-center">
                <span class="material-symbols-outlined text-[#433fe5] mb-1">schedule</span>
                <span class="text-[11px] font-bold text-[#767587] block">Horas por Dia</span>
                <span class="text-lg font-black text-[#191c1e]">{{ selectedCronogramaEdital.horas_por_dia || selectedCronogramaEdital.user_context?.horasPorDia || '--' }}h</span>
              </div>
              <div class="neo-raised rounded-2xl p-4 text-center">
                <span class="material-symbols-outlined text-[#433fe5] mb-1">calendar_view_week</span>
                <span class="text-[11px] font-bold text-[#767587] block">Dias por Semana</span>
                <span class="text-lg font-black text-[#191c1e]">{{ selectedCronogramaEdital.dias_por_semana || selectedCronogramaEdital.user_context?.diasPorSemana || '--' }} dias</span>
              </div>
              <div class="neo-raised rounded-2xl p-4 text-center">
                <span class="material-symbols-outlined text-[#433fe5] mb-1">event</span>
                <span class="text-[11px] font-bold text-[#767587] block">Data da Prova</span>
                <span class="text-sm font-black text-[#191c1e] mt-1 block">{{ selectedCronogramaEdital.data_prova || selectedCronogramaEdital.user_context?.dataProva || 'Não informada' }}</span>
              </div>
              <div class="neo-raised rounded-2xl p-4 text-center">
                <span class="material-symbols-outlined text-[#5516be] mb-1">insights</span>
                <span class="text-[11px] font-bold text-[#767587] block">Status Análise</span>
                <span class="text-xs font-black text-[#5516be] bg-[#e9ddff] px-2 py-0.5 rounded-full inline-block mt-1">
                  {{ selectedCronogramaEdital.pareto_analisado ? 'Pareto Concluído' : 'Aguardando Pareto' }}
                </span>
              </div>
            </div>

            <!-- Quick Selector Cards for All Saved Editais -->
            <div *ngIf="editais.length > 1" class="pt-4 border-t border-[#c7c4d8]/40">
              <p class="text-xs font-bold text-[#464556] mb-3">Outros Cronogramas Salvos:</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div 
                  *ngFor="let ed of editais"
                  (click)="selectedCronogramaEditalId = ed.id"
                  [class.border-2]="selectedCronogramaEditalId === ed.id"
                  [class.border-[#433fe5]]="selectedCronogramaEditalId === ed.id"
                  class="neo-raised rounded-2xl p-3.5 cursor-pointer hover:border-[#433fe5] transition-all flex items-center justify-between">
                  <div class="truncate">
                    <p class="text-xs font-bold text-[#191c1e] truncate">{{ ed.cargo || ed.title }}</p>
                    <p class="text-[10px] text-[#767587] truncate">{{ ed.concurso || 'Edital' }}</p>
                  </div>
                  <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">chevron_right</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Mapa de Disciplinas Tab -->
        <div *ngIf="activeTab === 'mapa'" class="space-y-6">
          <!-- Banner & Edital Selector -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#f7f4ff] to-[#f0eaff] p-4 md:p-6 rounded-3xl border border-[#e4d9ff]">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#433fe5] to-[#6b38d4] text-white flex items-center justify-center shadow-md shrink-0">
                <span class="material-symbols-outlined !text-[26px]">map</span>
              </div>
              <div>
                <h3 class="text-lg font-black text-[#191c1e]">Mapa de Disciplinas</h3>
                <p class="text-xs text-[#5516be] font-medium">Selecione um edital salvo para explorar sua estrutura em 3 camadas e índice estratégico.</p>
              </div>
            </div>

            <!-- Edital Selector Dropdown -->
            <div *ngIf="editais.length > 0" class="flex items-center gap-2">
              <label class="text-xs font-bold text-[#464556] whitespace-nowrap">Escolher Edital:</label>
              <select 
                [(ngModel)]="selectedMapaEditalId"
                class="neo-pressed rounded-xl px-4 py-2.5 text-xs font-bold text-[#191c1e] bg-white border border-[#c7c4d8] outline-none cursor-pointer focus:border-[#433fe5] shadow-sm">
                <option *ngFor="let ed of editais" [value]="ed.id">
                  {{ ed.cargo || ed.title }} — {{ ed.concurso || 'Edital Salvo' }}
                </option>
              </select>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="editais.length === 0" class="flex flex-col items-center justify-center py-16 text-center gap-4">
            <span class="material-symbols-outlined !text-[64px] text-[#c7c4d8]">map</span>
            <p class="text-sm font-semibold text-[#767587]">Nenhum edital disponível para exibir o Mapa de Disciplinas.</p>
            <button (click)="openUploadModal()" class="btn-mesh px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
              <span class="material-symbols-outlined">add</span>Analisar Novo Edital
            </button>
          </div>

          <!-- Active Edital Mapa Details -->
          <div *ngIf="selectedMapaEdital" class="neo-pressed rounded-3xl p-6 md:p-8 space-y-6">
            <!-- Edital Header Info -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c7c4d8]/40 pb-6">
              <div>
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span class="bg-[#e1dfff] text-[#2b20d2] text-[11px] font-extrabold px-3 py-1 rounded-full">
                    {{ selectedMapaEdital.concurso || 'Edital Salvo' }}
                  </span>
                  <span *ngIf="selectedMapaEdital.cargo" class="bg-[#e9ddff] text-[#5516be] text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[13px]">badge</span>
                    {{ selectedMapaEdital.cargo }}
                  </span>
                  <span class="bg-[#d1fae5] text-[#047857] text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[13px]">check_circle</span>
                    Edital Selecionado
                  </span>
                </div>
                <h2 class="text-xl md:text-2xl font-black text-[#191c1e]">{{ selectedMapaEdital.title }}</h2>
                <p class="text-xs text-[#767587] mt-1">Status: {{ selectedMapaEdital.pareto_analisado ? 'Análise Pareto Realizada' : 'Cadastrado / Aguardando Pareto' }}</p>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-3 flex-wrap">
                <button (click)="openEditalMapa(selectedMapaEdital.id)" class="btn-mesh px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all">
                  <span class="material-symbols-outlined !text-[20px]">grid_view</span>
                  <span>Abrir Mapa Geral das Disciplinas</span>
                </button>
                <button *ngIf="selectedMapaEdital.pareto_analisado" (click)="openEditalPareto(selectedMapaEdital.id)" class="btn-neo px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <span class="material-symbols-outlined !text-[20px]">analytics</span>
                  <span>Ver Pareto</span>
                </button>
              </div>
            </div>

            <!-- Quick Discipline Cards / Visual Pills Selector -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-[#464556] uppercase tracking-wider">Alternar entre Editais Salvos para visualizar o Mapa:</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div 
                  *ngFor="let ed of editais"
                  (click)="selectedMapaEditalId = ed.id"
                  [class.bg-[#f0eaff]]="selectedMapaEditalId === ed.id"
                  [class.border-2]="selectedMapaEditalId === ed.id"
                  [class.border-[#433fe5]]="selectedMapaEditalId === ed.id"
                  class="neo-raised rounded-2xl p-4 cursor-pointer hover:border-[#433fe5] transition-all flex items-center justify-between">
                  <div class="flex items-center gap-3 truncate">
                    <div class="w-8 h-8 rounded-xl bg-[#e9ddff] text-[#5516be] flex items-center justify-center font-bold text-xs shrink-0">
                      <span class="material-symbols-outlined !text-[18px]">menu_book</span>
                    </div>
                    <div class="truncate">
                      <p class="text-xs font-bold text-[#191c1e] truncate">{{ ed.cargo || ed.title }}</p>
                      <p class="text-[10px] text-[#767587] truncate">{{ ed.concurso || 'Edital' }}</p>
                    </div>
                  </div>
                  <span *ngIf="selectedMapaEditalId === ed.id" class="material-symbols-outlined text-[#433fe5] !text-[20px] shrink-0">check_circle</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 4. Released Questions Bank Tab -->
        <div *ngIf="activeTab === 'questions'" class="space-y-6">
          <div class="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
            <div class="neo-pressed rounded-2xl px-4 py-2.5 flex items-center gap-2 w-full sm:w-80">
              <span class="material-symbols-outlined text-[#767587]">search</span>
              <input 
                [(ngModel)]="searchSubject" 
                placeholder="Buscar por matéria ou palavra-chave..."
                class="bg-transparent border-none outline-none text-xs w-full text-[#191c1e]">
            </div>
            <span class="text-xs font-semibold text-[#464556]">Mostrando {{ filteredQuestions.length }} questões revisadas</span>
          </div>

          <div *ngFor="let q of filteredQuestions" class="neo-pressed rounded-3xl p-6 space-y-4">
            <div class="flex items-center gap-2">
              <span class="bg-[#e1dfff] text-[#09006b] text-xs font-extrabold px-3 py-1 rounded-lg">{{ q.subject }}</span>
              <span class="bg-[#eceef1] text-[#464556] text-xs font-semibold px-3 py-1 rounded-lg">{{ q.topic }}</span>
              <span *ngIf="q.codigo" class="bg-[#eceef1] text-[#464556] text-xs font-semibold px-3 py-1 rounded-lg">{{ q.codigo }}</span>
            </div>

            <h4 class="text-sm font-bold text-[#191c1e] leading-relaxed">{{ q.statement }}</h4>

            <div *ngIf="q.tipo !== 'certo_errado'" class="space-y-2">
              <div *ngFor="let opt of q.options" 
                (click)="selectOption(q.id, opt.letter)"
                [class.bg-[#eefff2]]="selectedAnswers[q.id] === opt.letter && opt.letter === q.correct_option"
                [class.bg-[#ffdad6]]="selectedAnswers[q.id] === opt.letter && opt.letter !== q.correct_option"
                [class.neo-raised-sm]="selectedAnswers[q.id] !== opt.letter"
                class="p-3 rounded-2xl text-xs flex items-start gap-3 cursor-pointer transition-all hover:scale-[1.005]">
                <span class="w-6 h-6 rounded-full neo-pressed flex items-center justify-center font-bold text-[#433fe5] shrink-0">
                  {{ opt.letter }}
                </span>
                <span class="text-[#191c1e] mt-0.5">{{ opt.text }}</span>
              </div>
            </div>

            <div *ngIf="q.tipo === 'certo_errado'" class="flex gap-4">
              <div 
                (click)="selectOption(q.id, 'Certo')"
                [class.bg-[#eefff2]]="selectedAnswers[q.id] === 'Certo' && q.resposta_boolean === true"
                [class.bg-[#ffdad6]]="selectedAnswers[q.id] === 'Certo' && q.resposta_boolean === false"
                [class.neo-raised-sm]="selectedAnswers[q.id] !== 'Certo'"
                class="flex-1 p-3 rounded-2xl text-xs flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.005]">
                <span class="w-6 h-6 rounded-full neo-pressed flex items-center justify-center font-bold text-[#433fe5] shrink-0">C</span>
                <span class="text-[#191c1e] font-bold">Certo</span>
              </div>
              <div 
                (click)="selectOption(q.id, 'Errado')"
                [class.bg-[#eefff2]]="selectedAnswers[q.id] === 'Errado' && q.resposta_boolean === false"
                [class.bg-[#ffdad6]]="selectedAnswers[q.id] === 'Errado' && q.resposta_boolean === true"
                [class.neo-raised-sm]="selectedAnswers[q.id] !== 'Errado'"
                class="flex-1 p-3 rounded-2xl text-xs flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.005]">
                <span class="w-6 h-6 rounded-full neo-pressed flex items-center justify-center font-bold text-[#433fe5] shrink-0">E</span>
                <span class="text-[#191c1e] font-bold">Errado</span>
              </div>
            </div>

            <div *ngIf="selectedAnswers[q.id] !== undefined" class="p-4 rounded-2xl bg-white/70 neo-raised-sm text-xs space-y-1">
              <p class="font-bold" [class.text-[#00845a]]="isCorrectAnswer(q)" [class.text-[#ba1a1a]]="!isCorrectAnswer(q)">
                {{ isCorrectAnswer(q) ? '✓ Resposta Correta!' : '✗ Resposta Incorreta (Gabarito: ' + getCorrectAnswerLabel(q) + ')' }}
              </p>
              <p class="text-[#464556]"><strong>Explicação do Professor:</strong> {{ q.explanation }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ===== EDIT MODAL ===== -->
    <div *ngIf="showEditModal"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background: rgba(25,28,30,0.55); backdrop-filter: blur(6px);">
      <div class="neo-raised rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">

        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#c7c4d8]/30">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl neo-raised flex items-center justify-center text-[#433fe5]">
              <span class="material-symbols-outlined !text-[20px]">edit_document</span>
            </div>
            <div>
              <h2 class="text-base font-bold text-[#191c1e]">Editar Edital</h2>
              <p class="text-[11px] text-[#767587]">{{ editingEdital?.title }}</p>
            </div>
          </div>
          <button (click)="closeEditModal()" class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[#464556] hover:text-[#ba1a1a] transition-colors">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">

          <!-- Informação sobre re-análise -->
          <div class="bg-[#e9ddff]/50 rounded-xl px-3 py-2.5 flex items-start gap-2 text-[11px] text-[#5516be]">
            <span class="material-symbols-outlined !text-[15px] shrink-0 mt-0.5">info</span>
            <span><strong>Salvar</strong> atualiza os dados do contexto. <strong>Salvar e Reenviar</strong> refaz toda a análise Pareto com IA.</span>
          </div>

          <!-- Cargo -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">badge</span>
            <input
              [(ngModel)]="editCargo"
              type="text"
              placeholder="Cargo *"
              class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
          </div>

          <!-- Concurso -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">emoji_events</span>
            <input
              [(ngModel)]="editConcurso"
              type="text"
              placeholder="Concurso alvo"
              class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
          </div>

          <!-- Data da prova -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">event</span>
            <input
              [(ngModel)]="editDataProva"
              type="date"
              [min]="today"
              class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e]">
          </div>

          <!-- Horas/dia + Dias/semana -->
          <div class="grid grid-cols-2 gap-2">
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
              <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">schedule</span>
              <input
                [(ngModel)]="editHorasPorDia"
                type="number"
                min="0.5" max="24" step="0.5"
                placeholder="Horas/dia"
                class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
            </div>
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
              <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">calendar_view_week</span>
              <input
                [(ngModel)]="editDiasPorSemana"
                type="number"
                min="1" max="7" step="1"
                placeholder="Dias/semana"
                class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
            </div>
          </div>

          <!-- Seção de re-análise: novo arquivo/link (opcional) -->
          <div class="rounded-xl border border-dashed border-[#c7c4d8] p-3 space-y-2">
            <p class="text-[11px] font-bold text-[#767587] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[14px]">refresh</span>
              Re-análise (opcional — somente para "Salvar e Reenviar")
            </p>
            <!-- Modo link / pdf -->
            <div class="flex gap-2 bg-[#eceef1] p-0.5 rounded-lg">
              <button type="button"
                (click)="editUploadMode = 'none'"
                [ngClass]="editUploadMode === 'none' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'"
                class="flex-1 py-1 text-[11px] font-bold rounded-md transition-all">Sem novo arquivo</button>
              <button type="button"
                (click)="editUploadMode = 'link'"
                [ngClass]="editUploadMode === 'link' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'"
                class="flex-1 py-1 text-[11px] font-bold rounded-md transition-all">Novo Link</button>
              <button type="button"
                (click)="editUploadMode = 'pdf'"
                [ngClass]="editUploadMode === 'pdf' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'"
                class="flex-1 py-1 text-[11px] font-bold rounded-md transition-all">Novo PDF</button>
            </div>

            <div *ngIf="editUploadMode === 'link'" class="neo-pressed rounded-lg p-2.5 flex items-center gap-2">
              <span class="material-symbols-outlined text-[#433fe5] !text-[16px]">link</span>
              <input [(ngModel)]="editLink" type="text" placeholder="Cole aqui a URL do edital"
                class="w-full bg-transparent border-none outline-none text-xs text-[#191c1e]">
            </div>

            <div *ngIf="editUploadMode === 'pdf'" class="neo-pressed rounded-xl p-4 border-2 border-dashed border-[#c7c4d8] flex flex-col items-center text-center relative hover:border-[#6b38d4] transition-colors cursor-pointer">
              <span class="material-symbols-outlined !text-[28px] text-[#6b38d4] mb-1">picture_as_pdf</span>
              <p class="text-xs font-semibold text-[#191c1e]">{{ editFile ? editFile.name : 'Selecionar novo PDF' }}</p>
              <input type="file" (change)="onEditFileSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
          </div>

          <!-- Toast do modal -->
          <div *ngIf="showEditToast"
               class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
               [ngClass]="editToastType === 'success' ? 'bg-[#eefff2] text-[#005236]' : 'bg-[#ffdad6] text-[#93000a]'">
            <span class="material-symbols-outlined !text-[16px]">{{ editToastType === 'success' ? 'check_circle' : 'error' }}</span>
            <span>{{ editToastMsg }}</span>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 pb-6 pt-4 border-t border-[#c7c4d8]/30 flex gap-3">
          <button
            (click)="closeEditModal()"
            class="flex-1 py-3 rounded-xl text-sm font-bold border border-[#c7c4d8] text-[#464556] hover:border-[#433fe5] hover:text-[#433fe5] transition-colors">
            Cancelar
          </button>
          <button
            (click)="saveEditalContext()"
            [disabled]="!editCargo.trim() || isSaving"
            class="flex-1 py-3 rounded-xl text-sm font-bold btn-neo flex items-center justify-center gap-2">
            <span class="material-symbols-outlined !text-[18px]">save</span>
            <span>{{ isSaving ? 'Salvando...' : 'Salvar' }}</span>
          </button>
          <button
            (click)="saveAndReanalyze()"
            [disabled]="!editCargo.trim() || isSaving || isReanalyzing"
            class="flex-1 py-3 rounded-xl text-sm font-bold btn-mesh flex items-center justify-center gap-2">
            <span class="material-symbols-outlined !text-[18px]">{{ isReanalyzing ? 'hourglass_top' : 'auto_awesome' }}</span>
            <span>{{ isReanalyzing ? 'Analisando...' : 'Salvar e Reenviar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===== UPLOAD EDITAL MODAL ===== -->
    <div *ngIf="showUploadModal"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background: rgba(15, 10, 30, 0.65); backdrop-filter: blur(8px);">
      <div class="neo-raised rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fadeIn bg-white border border-[#e4d9ff]">

        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#c7c4d8]/30 bg-gradient-to-r from-[#f7f4ff] to-[#ffffff]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
              <span class="material-symbols-outlined !text-[22px]">cloud_upload</span>
            </div>
            <div>
              <h2 class="text-base font-extrabold text-[#191c1e]">Upload do Edital</h2>
              <p class="text-[11px] font-semibold text-[#6b38d4]">Informações para o Seu Plano Estratégico</p>
            </div>
          </div>
          <button (click)="closeUploadModal()" [disabled]="isSubmitting" class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[#464556] hover:text-[#ba1a1a] transition-colors disabled:opacity-50">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">

          <p class="text-xs text-[#464556] leading-relaxed">
            Preencha os dados do seu concurso e edital. A IA aplicará o princípio de Pareto 80/20 para gerar seu mapa de prioridades, régua de corte e cronograma personalizado.
          </p>

          <!-- Contexto do Candidato -->
          <div class="rounded-2xl border border-[#c7c4d8] bg-[#f7f4ff] p-4 space-y-3">
            <p class="text-[11px] font-extrabold text-[#5516be] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">person</span>
              Contexto do Candidato
            </p>

            <!-- Título do Edital -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-white">
              <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">description</span>
              <input
                [(ngModel)]="editalTitle"
                type="text"
                placeholder="Título do Edital (Ex: Concurso TCU 2026)"
                class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
            </div>

            <!-- Concurso Alvo -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-white">
              <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">emoji_events</span>
              <input
                [(ngModel)]="editalConcurso"
                type="text"
                placeholder="Concurso alvo (Ex: SEFAZ-RS 2026)"
                class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
            </div>

            <!-- Cargo -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-white">
              <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">badge</span>
              <input
                [(ngModel)]="editalCargo"
                type="text"
                placeholder="Cargo (Ex: Auditor Fiscal da Receita Estadual) *"
                class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
            </div>

            <!-- Data da prova -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-white">
              <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">event</span>
              <input
                [(ngModel)]="editalDataProva"
                type="date"
                [min]="today"
                placeholder="Data da prova *"
                class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
            </div>

            <!-- Horas/dia + Dias/semana -->
            <div class="grid grid-cols-2 gap-2">
              <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-white">
                <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">schedule</span>
                <input
                  [(ngModel)]="editalHorasPorDia"
                  type="number"
                  min="0.5" max="24" step="0.5"
                  placeholder="Horas/dia *"
                  class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
              </div>
              <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-white">
                <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">calendar_view_week</span>
                <input
                  [(ngModel)]="editalDiasPorSemana"
                  type="number"
                  min="1" max="7" step="1"
                  placeholder="Dias/semana *"
                  class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
              </div>
            </div>

            <!-- Resumo dinâmico de disponibilidade -->
            <div *ngIf="editalHorasPorDia && editalDiasPorSemana && editalDataProva" class="bg-[#e9ddff]/70 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-[#5516be]">
              <span class="material-symbols-outlined !text-[15px]">insights</span>
              <span>{{ editalHorasPorDia }}h/dia × {{ editalDiasPorSemana }} dias = <strong>{{ editalHorasPorDia * editalDiasPorSemana }}h/semana</strong>
              &nbsp;|&nbsp; {{ semanasDisponiveis }} semanas até a prova
              &nbsp;|&nbsp; ~<strong>{{ editalTotalHoras }}h</strong> no total</span>
            </div>

          </div>

          <!-- Modo de upload (Link / PDF) -->
          <div class="flex gap-2 bg-[#eceef1] p-1 rounded-xl">
            <button
              type="button"
              (click)="editalUploadMode = 'link'"
              [ngClass]="editalUploadMode === 'link' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all">
              Link do Edital
            </button>
            <button
              type="button"
              (click)="editalUploadMode = 'pdf'"
              [ngClass]="editalUploadMode === 'pdf' ? 'bg-white shadow-sm text-[#433fe5]' : 'text-[#464556]'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all">
              Arquivo PDF
            </button>
          </div>

          <div class="space-y-3">
            <div *ngIf="editalUploadMode === 'link'" class="neo-pressed rounded-xl p-3 flex items-center bg-white">
              <span class="material-symbols-outlined text-[#433fe5] mr-2">link</span>
              <input
                [(ngModel)]="editalLink"
                type="text"
                placeholder="Cole aqui a URL do edital"
                class="w-full bg-transparent border-none outline-none text-sm px-2 text-[#191c1e]">
            </div>

            <div *ngIf="editalUploadMode === 'pdf'" class="neo-pressed rounded-2xl p-6 border-2 border-dashed border-[#c7c4d8] flex flex-col items-center justify-center text-center relative hover:border-[#6b38d4] transition-colors cursor-pointer bg-white">
              <span class="material-symbols-outlined !text-[40px] text-[#6b38d4] mb-1">picture_as_pdf</span>
              <p class="text-xs font-semibold text-[#191c1e]">
                {{ selectedFile ? selectedFile.name : 'Selecionar Edital em PDF' }}
              </p>
              <input type="file" (change)="onFileSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
          </div>

          <!-- Toast Feedback -->
          <div *ngIf="showUploadToast"
               class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
               [ngClass]="uploadToastType === 'success' ? 'bg-[#eefff2] text-[#005236]' : 'bg-[#ffdad6] text-[#93000a]'">
            <span class="material-symbols-outlined !text-[16px]">
              {{ uploadToastType === 'success' ? 'check_circle' : 'error' }}
            </span>
            <span>{{ uploadToastMsg }}</span>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="px-6 pb-6 pt-4 border-t border-[#c7c4d8]/30 flex gap-3">
          <button
            (click)="closeUploadModal()"
            [disabled]="isSubmitting"
            class="flex-1 py-3.5 rounded-xl text-sm font-bold border border-[#c7c4d8] text-[#464556] hover:border-[#433fe5] hover:text-[#433fe5] transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            (click)="submitEdital()"
            [disabled]="!isEditalFormValid || isSubmitting"
            class="flex-1 py-3.5 rounded-2xl font-bold btn-mesh flex items-center justify-center gap-2 text-sm disabled:opacity-50">
            <span class="material-symbols-outlined">auto_awesome</span>
            <span>{{ isSubmitting ? 'Gerando Análise Pareto...' : 'Analisar Edital Pareto 80/20' }}</span>
          </button>
        </div>

      </div>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  user: UserProfile | null = null;
  editais: any[] = [];
  questions: any[] = [];
  activeTab: 'editais' | 'cronogramas' | 'mapa' | 'questions' = 'editais';
  selectedMapaEditalId: string | null = null;
  selectedCronogramaEditalId: string | null = null;

  // ---- Upload Modal state ----
  showUploadModal = false;

  // ---- Upload form ----
  editalTitle = '';
  editalLink = '';
  editalCargo = '';
  editalConcurso = '';
  editalDataProva = '';
  editalHorasPorDia: number | null = null;
  editalDiasPorSemana: number | null = null;
  editalUploadMode: 'link' | 'pdf' = 'link';
  selectedFile: File | null = null;
  isSubmitting = false;

  // ---- Questions ----
  searchSubject = '';
  selectedAnswers: { [key: string]: string } = {};

  // ---- Toast (upload) ----
  uploadToastMsg = '';
  uploadToastType: 'success' | 'error' = 'success';
  showUploadToast = false;

  // ---- Dismiss ----
  dismissConfirmId: string | null = null;

  // ---- Edit modal ----
  showEditModal = false;
  editingEdital: any = null;
  editCargo = '';
  editConcurso = '';
  editDataProva = '';
  editHorasPorDia: number | null = null;
  editDiasPorSemana: number | null = null;
  editUploadMode: 'none' | 'link' | 'pdf' = 'none';
  editLink = '';
  editFile: File | null = null;
  isSaving = false;
  isReanalyzing = false;
  showEditToast = false;
  editToastMsg = '';
  editToastType: 'success' | 'error' = 'success';

  readonly today = new Date().toISOString().split('T')[0];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadData();
  }

  loadData() {
    this.apiService.getEditais(this.user?.id).subscribe(eds => {
      this.editais = eds || [];
      if (this.editais.length > 0) {
        if (!this.selectedMapaEditalId) {
          this.selectedMapaEditalId = this.editais[0].id;
        }
        if (!this.selectedCronogramaEditalId) {
          this.selectedCronogramaEditalId = this.editais[0].id;
        }
      }
    });
    this.apiService.getQuestions(true).subscribe(qs => this.questions = qs || []);
  }

  get selectedMapaEdital(): any {
    if (!this.editais || this.editais.length === 0) return null;
    return this.editais.find(e => e.id === this.selectedMapaEditalId) || this.editais[0];
  }

  get selectedCronogramaEdital(): any {
    if (!this.editais || this.editais.length === 0) return null;
    return this.editais.find(e => e.id === this.selectedCronogramaEditalId) || this.editais[0];
  }

  openEditalMapa(editalId: string) {
    if (editalId) {
      this.router.navigate(['/disciplinas', editalId]);
    }
  }

  openEditalCronograma(editalId: string) {
    if (editalId) {
      this.router.navigate(['/sprints', editalId]);
    }
  }

  openEditalPareto(editalId: string) {
    if (editalId) {
      this.router.navigate(['/pareto', editalId]);
    }
  }

  get filteredQuestions() {
    if (!this.searchSubject) return this.questions;
    const term = this.searchSubject.toLowerCase();
    return this.questions.filter(q =>
      q.subject.toLowerCase().includes(term) ||
      q.topic.toLowerCase().includes(term) ||
      q.statement.toLowerCase().includes(term)
    );
  }

  get isEditalFormValid(): boolean {
    const hasFile = this.editalUploadMode === 'pdf'
      ? !!this.selectedFile
      : !!this.editalLink?.trim();
    return (
      hasFile &&
      !!this.editalCargo?.trim() &&
      !!this.editalDataProva &&
      !!this.editalHorasPorDia &&
      !!this.editalDiasPorSemana
    );
  }

  get semanasDisponiveis(): number {
    if (!this.editalDataProva) return 0;
    const hoje = new Date();
    const prova = new Date(this.editalDataProva);
    const diff = prova.getTime() - hoje.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
  }

  get editalTotalHoras(): number {
    if (!this.editalHorasPorDia || !this.editalDiasPorSemana || !this.editalDataProva) return 0;
    return this.editalHorasPorDia * this.editalDiasPorSemana * this.semanasDisponiveis;
  }

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    if (!this.isSubmitting) {
      this.showUploadModal = false;
      this.showUploadToast = false;
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onEditFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.editFile = event.target.files[0];
    }
  }

  submitEdital() {
    if (!this.isEditalFormValid) return;
    this.isSubmitting = true;

    const title = this.editalTitle ||
      (this.editalUploadMode === 'pdf' && this.selectedFile
        ? this.selectedFile.name.replace('.pdf', '')
        : 'Novo Edital Concurso');

    const fileToUpload = this.editalUploadMode === 'pdf' ? this.selectedFile : null;
    const linkToSend = this.editalUploadMode === 'link' ? this.editalLink : '';

    const userContext = {
      cargo: this.editalCargo.trim(),
      concurso: this.editalConcurso.trim() || undefined,
      dataProva: this.editalDataProva || undefined,
      horasPorDia: this.editalHorasPorDia ?? undefined,
      diasPorSemana: this.editalDiasPorSemana ?? undefined,
    };

    this.uploadToastMsg = 'Já confirmei seu Cargo no edital! Enviando para Análise Pareto 80/20 Recursiva e Cronograma de Estudos... Por favor, aguarde alguns instantes.';
    this.uploadToastType = 'success';
    this.showUploadToast = true;

    this.apiService.uploadEdital(fileToUpload, title, linkToSend, this.user?.id || 'usr-2', userContext).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showUploadModal = false;
        this.showUploadToast = false;
        this.selectedFile = null;
        this.editalLink = '';
        this.editalTitle = '';
        this.editalCargo = '';
        this.editalConcurso = '';
        this.editalDataProva = '';
        this.editalHorasPorDia = null;
        this.editalDiasPorSemana = null;
        this.loadData();
        this.activeTab = 'editais';

        const newId = res?.data?.id || res?.id;
        if (newId) {
          this.router.navigate(['/disciplinas', newId]);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.uploadToastMsg = 'Erro ao processar o edital. Tente novamente.';
        this.uploadToastType = 'error';
        this.showUploadToast = true;
        setTimeout(() => { this.showUploadToast = false; }, 5000);
      }
    });
  }

  // ---- Edit Modal ----

  openEditModal(ed: any) {
    this.editingEdital = ed;
    this.editCargo = ed.cargo || '';
    this.editConcurso = ed.concurso || '';
    this.editDataProva = ed.data_prova || '';
    this.editHorasPorDia = ed.horas_por_dia || null;
    this.editDiasPorSemana = ed.dias_por_semana || null;
    this.editUploadMode = 'none';
    this.editLink = '';
    this.editFile = null;
    this.showEditToast = false;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingEdital = null;
  }

  saveEditalContext() {
    if (!this.editCargo?.trim() || !this.editingEdital) return;
    this.isSaving = true;

    const context = {
      cargo: this.editCargo.trim(),
      concurso: this.editConcurso.trim() || undefined,
      dataProva: this.editDataProva || undefined,
      horasPorDia: this.editHorasPorDia ?? undefined,
      diasPorSemana: this.editDiasPorSemana ?? undefined,
    };

    this.apiService.updateEditalContext(this.editingEdital.id, context).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadData();
        this.closeEditModal();
      },
      error: () => {
        this.isSaving = false;
        this.editToastMsg = 'Erro ao salvar. Tente novamente.';
        this.editToastType = 'error';
        this.showEditToast = true;
        setTimeout(() => { this.showEditToast = false; }, 4000);
      }
    });
  }

  saveAndReanalyze() {
    if (!this.editCargo?.trim() || !this.editingEdital) return;
    this.isReanalyzing = true;

    const file = this.editUploadMode === 'pdf' ? this.editFile : null;
    const link = this.editUploadMode === 'link' ? this.editLink : '';

    const context = {
      cargo: this.editCargo.trim(),
      concurso: this.editConcurso.trim() || undefined,
      dataProva: this.editDataProva || undefined,
      horasPorDia: this.editHorasPorDia ?? undefined,
      diasPorSemana: this.editDiasPorSemana ?? undefined,
    };

    this.apiService.reanalyzeEdital(this.editingEdital.id, file, link, context).subscribe({
      next: () => {
        this.isReanalyzing = false;
        this.loadData();
        this.closeEditModal();
      },
      error: () => {
        this.isReanalyzing = false;
        this.editToastMsg = 'Erro ao reenviar análise. Tente novamente.';
        this.editToastType = 'error';
        this.showEditToast = true;
        setTimeout(() => { this.showEditToast = false; }, 4000);
      }
    });
  }

  // ---- Dismiss ----

  confirmDismiss(editalId: string) {
    this.dismissConfirmId = editalId;
  }

  executeDismiss(ed: any) {
    const userId = this.user?.id;
    if (!userId) return;

    this.apiService.dismissEdital(ed.id, userId).subscribe({
      next: () => {
        this.dismissConfirmId = null;
        this.editais = this.editais.filter(e => e.id !== ed.id);
      },
      error: () => {
        this.dismissConfirmId = null;
      }
    });
  }

  // ---- Questions ----

  selectOption(questionId: string, letter: string) {
    this.selectedAnswers[questionId] = letter;
  }

  isCorrectAnswer(q: any): boolean {
    if (q.tipo === 'certo_errado') {
      const correctStr = q.resposta_boolean ? 'Certo' : 'Errado';
      return this.selectedAnswers[q.id] === correctStr;
    }
    return this.selectedAnswers[q.id] === q.correct_option;
  }

  getCorrectAnswerLabel(q: any): string {
    if (q.tipo === 'certo_errado') {
      return q.resposta_boolean ? 'Certo' : 'Errado';
    }
    return q.correct_option;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
