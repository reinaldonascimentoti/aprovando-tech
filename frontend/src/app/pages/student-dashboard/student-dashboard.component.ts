import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { SupabaseService } from '../../services/supabase.service';
import { EditalCardComponent } from '../../components/edital-card/edital-card.component';
import { QuestionCardComponent } from '../../components/question-card/question-card.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';
import { StatsDashboardComponent } from '../../components/stats-dashboard/stats-dashboard.component';
import { getBancaLogo, getBancaInfo, BancaInfo } from '../../utils/banca.utils';
import { ParetoAnalysisModalComponent } from '../../components/pareto-analysis-modal/pareto-analysis-modal.component';
import { MultiSelectFilterComponent } from '../../components/multi-select-filter/multi-select-filter.component';

export interface AnalysisLogStep {
  id: string;
  icon: string;
  title: string;
  detail: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  time?: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditalCardComponent, QuestionCardComponent, PaginationComponent, UserProfileComponent, StatsDashboardComponent, ParetoAnalysisModalComponent, MultiSelectFilterComponent],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] transition-colors duration-300 p-3 sm:p-6 md:p-8">
      <!-- Top Navigation Bar -->
      <header class="neo-raised rounded-2xl p-3.5 sm:p-5 mb-6 md:mb-8 flex flex-wrap xl:flex-nowrap items-center justify-between gap-3 sm:gap-4">
        <!-- Title & Icon -->
        <div class="flex items-center gap-3 shrink-0 order-1">
          <div class="w-10 h-10 sm:w-12 sm:h-12 neo-raised rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
            <span class="material-symbols-outlined !text-[24px] sm:!text-[28px] filled">
              {{ activeTab === 'questions' ? 'quiz' : 'school' }}
            </span>
          </div>
          <div>
            <h1 class="text-lg sm:text-xl font-bold text-[var(--on-surface)] leading-tight">
              {{ activeTab === 'questions' ? 'Banco de Questões' : 'Painel do Estudante' }}
            </h1>
            <p class="text-[11px] sm:text-xs text-[var(--on-surface-variant)]">
              Aprovando Tech • {{ activeTab === 'questions' ? 'Prática & Filtros Avançados' : 'Estudo Estratégico Pareto 80/20' }}
            </p>
          </div>
        </div>

        <!-- Centralized Welcome & Motivation Message -->
        <div class="text-center w-full xl:w-auto xl:flex-1 order-2 sm:order-3 xl:order-2 my-1 sm:my-0 sm:pt-2.5 xl:pt-0 px-2 sm:border-t xl:border-t-0 border-[var(--outline-variant)]/20">
          <div class="flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-0.5 sm:gap-2 xl:gap-0.5">
            <p class="text-xs sm:text-sm font-semibold text-[var(--on-surface-variant)] leading-tight whitespace-normal sm:whitespace-nowrap">
              Bem-vindo, <strong class="text-[var(--primary)]">{{ user?.full_name || 'reinaldodrive123' }}</strong>.
            </p>
            <span class="hidden sm:inline xl:hidden text-[var(--on-surface-variant)]/40 font-bold">•</span>
            <p class="text-xs sm:text-sm font-extrabold text-[var(--primary)] flex items-center justify-center gap-1 leading-tight whitespace-normal sm:whitespace-nowrap">
              <span>Você está no caminho da aprovação!</span>
              <span class="material-symbols-outlined !text-[18px]">rocket_launch</span>
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto order-3 sm:order-2 xl:order-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--outline-variant)]/30 shrink-0">
          <!-- Botão Modo Dark/Claro -->
          <button (click)="themeService.toggle()" class="btn-neo px-2.5 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 text-[var(--on-surface)] transition-all cursor-pointer" [title]="themeService.isDark() ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'">
            <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
            <span>{{ themeService.isDark() ? 'Claro' : 'Escuro' }}</span>
          </button>

          <!-- Botão Voltar para o Dashboard (Visível ao navegar em Questões) -->
          <button 
            *ngIf="activeTab === 'questions'" 
            (click)="activeTab = 'editais'" 
            class="btn-neo px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all cursor-pointer">
            <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
            <span class="hidden md:inline">Voltar ao Dashboard</span>
            <span class="md:hidden">Voltar</span>
          </button>

          <!-- Botão Meu Perfil -->
          <button
            (click)="activeTab = 'perfil'"
            [class.text-[var(--primary)]]="activeTab === 'perfil'"
            class="btn-neo px-2.5 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-all cursor-pointer">
            <span class="material-symbols-outlined !text-[16px]">account_circle</span>
            <span class="hidden sm:inline">Meu Perfil</span>
          </button>

          <!-- Botão Sair da Aplicação -->
          <button (click)="logout()" class="btn-neo px-2.5 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 text-[var(--on-surface)]">
            <span class="material-symbols-outlined !text-[16px]">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <!-- ===== Email Not Verified Banner ===== -->
      <div
        *ngIf="!authService.isEmailConfirmed() && !emailBannerDismissed"
        class="rounded-2xl px-4 py-3 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
        style="background: linear-gradient(90deg, #f97316 0%, #fb923c 100%); color: #fff;">
        <div class="flex items-center gap-2 flex-1">
          <span class="material-symbols-outlined !text-[22px] shrink-0">mark_email_unread</span>
          <p class="text-sm font-semibold leading-tight">
            <strong>Confirme seu e-mail!</strong>
            Enviamos um link para o seu endereço de e-mail. Verifique a caixa de entrada (e spam) para ativar sua conta.
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            id="btn-resend-verify-email"
            type="button"
            (click)="resendVerificationEmail()"
            [disabled]="isResendingVerify"
            class="text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-white/60 hover:bg-white/20 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer bg-transparent text-white">
            <span class="material-symbols-outlined !text-[15px]">{{ isResendingVerify ? 'sync' : 'send' }}</span>
            <span>{{ isResendingVerify ? 'Enviando...' : (resendVerifySuccess ? 'E-mail enviado!' : 'Reenviar') }}</span>
          </button>
          <button
            type="button"
            (click)="emailBannerDismissed = true"
            class="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/20 transition-all cursor-pointer bg-transparent text-white border-none"
            title="Fechar aviso">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>
      </div>

      <!-- Linha 1: Navigation Tabs Bar (Padrão Modern Pill & Squircles) -->
      <div *ngIf="activeTab !== 'questions'" class="rounded-3xl p-2.5 sm:p-3.5 mb-6 md:mb-8 bg-white dark:bg-[var(--card-bg)] shadow-sm border border-slate-100 dark:border-[var(--outline-variant)]/40 transition-colors">
        <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar w-full py-1">
            <!-- 1. Edital Tab -->
            <button 
              type="button"
              (click)="activeTab = 'editais'"
              [ngClass]="activeTab === 'editais' ? 
                'bg-[#eeebff] dark:bg-[#523bf6]/20 border border-[#ddd6fe] dark:border-[#523bf6]/40 rounded-[22px] sm:rounded-3xl p-1.5 sm:p-2 pr-4 sm:pr-5 shadow-xs' : 
                'p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-[22px] hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'"
              class="flex items-center gap-3 transition-all duration-200 cursor-pointer shrink-0 group text-left">
              <div 
                [ngClass]="activeTab === 'editais' ? 
                  'bg-[#523bf6] text-white shadow-md shadow-[#523bf6]/30' : 
                  'bg-[#f3f0ff] dark:bg-purple-950/40 text-[#523bf6] dark:text-purple-300 group-hover:scale-105'"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform">
                <span class="material-symbols-outlined !text-[22px] sm:!text-[24px]">description</span>
              </div>
              <div class="flex flex-col justify-center">
                <span 
                  [ngClass]="activeTab === 'editais' ? 'font-extrabold text-[#2e1d74] dark:text-purple-200' : 'font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#523bf6]'"
                  class="text-sm sm:text-[15px] tracking-tight leading-tight whitespace-nowrap transition-colors">
                  Meu Edital
                </span>
                <span *ngIf="activeTab === 'editais'" class="text-xs font-semibold text-[#6f5ccf] dark:text-purple-300 leading-tight whitespace-nowrap">
                  Organize seus editais
                </span>
              </div>
            </button>

            <!-- 2. Mapa de Disciplinas Tab -->
            <button 
              type="button"
              (click)="activeTab = 'mapa'"
              [ngClass]="activeTab === 'mapa' ? 
                'bg-[#eeebff] dark:bg-[#523bf6]/20 border border-[#ddd6fe] dark:border-[#523bf6]/40 rounded-[22px] sm:rounded-3xl p-1.5 sm:p-2 pr-4 sm:pr-5 shadow-xs' : 
                'p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-[22px] hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'"
              class="flex items-center gap-3 transition-all duration-200 cursor-pointer shrink-0 group text-left">
              <div 
                [ngClass]="activeTab === 'mapa' ? 
                  'bg-[#523bf6] text-white shadow-md shadow-[#523bf6]/30' : 
                  'bg-[#f3f0ff] dark:bg-purple-950/40 text-[#523bf6] dark:text-purple-300 group-hover:scale-105'"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform">
                <span class="material-symbols-outlined !text-[22px] sm:!text-[24px]">map</span>
              </div>
              <div class="flex flex-col justify-center">
                <span 
                  [ngClass]="activeTab === 'mapa' ? 'font-extrabold text-[#2e1d74] dark:text-purple-200' : 'font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#523bf6]'"
                  class="text-sm sm:text-[15px] tracking-tight leading-tight whitespace-nowrap transition-colors">
                  Mapa de Disciplinas
                </span>
                <span *ngIf="activeTab === 'mapa'" class="text-xs font-semibold text-[#6f5ccf] dark:text-purple-300 leading-tight whitespace-nowrap">
                  Organize seus estudos
                </span>
              </div>
            </button>

            <!-- 3. Cronogramas Tab -->
            <button 
              type="button"
              (click)="activeTab = 'cronogramas'"
              [ngClass]="activeTab === 'cronogramas' ? 
                'bg-[#eeebff] dark:bg-[#523bf6]/20 border border-[#ddd6fe] dark:border-[#523bf6]/40 rounded-[22px] sm:rounded-3xl p-1.5 sm:p-2 pr-4 sm:pr-5 shadow-xs' : 
                'p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-[22px] hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'"
              class="flex items-center gap-3 transition-all duration-200 cursor-pointer shrink-0 group text-left">
              <div 
                [ngClass]="activeTab === 'cronogramas' ? 
                  'bg-[#523bf6] text-white shadow-md shadow-[#523bf6]/30' : 
                  'bg-[#f3f0ff] dark:bg-purple-950/40 text-[#523bf6] dark:text-purple-300 group-hover:scale-105'"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform">
                <span class="material-symbols-outlined !text-[22px] sm:!text-[24px]">calendar_month</span>
              </div>
              <div class="flex flex-col justify-center">
                <span 
                  [ngClass]="activeTab === 'cronogramas' ? 'font-extrabold text-[#2e1d74] dark:text-purple-200' : 'font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#523bf6]'"
                  class="text-sm sm:text-[15px] tracking-tight leading-tight whitespace-nowrap transition-colors">
                  Cronogramas
                </span>
                <span *ngIf="activeTab === 'cronogramas'" class="text-xs font-semibold text-[#6f5ccf] dark:text-purple-300 leading-tight whitespace-nowrap">
                  Planejamento de estudos
                </span>
              </div>
            </button>

            <!-- 4. Desempenho / Estatísticas Tab -->
            <button 
              type="button"
              (click)="activeTab = 'estatisticas'; loadStudySessions()"
              [ngClass]="activeTab === 'estatisticas' ? 
                'bg-[#eeebff] dark:bg-[#523bf6]/20 border border-[#ddd6fe] dark:border-[#523bf6]/40 rounded-[22px] sm:rounded-3xl p-1.5 sm:p-2 pr-4 sm:pr-5 shadow-xs' : 
                'p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-[22px] hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'"
              class="flex items-center gap-3 transition-all duration-200 cursor-pointer shrink-0 group text-left">
              <div 
                [ngClass]="activeTab === 'estatisticas' ? 
                  'bg-[#523bf6] text-white shadow-md shadow-[#523bf6]/30' : 
                  'bg-[#f3f0ff] dark:bg-purple-950/40 text-[#523bf6] dark:text-purple-300 group-hover:scale-105'"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform">
                <span class="material-symbols-outlined !text-[22px] sm:!text-[24px]">bar_chart</span>
              </div>
              <div class="flex flex-col justify-center">
                <span 
                  [ngClass]="activeTab === 'estatisticas' ? 'font-extrabold text-[#2e1d74] dark:text-purple-200' : 'font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#523bf6]'"
                  class="text-sm sm:text-[15px] tracking-tight leading-tight whitespace-nowrap transition-colors">
                  Desempenho
                </span>
                <span *ngIf="activeTab === 'estatisticas'" class="text-xs font-semibold text-[#6f5ccf] dark:text-purple-300 leading-tight whitespace-nowrap">
                  Métricas e evolução
                </span>
              </div>
            </button>

            <!-- 5. Questões Tab -->
            <button 
              type="button"
              (click)="activeTab = 'questions'"
              class="p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-[22px] hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent flex items-center gap-3 transition-all duration-200 cursor-pointer shrink-0 group text-left">
              <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#f3f0ff] dark:bg-purple-950/40 text-[#523bf6] dark:text-purple-300 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <span class="material-symbols-outlined !text-[22px] sm:!text-[24px]">quiz</span>
              </div>
              <div class="flex flex-col justify-center">
                <span class="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#523bf6] tracking-tight leading-tight whitespace-nowrap transition-colors">
                  Questões
                </span>
                <span class="text-xs font-medium text-slate-400 dark:text-slate-400 leading-tight whitespace-nowrap">
                  Banco de questões
                </span>
              </div>
            </button>

            <!-- 6. Pomodoro Tab -->
            <button
              type="button"
              (click)="navigateToPomodoro()"
              class="p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-[22px] hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent flex items-center gap-3 transition-all duration-200 cursor-pointer shrink-0 group text-left">
              <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#f3f0ff] dark:bg-purple-950/40 text-[#523bf6] dark:text-purple-300 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <span class="text-xl">🍅</span>
              </div>
              <div class="flex flex-col justify-center">
                <span class="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#523bf6] tracking-tight leading-tight whitespace-nowrap transition-colors">
                  Pomodoro
                </span>
                <span class="text-xs font-medium text-slate-400 dark:text-slate-400 leading-tight whitespace-nowrap">
                  Ciclos de foco
                </span>
              </div>
            </button>
          </div>

          <!-- Ação Novo Edital -->
          <button 
            type="button"
            (click)="openUploadModal()"
            class="xl:ml-auto px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-[#523bf6] to-indigo-600 hover:from-[#472fc2] hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#523bf6]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer self-start xl:self-auto">
            <span class="material-symbols-outlined !text-[20px]">cloud_upload</span>
            <span>+ Enviar Novo Edital</span>
          </button>
        </div>
      </div>

      <!-- Tab Content Area -->
      <!-- 6. Estatísticas -->
      <div *ngIf="activeTab === 'estatisticas'">
        <div class="mb-6 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#22d3ee] text-white flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined !text-[22px]">bar_chart</span>
          </div>
          <div>
            <h2 class="text-lg font-black text-[var(--on-surface)]">Estatísticas de Estudo</h2>
            <p class="text-xs text-[var(--on-surface-variant)]">Visão geral do seu desempenho e progresso</p>
          </div>
        </div>
        <app-stats-dashboard
          [isAdmin]="false"
          [questions]="questions"
          [editais]="editais"
          [userSchedules]="userSchedules"
          [studySessions]="studySessions"
          [editalProgressMap]="editalProgressMap"
          [selectedAnswers]="selectedAnswers"
          [sessionAnswers]="sessionAnswers"
          [accuracyByDisciplina]="accuracyByDisciplina">
        </app-stats-dashboard>
      </div>

      <!-- 1. My Editais List & Seções Associadas -->
      <div *ngIf="activeTab === 'editais'" class="space-y-8">

        <!-- ══ Container 1: Meus Editais ══ -->
        <div class="neo-raised rounded-3xl p-5 sm:p-6 md:p-8 bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
                <span class="material-symbols-outlined !text-[18px]">folder_special</span>
              </div>
              <h2 class="text-base font-black text-[var(--on-surface)]">Meus Editais <span class="text-[var(--primary)] text-sm">({{ editais.length }})</span></h2>
            </div>
          </div>

          <!-- Editais Cards List (2 Cards por linha) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div *ngFor="let ed of editais" class="w-full">
              <app-edital-card
                class="block h-full"
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
            <div *ngIf="editais.length === 0" class="col-span-full w-full flex flex-col items-center justify-center py-10 text-center gap-3">
              <span class="material-symbols-outlined !text-[56px] text-[#c7c4d8]">folder_open</span>
              <p class="text-sm font-semibold text-[#767587]">Você ainda não adicionou nenhum edital ao seu perfil.</p>
              <p class="text-xs text-[#767587]">Adicione um edital abaixo ou envie um novo para análise.</p>
            </div>
          </div>
        </div>

        <!-- ══ Container 2: Editais Recentes Analisados (Separado) ══ -->
        <div *ngIf="recentEditais.length > 0 || loadingRecentEditais" class="neo-raised rounded-3xl p-5 sm:p-6 md:p-8 bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-lg">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
                  <span class="material-symbols-outlined !text-[22px]">auto_awesome</span>
                </div>
                <div>
                  <h3 class="text-base font-black text-[var(--on-surface)]">Editais Recentes Analisados</h3>
                  <p class="text-xs text-[var(--on-surface-variant)]">Últimos editais desconstruídos com IA & Pareto 80/20 — adicione ao seu perfil</p>
                </div>
              </div>
              <button
                (click)="goToCatalog()"
                class="btn-neo px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 text-[var(--primary)] hover:opacity-80 transition-all shrink-0">
                <span class="material-symbols-outlined !text-[18px]">apps</span>
                <span>Ver Todos os Editais</span>
                <span class="material-symbols-outlined !text-[16px]">arrow_forward</span>
              </button>
            </div>

            <!-- Loading skeleton -->
            <div *ngIf="loadingRecentEditais" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div *ngFor="let _ of [1,2,3]" class="rounded-3xl p-6 bg-slate-100 dark:bg-[#0f1220] border border-slate-200 dark:border-[#1f253d] animate-pulse h-64"></div>
            </div>

            <!-- Recent Editais Cards (3 Cards por linha) -->
            <div *ngIf="!loadingRecentEditais" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div
                *ngFor="let ed of recentEditais"
                class="rounded-3xl p-6 bg-white dark:bg-[#0f1220] border border-slate-200/90 dark:border-[#1f253d] shadow-sm hover:shadow-xl dark:shadow-xl hover:border-indigo-400/60 dark:hover:border-[#7c3aed]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-3.5 relative overflow-hidden text-slate-800 dark:text-white group">
                
                <!-- Glow Line Top -->
                <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/70 dark:via-[#7c3aed]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <!-- Row 1: Orgao Badge (Left) & Pareto Status (Right) -->
                <div class="flex items-center justify-between gap-3 w-full">
                  <div class="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-purple-100 dark:bg-[#7c3aed]/20 border border-purple-300 dark:border-[#7c3aed] text-purple-900 dark:text-white font-extrabold text-xs sm:text-sm tracking-tight shadow-xs shadow-purple-500/10 dark:shadow-[#7c3aed]/20">
                    <span>{{ getEditalOrgao(ed) }}</span>
                  </div>

                  <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-[#7c3aed]/15 border border-purple-200 dark:border-[#a855f7]/40 text-purple-700 dark:text-[#c084fc] text-xs font-bold whitespace-nowrap">
                    <span class="material-symbols-outlined !text-[15px] text-purple-600 dark:text-[#a855f7]">donut_large</span>
                    <span>Pareto 80/20 Calculado</span>
                  </div>
                </div>

                <!-- Row 2: Banca Logo & Year -->
                <div class="flex items-center gap-2 mt-1">
                  <span *ngIf="getEditalBancaLogo(ed)" class="inline-flex items-center justify-center h-5 w-9 bg-white border border-slate-200 dark:border-transparent rounded px-1 shadow-xs">
                    <img [src]="getEditalBancaLogo(ed)" [alt]="getEditalBancaName(ed)" class="max-h-full max-w-full object-contain" />
                  </span>
                  <span class="text-xs sm:text-[13px] font-bold text-slate-600 dark:text-[#94a3b8]">
                    {{ getEditalBancaName(ed) }} • {{ getEditalAno(ed) }}
                  </span>
                </div>

                <!-- Row 3: Edital para Análise (Nome Informado) + Cargo -->
                <div class="my-1.5 min-h-[48px] flex flex-col justify-center">
                  <h4 class="text-[15px] sm:text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2 flex items-center gap-1.5" [title]="ed.title || ed.cargo">
                    <span class="material-symbols-outlined !text-[17px] text-indigo-600 dark:text-indigo-400 shrink-0">description</span>
                    <span>{{ ed.title || ed.cargo }}</span>
                  </h4>
                  <p *ngIf="ed.cargo" class="text-xs font-semibold text-slate-500 dark:text-[#a78bfa] mt-0.5 truncate flex items-center gap-1" [title]="ed.cargo">
                    <span class="material-symbols-outlined !text-[14px] text-slate-400 dark:text-slate-400 shrink-0">badge</span>
                    <span>{{ ed.cargo }}</span>
                  </p>
                </div>

                <!-- Row 4: Metrics Inset Box (3 Columns) -->
                <div class="grid grid-cols-3 gap-1.5 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-white/[0.025] border border-slate-200/80 dark:border-white/[0.06] text-center my-1">
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] sm:text-[10.5px] font-bold text-indigo-600 dark:text-[#818cf8] uppercase tracking-wider opacity-90">Tópicos IA</span>
                    <span class="text-base sm:text-lg font-black text-slate-900 dark:text-white">{{ getEditalTopicosCount(ed) }}</span>
                  </div>
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] sm:text-[10.5px] font-bold text-indigo-600 dark:text-[#818cf8] uppercase tracking-wider opacity-90">Questões</span>
                    <span class="text-base sm:text-lg font-black text-slate-900 dark:text-white">{{ getEditalQuestoesCount(ed) }}</span>
                  </div>
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-[10px] sm:text-[10.5px] font-bold text-indigo-600 dark:text-[#818cf8] uppercase tracking-wider opacity-90">Precisão IA</span>
                    <span class="text-base sm:text-lg font-black text-emerald-600 dark:text-[#00e599]">{{ getEditalScoreIA(ed) }}</span>
                  </div>
                </div>

                <!-- Row 5: Pareto Progress Section -->
                <div class="flex flex-col gap-2 mt-1">
                  <div class="flex items-center justify-between text-xs font-semibold">
                    <div class="inline-flex items-center gap-1 font-bold text-indigo-950 dark:text-[#c7d2fe]">
                      <span class="material-symbols-outlined !text-[16px] text-amber-500 dark:text-[#f59e0b]">bolt</span>
                      <span>Pareto 80/20:</span>
                    </div>
                    <div class="text-slate-600 dark:text-[#94a3b8] text-[11.5px] sm:text-xs">
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
                    (click)="addEditalToProfile(ed)"
                    [disabled]="addingEditalId === ed.id"
                    class="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-indigo-600 hover:text-purple-700 dark:text-[#818cf8] dark:hover:text-[#c084fc] transition-all cursor-pointer disabled:opacity-50">
                    <span>{{ addingEditalId === ed.id ? 'Adicionando...' : '+ Adicionar ao Perfil' }}</span>
                    <span class="material-symbols-outlined !text-[16px] group-hover:translate-x-1 transition-transform">
                      {{ addingEditalId === ed.id ? 'hourglass_empty' : 'arrow_forward' }}
                    </span>
                  </button>
                </div>

              </div>

              <!-- Nenhum edital recente disponível -->
              <div *ngIf="recentEditais.length === 0" class="col-span-full text-center py-6">
                <p class="text-xs text-[var(--on-surface-variant)]">Todos os editais já foram adicionados ao seu perfil. 🎉</p>
              </div>
            </div>
          </div>

          <!-- Fluxo Estratégico de Estudos (Pareto 80/20 Hierárquico) Banner (Abaixo dos cards dos editais) -->
          <div class="neo-raised rounded-3xl p-5 sm:p-6 md:p-8 bg-[var(--card-bg)] border border-[var(--outline-variant)] relative overflow-hidden shadow-lg">
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
                    <h2 class="text-lg md:text-xl font-black text-[var(--on-surface)]">Fluxo Estratégico de Estudos</h2>
                    <span class="text-[var(--secondary)] text-xs md:text-sm font-extrabold font-sans">(Pareto 80/20 Hierárquico)</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold text-[var(--secondary)] mt-0.5 justify-center md:justify-start">
                    <span>Rumo à Aprovação!</span>
                    <span class="h-0.5 w-16 bg-gradient-to-r from-[var(--secondary)] to-transparent rounded-full"></span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30 text-[11px] font-extrabold px-3 py-1 rounded-full shrink-0">
                <span class="material-symbols-outlined !text-[15px]">info</span>
                <span>Fluxo de Atividades</span>
              </div>
            </div>

            <!-- 7 Steps Flow + Hover Explanations + Animated Arrows (Single Clean Row) -->
            <div class="flex flex-row items-stretch justify-between gap-1 overflow-x-auto py-3 relative z-10 w-full no-scrollbar">
              
              <!-- Step 1: Upload do Edital -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[var(--on-surface)] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Upload do Edital
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[var(--primary)] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    Ponto de partida: com o documento oficial em mãos, a IA analisa todas as exigências da prova.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_upload_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[var(--secondary)] bg-[var(--secondary)]/15 px-2.5 py-0.5 rounded-full">Ponto de partida</span>
              </div>

              <!-- Flow Arrow 1 -> 2 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 2: Mapa Geral das Disciplinas -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[var(--on-surface)] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Mapa Geral das Disciplinas
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[var(--primary)] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    IA analisa todo o conteúdo programático da prova, gerando um mapa geral das disciplinas.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_map_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[var(--secondary)] bg-[var(--secondary)]/15 px-2.5 py-0.5 rounded-full">Visão Macro</span>
              </div>

              <!-- Flow Arrow 2 -> 3 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 3: Análise de Pareto 80/20 -->
              <div (click)="openParetoFromFlow()"
                   class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
                   title="Clique para executar ou visualizar a Análise Pareto 80/20 deste edital">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[var(--on-surface)] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Análise de Pareto 80/20
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[var(--primary)] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    O conteúdo é organizado em 3 camadas, destacando os tópicos de maior impacto na prova.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_pareto_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[var(--secondary)] bg-[var(--secondary)]/15 px-2.5 py-0.5 rounded-full">Tópicos-Chave</span>
              </div>

              <!-- Flow Arrow 3 -> 4 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 4: Mapa Inteligente de Prioridades -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[var(--on-surface)] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Mapa Inteligente de Prioridades
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[var(--primary)] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    Visão clara do que estudar primeiro, o que revisar e o que deixar para fases finais.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_priority_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[var(--secondary)] bg-[var(--secondary)]/15 px-2.5 py-0.5 rounded-full">Foco Hierárquico</span>
              </div>

              <!-- Flow Arrow 4 -> 5 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 5: Régua de Corte -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[var(--on-surface)] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Régua de Corte
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[var(--primary)] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    Assuntos que só entram após os 80% (Pareto), pois não contribuem significativamente.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_cutoff_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-black text-[var(--tertiary)] bg-[var(--tertiary-container)]/20 px-2.5 py-0.5 rounded-full shadow-sm">Essencial</span>
              </div>

              <!-- Flow Arrow 5 -> 6 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 6: Alertas da Banca -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[var(--on-surface)] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Alertas da Banca
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[var(--primary)] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    Destaca as pegadinhas e padrões de cobrança típicos da banca examinadora.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_alerts_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[var(--secondary)] bg-[var(--secondary)]/15 px-2.5 py-0.5 rounded-full">Padrões e Dicas</span>
              </div>

              <!-- Flow Arrow 6 -> 7 (Animated, Centered with Icon) -->
              <div class="shrink-0 flex items-center justify-center self-start mt-[78px] md:mt-[80px] mx-0.5">
                <img src="assets/animated_arrow_icon.svg" class="w-6 h-6 md:w-7 md:h-7 opacity-90">
              </div>

              <!-- Step 7: Cronograma Adaptado -->
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
                <div class="relative w-full h-14 flex items-center justify-center overflow-hidden">
                  <h3 class="absolute inset-0 text-xs md:text-[13px] font-bold text-[var(--on-surface)] flex items-center justify-center leading-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-3">
                    Cronograma Adaptado
                  </h3>
                  <p class="absolute inset-0 text-[10px] md:text-[11px] font-semibold text-[var(--primary)] flex items-center justify-center text-center leading-snug transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 px-1">
                    O plano de estudos é ajustado ao seu tempo disponível, garantindo ritmo e constância.
                  </p>
                </div>
                <div class="my-1.5 flex items-center justify-center">
                  <img src="assets/flow_schedule_icon.svg" class="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                </div>
                <span class="text-[10px] md:text-[11px] font-extrabold text-[var(--secondary)] bg-[var(--secondary)]/15 px-2.5 py-0.5 rounded-full">Seu Ritmo</span>
              </div>

            </div>

            <!-- Bottom CTA Bar with Glowing Line & Central Button -->
            <div class="mt-6 pt-4 border-t border-[var(--outline-variant)] flex items-center justify-center relative z-10">
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

        <!-- Outras Abas (2 a 5): Envolvidas em seu container neo-raised -->
        <div *ngIf="activeTab !== 'editais'" class="neo-raised rounded-3xl p-5 sm:p-6 md:p-8 bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-lg">

          <!-- 2. Cronogramas Tab -->
        <div *ngIf="activeTab === 'cronogramas'" class="space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-purple-50/80 dark:bg-[#7c3aed]/15 p-4 md:p-6 rounded-3xl border border-purple-200/80 dark:border-[#7c3aed]/30">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md shrink-0">
                <span class="material-symbols-outlined !text-[26px]">calendar_month</span>
              </div>
              <div>
                <h3 class="text-lg font-black text-[var(--on-surface)]">Meu Cronograma de Estudos</h3>
                <p class="text-xs text-[var(--primary)] font-medium">Cada edital tem seu próprio ritmo de estudo configurado por você.</p>
              </div>
            </div>

            <!-- Edital Selector Dropdown & Ver Cronograma Action -->
            <div *ngIf="editais.length > 0" class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div class="flex items-center gap-2">
                <label class="text-xs font-bold text-[var(--on-surface-variant)] whitespace-nowrap">Edital:</label>
                <select
                  [(ngModel)]="selectedCronogramaEditalId"
                  (ngModelChange)="onCronogramaEditalChange($event)"
                  class="neo-pressed rounded-xl px-3 py-2 text-xs font-bold text-[var(--on-surface)] bg-[var(--background)] border border-[var(--outline-variant)] outline-none cursor-pointer focus:border-[var(--primary)] max-w-[260px] truncate">
                  <option *ngFor="let ed of editais" [value]="ed.id">
                    {{ ed.cargo || ed.title }} ({{ ed.concurso || 'Edital' }})
                  </option>
                </select>
              </div>

              <!-- Botão Ver Cronograma no Cabeçalho -->
              <button
                *ngIf="selectedCronogramaEdital"
                (click)="openEditalCronograma(selectedCronogramaEdital.id)"
                class="btn-mesh px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all whitespace-nowrap cursor-pointer"
                title="Abrir Cronograma de Estudos Completo">
                <span class="material-symbols-outlined !text-[18px]">calendar_month</span>
                <span>Ver Cronograma</span>
              </button>
            </div>
          </div>

          <!-- ═══ Empty State: sem editais ═══ -->
          <div *ngIf="editais.length === 0" class="flex flex-col items-center justify-center py-16 text-center gap-4">
            <span class="material-symbols-outlined !text-[64px] text-[var(--outline-variant)]">event_busy</span>
            <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Você ainda não possui editais para gerar um cronograma.</p>
            <p class="text-xs text-[var(--on-surface-variant)] max-w-sm">Adicione um edital ao seu perfil primeiro — vá até a aba <strong>Meus Editais</strong> e clique em "+ Adicionar" em um dos editais recentes.</p>
            <button (click)="activeTab = 'editais'" class="btn-mesh px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined">folder_special</span>Ir para Meus Editais
            </button>
          </div>

          <!-- ═══ Card de Progresso Geral do Edital Selecionado ═══ -->
          <div *ngIf="editais.length > 0 && selectedCronogramaEdital" class="neo-raised rounded-3xl p-5 sm:p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-sm space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md shrink-0">
                  <span class="material-symbols-outlined !text-[26px]">speed</span>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-wider">Progresso Geral</span>
                    <span *ngIf="selectedCronogramaEdital.concurso" class="bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      {{ selectedCronogramaEdital.concurso }}
                    </span>
                    <span *ngIf="selectedCronogramaEdital.pareto_analisado" class="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span class="material-symbols-outlined !text-[12px]">check_circle</span>
                      Pareto Ativo
                    </span>
                  </div>
                  <h4 class="text-base font-black text-[var(--on-surface)] leading-snug">
                    {{ selectedCronogramaEdital.cargo || selectedCronogramaEdital.title }}
                  </h4>
                </div>
              </div>

              <div class="flex items-center gap-2.5 flex-wrap">
                <button
                  (click)="openEditalCronograma(selectedCronogramaEdital.id)"
                  class="btn-mesh px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer">
                  <span class="material-symbols-outlined !text-[18px]">play_circle</span>
                  <span>Abrir Cronograma (Sprints)</span>
                </button>
                <button
                  (click)="openScheduleModal()"
                  class="btn-neo px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-[var(--on-surface)] cursor-pointer">
                  <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">tune</span>
                  <span>{{ selectedUserSchedule ? 'Ajustar Ritmo' : 'Configurar Ritmo' }}</span>
                </button>
              </div>
            </div>

            <!-- Progress Bar & Metrics -->
            <div class="pt-3 border-t border-[var(--outline-variant)]/40 space-y-2">
              <div class="flex justify-between items-center text-xs font-bold">
                <span class="text-[var(--on-surface-variant)] flex items-center gap-1.5">
                  <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">checklist_rtl</span>
                  <span>Conclusão das Metas & Checklist</span>
                </span>
                <span class="text-[var(--primary)] font-black text-sm">{{ selectedCronogramaProgress.percentage }}% Concluído</span>
              </div>

              <div class="w-full h-3 neo-pressed rounded-full overflow-hidden p-0.5">
                <div class="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[#8455ef] rounded-full transition-all duration-500"
                     [style.width.%]="selectedCronogramaProgress.percentage"></div>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[var(--on-surface-variant)] font-semibold pt-1">
                <span>{{ selectedCronogramaProgress.completed }} de {{ selectedCronogramaProgress.total }} assuntos/subtópicos concluídos</span>
                <button (click)="openEditalCronograma(selectedCronogramaEdital.id)" class="text-[var(--primary)] hover:text-[var(--secondary)] font-bold flex items-center gap-1 cursor-pointer transition-colors w-fit">
                  <span>Acessar Cronograma Completo</span>
                  <span class="material-symbols-outlined !text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ═══ Edital selecionado mas sem schedule configurado ═══ -->
          <div *ngIf="editais.length > 0 && selectedCronogramaEdital && !selectedUserSchedule && !loadingSchedule"
               class="neo-raised rounded-3xl p-6 md:p-8 border-2 border-dashed border-[var(--outline-variant)] text-center space-y-4">
            <div class="flex items-center justify-center">
              <div class="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-[#7c3aed]/20 text-[var(--primary)] flex items-center justify-center">
                <span class="material-symbols-outlined !text-[30px]">schedule</span>
              </div>
            </div>
            <h3 class="text-base font-black text-[var(--on-surface)]">Configure seu ritmo de estudos</h3>
            <p class="text-xs text-[var(--on-surface-variant)] max-w-sm mx-auto">
              Para personalizar a carga horária de <strong class="text-[var(--on-surface)]">{{ selectedCronogramaEdital.cargo || selectedCronogramaEdital.title }}</strong>,
              informe quantas horas por dia e dias por semana você pode estudar.
            </p>
            <div class="flex items-center justify-center gap-3 flex-wrap">
              <button
                (click)="openScheduleModal()"
                class="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6b38d4] via-[#5d3bf6] to-[#7c3aed] text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-[#5d3bf6]/30 hover:scale-105 transition-all cursor-pointer">
                <span class="material-symbols-outlined !text-[20px]">tune</span>
                <span>Configurar Ritmo de Estudos</span>
              </button>
              <button
                (click)="openEditalCronograma(selectedCronogramaEdital.id)"
                class="btn-neo px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 text-[var(--on-surface)] hover:text-[var(--primary)] transition-all cursor-pointer">
                <span class="material-symbols-outlined !text-[18px] text-[var(--primary)]">calendar_month</span>
                <span>Ver Cronograma Diretamente</span>
              </button>
            </div>
          </div>

          <!-- Selected Edital Cronograma Card — só aparece quando schedule configurado -->
          <div *ngIf="selectedCronogramaEdital && selectedUserSchedule" class="neo-pressed rounded-3xl p-6 md:p-8 space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--outline-variant)]/40 pb-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 text-[11px] font-extrabold px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                    {{ selectedCronogramaEdital.concurso || 'Concurso Alvo' }}
                  </span>
                  <span *ngIf="selectedCronogramaEdital.cargo" class="bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 border border-purple-200 dark:border-purple-800/50">
                    <span class="material-symbols-outlined !text-[13px]">badge</span>
                    {{ selectedCronogramaEdital.cargo }}
                  </span>
                </div>
                <h2 class="text-xl md:text-2xl font-black text-[var(--on-surface)]">{{ selectedCronogramaEdital.title }}</h2>
              </div>

              <div class="flex items-center gap-3 flex-wrap">
                <!-- Editar configuração -->
                <button (click)="openScheduleModal()" class="btn-neo px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 text-[var(--on-surface)]">
                  <span class="material-symbols-outlined !text-[18px] text-[var(--primary)]">tune</span>
                  <span>Editar Configuração</span>
                </button>
                <!-- Abrir cronograma completo -->
                <button (click)="openEditalCronograma(selectedCronogramaEdital.id)" class="btn-mesh px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all">
                  <span class="material-symbols-outlined !text-[20px]">play_circle</span>
                  <span>Abrir Cronograma Completo (Sprints)</span>
                </button>
              </div>
            </div>

            <!-- Stats Grid — usa dados do user_schedule -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="neo-raised rounded-2xl p-4 text-center">
                <span class="material-symbols-outlined text-[var(--primary)] mb-1">schedule</span>
                <span class="text-[11px] font-bold text-[var(--on-surface-variant)] block">Horas por Dia</span>
                <span class="text-lg font-black text-[var(--on-surface)]">{{ selectedUserSchedule.horas_por_dia || '--' }}h</span>
              </div>
              <div class="neo-raised rounded-2xl p-4 text-center">
                <span class="material-symbols-outlined text-[var(--primary)] mb-1">calendar_view_week</span>
                <span class="text-[11px] font-bold text-[var(--on-surface-variant)] block">Dias por Semana</span>
                <span class="text-lg font-black text-[var(--on-surface)]">{{ selectedUserSchedule.dias_por_semana || '--' }} dias</span>
              </div>
              <div class="neo-raised rounded-2xl p-4 text-center">
                <span class="material-symbols-outlined text-[var(--primary)] mb-1">event</span>
                <span class="text-[11px] font-bold text-[var(--on-surface-variant)] block">Data da Prova</span>
                <span class="text-sm font-black text-[var(--on-surface)] mt-1 block">{{ selectedUserSchedule.data_prova || 'Não informada' }}</span>
              </div>
              <div class="neo-raised rounded-2xl p-4 text-center">
                <span class="material-symbols-outlined text-[var(--secondary)] mb-1">insights</span>
                <span class="text-[11px] font-bold text-[var(--on-surface-variant)] block">Status Análise</span>
                <span class="text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 px-2 py-0.5 rounded-full inline-block mt-1 border border-purple-200 dark:border-purple-800/50">
                  {{ selectedCronogramaEdital.pareto_analisado ? 'Pareto Concluído' : 'Aguardando Pareto' }}
                </span>
              </div>
            </div>

            <!-- Quick Selector Cards for All Saved Editais -->
            <div *ngIf="editais.length > 1" class="pt-4 border-t border-[var(--outline-variant)]/40">
              <p class="text-xs font-bold text-[var(--on-surface-variant)] mb-3">Outros Cronogramas Salvos:</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div 
                  *ngFor="let ed of editais"
                  (click)="selectedCronogramaEditalId = ed.id"
                  [class.border-2]="selectedCronogramaEditalId === ed.id"
                  [class.border-[var(--primary)]]="selectedCronogramaEditalId === ed.id"
                  class="neo-raised rounded-2xl p-3.5 cursor-pointer hover:border-[var(--primary)] transition-all flex items-center justify-between">
                  <div class="truncate">
                    <p class="text-xs font-bold text-[var(--on-surface)] truncate">{{ ed.cargo || ed.title }}</p>
                    <p class="text-[10px] text-[var(--on-surface-variant)] truncate">{{ ed.concurso || 'Edital' }}</p>
                  </div>
                  <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">chevron_right</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Mapa de Disciplinas Tab -->
        <div *ngIf="activeTab === 'mapa'" class="space-y-6">
          <!-- Banner & Edital Selector -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-purple-50/80 dark:bg-[#7c3aed]/15 p-4 md:p-6 rounded-3xl border border-purple-200/80 dark:border-[#7c3aed]/30">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#433fe5] to-[#6b38d4] text-white flex items-center justify-center shadow-md shrink-0">
                <span class="material-symbols-outlined !text-[26px]">map</span>
              </div>
              <div>
                <h3 class="text-lg font-black text-[var(--on-surface)]">Mapa de Disciplinas</h3>
                <p class="text-xs text-[var(--primary)] font-medium">Selecione um edital salvo para explorar sua estrutura em 3 camadas e índice estratégico.</p>
              </div>
            </div>

            <!-- Edital Selector Dropdown -->
            <div *ngIf="editais.length > 0" class="flex items-center gap-2">
              <label class="text-xs font-bold text-[var(--on-surface-variant)] whitespace-nowrap">Escolher Edital:</label>
              <select 
                [(ngModel)]="selectedMapaEditalId"
                class="neo-pressed rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--on-surface)] bg-[var(--background)] border border-[var(--outline-variant)] outline-none cursor-pointer focus:border-[var(--primary)] shadow-sm">
                <option *ngFor="let ed of editais" [value]="ed.id">
                  {{ ed.cargo || ed.title }} — {{ ed.concurso || 'Edital Salvo' }}
                </option>
              </select>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="editais.length === 0" class="flex flex-col items-center justify-center py-16 text-center gap-4">
            <span class="material-symbols-outlined !text-[64px] text-[var(--outline-variant)]">map</span>
            <p class="text-sm font-semibold text-[var(--on-surface-variant)]">Nenhum edital disponível para exibir o Mapa de Disciplinas.</p>
            <button (click)="openUploadModal()" class="btn-mesh px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
              <span class="material-symbols-outlined">add</span>Analisar Novo Edital
            </button>
          </div>

          <!-- Active Edital Mapa Details -->
          <div *ngIf="selectedMapaEdital" class="neo-pressed rounded-3xl p-6 md:p-8 space-y-6">
            <!-- Edital Header Info -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--outline-variant)]/40 pb-6">
              <div>
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span class="bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 text-[11px] font-extrabold px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                    {{ selectedMapaEdital.concurso || 'Edital Salvo' }}
                  </span>
                  <span *ngIf="selectedMapaEdital.cargo" class="bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 border border-purple-200 dark:border-purple-800/50">
                    <span class="material-symbols-outlined !text-[13px]">badge</span>
                    {{ selectedMapaEdital.cargo }}
                  </span>
                  <span class="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/50">
                    <span class="material-symbols-outlined !text-[13px]">check_circle</span>
                    Edital Selecionado
                  </span>
                </div>
                <h2 class="text-xl md:text-2xl font-black text-[var(--on-surface)]">{{ selectedMapaEdital.title }}</h2>
                <p class="text-xs text-[var(--on-surface-variant)] mt-1">Status: {{ selectedMapaEdital.pareto_analisado ? 'Análise Pareto Realizada' : 'Cadastrado / Aguardando Pareto' }}</p>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-3 flex-wrap">
                <button (click)="openEditalMapa(selectedMapaEdital.id)" class="btn-mesh px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all">
                  <span class="material-symbols-outlined !text-[20px]">grid_view</span>
                  <span>Abrir Mapa Geral das Disciplinas</span>
                </button>
                <button *ngIf="selectedMapaEdital.pareto_analisado" (click)="openEditalPareto(selectedMapaEdital.id)" class="btn-neo px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 text-[var(--on-surface)] hover:text-purple-600 transition-all">
                  <span class="material-symbols-outlined !text-[20px] text-[var(--primary)]">analytics</span>
                  <span>Ver Pareto</span>
                </button>
                <button (click)="openParetoModal(selectedMapaEdital)"
                        class="px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105"
                        [ngClass]="selectedMapaEdital.pareto_analisado ? 'btn-neo text-[var(--on-surface)] hover:text-purple-600' : 'btn-mesh'"
                        [title]="selectedMapaEdital.pareto_analisado ? 'Verificar ou Refazer Análise Pareto 80/20' : 'Executar Análise de Pareto com IA'">
                  <span class="material-symbols-outlined !text-[20px]">donut_large</span>
                  <span>{{ selectedMapaEdital.pareto_analisado ? 'Refazer Pareto' : 'Analisar Pareto 80/20' }}</span>
                </button>
              </div>
            </div>

            <!-- Quick Discipline Cards / Visual Pills Selector -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">Alternar entre Editais Salvos para visualizar o Mapa:</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div 
                  *ngFor="let ed of editais"
                  (click)="selectedMapaEditalId = ed.id"
                  [ngClass]="selectedMapaEditalId === ed.id ? 'bg-purple-100/50 dark:bg-[#7c3aed]/20 border-2 border-[var(--primary)]' : ''"
                  class="neo-raised rounded-2xl p-4 cursor-pointer hover:border-[var(--primary)] transition-all flex items-center justify-between">
                  <div class="flex items-center gap-3 truncate">
                    <div class="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200 dark:border-purple-800/50">
                      <span class="material-symbols-outlined !text-[18px]">menu_book</span>
                    </div>
                    <div class="truncate">
                      <p class="text-xs font-bold text-[var(--on-surface)] truncate">{{ ed.cargo || ed.title }}</p>
                      <p class="text-[10px] text-[var(--on-surface-variant)] truncate">{{ ed.concurso || 'Edital' }}</p>
                    </div>
                  </div>
                  <span *ngIf="selectedMapaEditalId === ed.id" class="material-symbols-outlined text-[var(--primary)] !text-[20px] shrink-0">check_circle</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 4. Released Questions Bank Tab -->
        <div *ngIf="activeTab === 'questions'" class="space-y-6">
          <!-- Filtros de Pesquisa -->
          <div class="neo-raised rounded-3xl p-4 sm:p-6 space-y-4 bg-[var(--card-bg)] border border-[var(--outline-variant)]">
            <!-- Header dos Filtros -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--outline-variant)]/30 pb-3">
              <div class="flex flex-wrap items-center gap-2.5 text-[var(--on-surface)]">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[22px]">tune</span>
                <h3 class="font-extrabold text-sm sm:text-base">Filtros de Pesquisa</h3>

                <!-- Badge de quantidade de questões ao lado de Filtros de Pesquisa -->
                <div
                  [class]="hasActiveFilters
                    ? 'flex items-center gap-1.5 px-3 py-1 rounded-xl border font-bold text-xs transition-all duration-300 bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'flex items-center gap-1.5 px-3 py-1 rounded-xl border font-bold text-xs transition-all duration-300 bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'">
                  <span class="material-symbols-outlined !text-[16px]">{{ hasActiveFilters ? 'filter_alt' : 'quiz' }}</span>
                  <span>
                    <strong class="text-[14px]">{{ filteredQuestions.length }}</strong>
                    <span class="font-semibold opacity-80"> / {{ questions.length }}</span>
                    <span class="ml-1 font-semibold">{{ hasActiveFilters ? 'questões localizadas' : 'questões no banco' }}</span>
                  </span>
                </div>

                <span *ngIf="hasActiveFilters" class="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                  Filtros Ativos
                </span>
              </div>
              <div class="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                <button 
                  *ngIf="hasActiveFilters"
                  (click)="clearFilters()"
                  class="text-xs font-bold text-[#ef4444] hover:text-[#dc2626] flex items-center gap-1 transition-colors cursor-pointer neo-pressed px-2.5 py-1.5 rounded-lg">
                  <span class="material-symbols-outlined !text-[16px]">filter_alt_off</span>
                  <span>Limpar Filtros</span>
                </button>

                <!-- Botão Pomodoro no lugar anterior da quantidade de questões -->
                <button 
                  (click)="navigateToPomodoro()" 
                  class="btn-mesh px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer" 
                  title="Timer Pomodoro • Banco de Horas">
                  <span class="text-sm">🍅</span>
                  <span>Pomodoro</span>
                </button>
              </div>
            </div>

            <!-- Filtros Acumulativos: Disciplina, Banca, Ano, Órgão, Cargo -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              <!-- Disciplina -->
              <app-multi-select-filter
                label="Disciplina"
                icon="menu_book"
                placeholder="Todas as Disciplinas"
                [options]="availableDisciplinas"
                [(selected)]="selectedDisciplinas"
                (filterChange)="onFilterChange()">
              </app-multi-select-filter>

              <!-- Banca -->
              <app-multi-select-filter
                label="Banca"
                icon="account_balance"
                placeholder="Todas as Bancas"
                [options]="availableBancas"
                [(selected)]="selectedBancas"
                (filterChange)="onFilterChange()">
              </app-multi-select-filter>

              <!-- Ano -->
              <app-multi-select-filter
                label="Ano"
                icon="calendar_today"
                placeholder="Todos os Anos"
                [options]="availableAnos"
                [(selected)]="selectedAnos"
                (filterChange)="onFilterChange()">
              </app-multi-select-filter>

              <!-- Órgão -->
              <app-multi-select-filter
                label="Órgão"
                icon="domain"
                placeholder="Todos os Órgãos"
                [options]="availableOrgaos"
                [(selected)]="selectedOrgaos"
                (filterChange)="onFilterChange()">
              </app-multi-select-filter>

              <!-- Cargo -->
              <app-multi-select-filter
                label="Cargo"
                icon="badge"
                placeholder="Todos os Cargos"
                [options]="availableCargos"
                [allowCustom]="true"
                [(selected)]="selectedCargos"
                (filterChange)="onFilterChange()">
              </app-multi-select-filter>
            </div>

            <!-- Inputs de Texto: Assunto e Termo no Enunciado -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <!-- Assunto (Input texto) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">topic</span>
                  Assunto
                </label>
                <div class="neo-pressed rounded-xl px-3 py-2 flex items-center gap-2 bg-[var(--background)]">
                  <span class="material-symbols-outlined text-[var(--outline)] !text-[16px]">topic</span>
                  <input 
                    type="text"
                    [(ngModel)]="filterAssunto" 
                    (ngModelChange)="onFilterChange()"
                    placeholder="Digite o termo do assunto..."
                    class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] placeholder:text-[var(--outline)]">
                  <button 
                    *ngIf="filterAssunto" 
                    type="button" 
                    (click)="filterAssunto = ''; onFilterChange()" 
                    class="text-[var(--outline)] hover:text-[var(--on-surface)] text-xs cursor-pointer">✕</button>
                </div>
              </div>

              <!-- Palavra-chave no enunciado -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">search</span>
                  Termo no Enunciado
                </label>
                <div class="neo-pressed rounded-xl px-3 py-2 flex items-center gap-2 bg-[var(--background)]">
                  <span class="material-symbols-outlined text-[var(--outline)] !text-[16px]">search</span>
                  <input 
                    type="text"
                    [(ngModel)]="searchSubject" 
                    (ngModelChange)="onFilterChange()"
                    placeholder="Buscar palavra-chave..."
                    class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] placeholder:text-[var(--outline)]">
                  <button 
                    *ngIf="searchSubject" 
                    type="button" 
                    (click)="searchSubject = ''; onFilterChange()" 
                    class="text-[var(--outline)] hover:text-[var(--on-surface)] text-xs cursor-pointer">✕</button>
                </div>
              </div>
            </div>

            <!-- Chips de Filtros Ativos -->
            <div *ngIf="hasActiveFilterChips" class="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-[var(--outline-variant)]/20">
              <span class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1 mr-1">
                <span class="material-symbols-outlined !text-[14px] text-[var(--primary)]">filter_alt</span>
                Filtros ativos:
              </span>

              <span *ngFor="let d of selectedDisciplinas" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                <span class="opacity-70 text-[10px]">Disciplina:</span>
                <strong class="font-bold">{{ d }}</strong>
                <button type="button" (click)="removeFilterItem('disciplina', d)" class="hover:opacity-75 cursor-pointer ml-0.5 font-bold">✕</button>
              </span>

              <span *ngFor="let b of selectedBancas" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <span class="opacity-70 text-[10px]">Banca:</span>
                <strong class="font-bold">{{ b }}</strong>
                <button type="button" (click)="removeFilterItem('banca', b)" class="hover:opacity-75 cursor-pointer ml-0.5 font-bold">✕</button>
              </span>

              <span *ngFor="let a of selectedAnos" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <span class="opacity-70 text-[10px]">Ano:</span>
                <strong class="font-bold">{{ a }}</strong>
                <button type="button" (click)="removeFilterItem('ano', a)" class="hover:opacity-75 cursor-pointer ml-0.5 font-bold">✕</button>
              </span>

              <span *ngFor="let o of selectedOrgaos" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span class="opacity-70 text-[10px]">Órgão:</span>
                <strong class="font-bold">{{ o }}</strong>
                <button type="button" (click)="removeFilterItem('orgao', o)" class="hover:opacity-75 cursor-pointer ml-0.5 font-bold">✕</button>
              </span>

              <span *ngFor="let c of selectedCargos" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <span class="opacity-70 text-[10px]">Cargo:</span>
                <strong class="font-bold">{{ c }}</strong>
                <button type="button" (click)="removeFilterItem('cargo', c)" class="hover:opacity-75 cursor-pointer ml-0.5 font-bold">✕</button>
              </span>

              <button type="button" (click)="clearFilters()" class="text-[11px] font-bold text-red-500 hover:underline cursor-pointer ml-2">
                Limpar todos
              </button>
            </div>
          </div>

          <!-- Filtro de Status: Todas / Resolvidas / Erradas -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
              <span class="material-symbols-outlined !text-[14px]">filter_list</span>
              Status:
            </span>
            <!-- Todas -->
            <button
              (click)="questionStatusFilter = 'all'; onFilterChange()"
              [ngClass]="questionStatusFilter === 'all'
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-[var(--background)] text-[var(--on-surface-variant)] border-[var(--outline-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)]'"
              class="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined !text-[14px]">list</span>
              <span>Todas</span>
              <span class="font-extrabold opacity-70">({{ questions.length }})</span>
            </button>
            <!-- Resolvidas -->
            <button
              (click)="questionStatusFilter = 'resolved'; onFilterChange()"
              [ngClass]="questionStatusFilter === 'resolved'
                ? 'bg-[#16a34a] text-white border-[#16a34a]'
                : 'bg-[var(--background)] text-[var(--on-surface-variant)] border-[var(--outline-variant)] hover:border-[#16a34a] hover:text-[#16a34a]'"
              class="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined !text-[14px]">check_circle</span>
              <span>Resolvidas</span>
              <span class="font-extrabold opacity-70">({{ resolvedCount + wrongCount }})</span>
            </button>
            <!-- Erradas -->
            <button
              (click)="questionStatusFilter = 'wrong'; onFilterChange()"
              [ngClass]="questionStatusFilter === 'wrong'
                ? 'bg-[#dc2626] text-white border-[#dc2626]'
                : 'bg-[var(--background)] text-[var(--on-surface-variant)] border-[var(--outline-variant)] hover:border-[#dc2626] hover:text-[#dc2626]'"
              class="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined !text-[14px]">cancel</span>
              <span>Erradas</span>
              <span class="font-extrabold opacity-70">({{ wrongCount }})</span>
            </button>
          </div>

          <div class="flex flex-col gap-4 sm:gap-5">
            <app-question-card 
              *ngFor="let q of paginatedQuestions; let i = index" 
              [question]="q" 
              [index]="(questionsCurrentPage - 1) * questionsPageSize + i"
              [isResolved]="isQuestionResolved(q)"
              [isWrong]="isQuestionWrong(q)"
              (answerSubmitted)="onAnswerSubmitted($event)">
            </app-question-card>

            <app-pagination
              [currentPage]="questionsCurrentPage"
              [totalItems]="filteredQuestions.length"
              [pageSize]="questionsPageSize"
              (pageChange)="onQuestionsPageChange($event)">
            </app-pagination>
          </div>
        </div>

        <!-- 5. Meu Perfil -->
        <div *ngIf="activeTab === 'perfil'" class="max-w-2xl mx-auto">
          <app-user-profile [user]="user"></app-user-profile>
        </div>

      </div>
    </div>

    <!-- ===== EDIT MODAL ===== -->
    <div *ngIf="showEditModal"
         class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
         style="background: rgba(10,12,20,0.65); backdrop-filter: blur(8px);">
      <div class="neo-raised rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn my-auto flex flex-col max-h-[92vh] bg-white dark:bg-[#141927] border border-[var(--outline-variant)]">

        <!-- Modal Header -->
        <div class="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-[var(--outline-variant)] shrink-0">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl neo-raised flex items-center justify-center text-[var(--primary)] shrink-0">
              <span class="material-symbols-outlined !text-[18px] sm:!text-[20px]">edit_document</span>
            </div>
            <div class="truncate">
              <h2 class="text-sm sm:text-base font-bold text-[var(--on-surface)] truncate">Editar Edital</h2>
              <p class="text-[10px] sm:text-[11px] text-[var(--on-surface-variant)] truncate">{{ editingEdital?.title }}</p>
            </div>
          </div>
          <button (click)="closeEditModal()" class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[var(--on-surface-variant)] hover:text-red-500 transition-colors shrink-0">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="px-4 sm:px-6 py-4 sm:py-5 space-y-3 overflow-y-auto flex-1">

          <!-- Informação sobre re-análise -->
          <div class="bg-purple-100/70 dark:bg-[#7c3aed]/20 rounded-xl px-3 py-2.5 flex items-start gap-2 text-[11px] text-purple-800 dark:text-[#c084fc] border border-purple-200/60 dark:border-[#7c3aed]/30">
            <span class="material-symbols-outlined !text-[15px] shrink-0 mt-0.5">info</span>
            <span><strong>Salvar</strong> atualiza os dados do contexto. <strong>Salvar e Reenviar</strong> refaz toda a análise Pareto com IA.</span>
          </div>

          <!-- Título Principal do Edital (Edital para análise) -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">description</span>
            <input
              [(ngModel)]="editTitle"
              type="text"
              placeholder="Título Principal (Edital para análise - Ex: Concurso TCU 2026) *"
              class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
          </div>

          <!-- Cargo -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">badge</span>
            <input
              [(ngModel)]="editCargo"
              type="text"
              placeholder="Cargo *"
              class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
          </div>

          <!-- Concurso -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">emoji_events</span>
            <input
              [(ngModel)]="editConcurso"
              type="text"
              placeholder="Concurso alvo"
              class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
          </div>

          <!-- Data da prova -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">event</span>
            <input
              [(ngModel)]="editDataProva"
              type="date"
              [min]="today"
              class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)]">
          </div>

          <!-- Horas/dia + Dias/semana -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">schedule</span>
              <input
                [(ngModel)]="editHorasPorDia"
                type="number"
                min="0.5" max="24" step="0.5"
                placeholder="Horas/dia"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">calendar_view_week</span>
              <input
                [(ngModel)]="editDiasPorSemana"
                type="number"
                min="1" max="7" step="1"
                placeholder="Dias/semana"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>
          </div>

          <!-- Seção de re-análise: novo arquivo/link (opcional) -->
          <div class="rounded-xl border border-dashed border-[var(--outline-variant)] p-3 space-y-2">
            <p class="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[14px]">refresh</span>
              Re-análise (opcional — somente para "Salvar e Reenviar")
            </p>
            <!-- Modo link / pdf -->
            <div class="flex gap-1.5 bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg">
              <button type="button"
                (click)="editUploadMode = 'none'"
                [ngClass]="editUploadMode === 'none' ? 'bg-white dark:bg-[#1e2438] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
                class="flex-1 py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition-all">Sem novo arquivo</button>
              <button type="button"
                (click)="editUploadMode = 'link'"
                [ngClass]="editUploadMode === 'link' ? 'bg-white dark:bg-[#1e2438] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
                class="flex-1 py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition-all">Novo Link</button>
              <button type="button"
                (click)="editUploadMode = 'pdf'"
                [ngClass]="editUploadMode === 'pdf' ? 'bg-white dark:bg-[#1e2438] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
                class="flex-1 py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition-all">Novo PDF</button>
            </div>

            <div *ngIf="editUploadMode === 'link'" class="neo-pressed rounded-lg p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[16px]">link</span>
              <input [(ngModel)]="editLink" type="text" placeholder="Cole aqui a URL do edital"
                class="w-full bg-transparent border-none outline-none text-xs text-[var(--on-surface)]">
            </div>

            <div *ngIf="editUploadMode === 'pdf'" class="neo-pressed rounded-xl p-4 border-2 border-dashed border-[var(--outline-variant)] flex flex-col items-center text-center relative hover:border-[var(--primary)] transition-colors cursor-pointer bg-[var(--background)]">
              <span class="material-symbols-outlined !text-[28px] text-[var(--primary)] mb-1">picture_as_pdf</span>
              <p class="text-xs font-semibold text-[var(--on-surface)] truncate max-w-xs">{{ editFile ? editFile.name : 'Selecionar novo PDF' }}</p>
              <input type="file" (change)="onEditFileSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
          </div>

          <!-- Toast do modal -->
          <div *ngIf="showEditToast"
               class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
               [ngClass]="editToastType === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'">
            <span class="material-symbols-outlined !text-[16px]">{{ editToastType === 'success' ? 'check_circle' : 'error' }}</span>
            <span>{{ editToastMsg }}</span>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-4 sm:px-6 pb-5 pt-3 border-t border-[var(--outline-variant)] flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
          <button
            (click)="closeEditModal()"
            class="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
            Cancelar
          </button>
          <button
            (click)="saveEditalContext()"
            [disabled]="!editCargo.trim() || isSaving"
            class="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold btn-neo flex items-center justify-center gap-1.5 text-[var(--on-surface)]">
            <span class="material-symbols-outlined !text-[18px]">save</span>
            <span>{{ isSaving ? 'Salvando...' : 'Salvar' }}</span>
          </button>
          <button
            (click)="saveAndReanalyze()"
            [disabled]="!editCargo.trim() || isSaving || isReanalyzing"
            class="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold btn-mesh flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined !text-[18px]">{{ isReanalyzing ? 'hourglass_top' : 'auto_awesome' }}</span>
            <span>{{ isReanalyzing ? 'Analisando...' : 'Salvar e Reenviar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===== UPLOAD EDITAL MODAL ===== -->
    <div *ngIf="showUploadModal"
         class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
         style="background: rgba(10, 12, 20, 0.65); backdrop-filter: blur(8px);">
      <div class="neo-raised rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeIn bg-white dark:bg-[#141927] border border-[var(--outline-variant)] my-auto flex flex-col max-h-[92vh]">

        <!-- Modal Header -->
        <div class="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-[var(--outline-variant)] bg-gradient-to-r from-purple-50/70 dark:from-[#1b2238] to-white dark:to-[#141927] shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-all duration-300"
                 [ngClass]="{
                   'bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white': uploadStatus === 'idle' || uploadStatus === 'processing',
                   'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white': uploadStatus === 'completed',
                   'bg-gradient-to-tr from-rose-500 to-red-600 text-white': uploadStatus === 'error'
                 }">
              <span class="material-symbols-outlined !text-[20px] sm:!text-[22px]"
                    [ngClass]="{'animate-spin': uploadStatus === 'processing'}">
                {{ uploadStatus === 'error' ? 'report_problem' : (uploadStatus === 'completed' ? 'task_alt' : (uploadStatus === 'processing' ? 'sync' : (uploadModalStep === 'suggest' ? 'tips_and_updates' : 'cloud_upload'))) }}
              </span>
            </div>
            <div>
              <h2 class="text-sm sm:text-base font-extrabold text-[var(--on-surface)]">
                {{ uploadStatus === 'error' ? 'Instabilidade no Serviço' :
                   (uploadStatus === 'completed' ? 'Edital pronto para a Análise Pareto 80/20 !' :
                   (uploadStatus === 'processing' ? 'Processando Edital com IA...' :
                   (uploadModalStep === 'suggest' ? 'Editais Analisados Disponíveis' : 'Enviar Edital para Análise'))) }}
              </h2>
              <p class="text-[10px] sm:text-[11px] font-semibold"
                 [ngClass]="uploadStatus === 'error' ? 'text-red-500' : (uploadStatus === 'completed' ? 'text-emerald-500' : 'text-[var(--primary)]')">
                {{ uploadStatus === 'error' ? 'Serviço temporariamente instável' :
                   (uploadStatus === 'completed' ? 'Disciplinas e conteúdos programáticos catalogados com êxito' :
                   (uploadStatus === 'processing' ? 'Princípio Pareto 80/20 • Extração Cognitiva' :
                   (uploadModalStep === 'suggest' ? 'Economize tempo adicionando um edital já analisado' : 'Preencha as informações para o seu plano estratégico'))) }}
              </p>
            </div>
          </div>
          <button (click)="closeUploadModal()" [disabled]="uploadStatus === 'processing'"
                  class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[var(--on-surface-variant)] hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                  [title]="uploadStatus === 'processing' ? 'Aguarde o término do processamento' : 'Fechar'">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>

        <!-- ================= ETAPA 1: SUGESTÃO DE EDITAIS JÁ ANALISADOS (uploadStatus === 'idle' && uploadModalStep === 'suggest') ================= -->
        <div *ngIf="uploadStatus === 'idle' && uploadModalStep === 'suggest'" class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto flex-1 animate-fadeIn">
          
          <!-- Banner Informativo: Sugestão de Consultar Primeiro -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/30 dark:border-purple-500/40 text-[var(--on-surface)] space-y-2">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <span class="material-symbols-outlined !text-[22px]">lightbulb</span>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-xs sm:text-sm font-black text-purple-950 dark:text-purple-200">
                    Já existem editais analisados disponíveis!
                  </h3>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-500/30 flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[12px]">bolt</span> Mais rápido
                  </span>
                </div>
                <p class="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                  Sugerimos consultar a lista abaixo antes de enviar um novo arquivo. Adicionar um edital pronto ao seu perfil é <strong>instantâneo</strong> (sem tempo de espera de processamento por IA) e você já começa a estudar na hora!
                </p>
              </div>
            </div>
          </div>

          <!-- Caixa de Busca Rápida -->
          <div class="neo-pressed rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 bg-[var(--background)] border border-[var(--outline-variant)]">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[20px]">search</span>
            <input
              [(ngModel)]="popularSearchQuery"
              type="text"
              placeholder="Buscar edital pronto (ex: TCU, PF, Receita, SEFAZ, BB...)"
              class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]">
            <button *ngIf="popularSearchQuery" (click)="popularSearchQuery = ''" class="text-slate-400 hover:text-slate-600 text-xs">
              <span class="material-symbols-outlined !text-[16px]">close</span>
            </button>
          </div>

          <!-- Seção dos Editais Mais Procurados -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-xs font-black text-[var(--on-surface)]">
                <span class="material-symbols-outlined text-amber-500 !text-[18px]">trending_up</span>
                <span>Editais Mais Procurados e Populares</span>
              </div>
              <span class="text-[10px] font-bold text-[var(--on-surface-variant)]">
                {{ filteredPopularEditais.length }} disponível(is)
              </span>
            </div>

            <!-- Loading state -->
            <div *ngIf="loadingPopularEditais" class="space-y-2">
              <div *ngFor="let _ of [1,2,3]" class="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse h-16"></div>
            </div>

            <!-- Lista dos mais procurados -->
            <div *ngIf="!loadingPopularEditais" class="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              <div *ngFor="let ed of filteredPopularEditais"
                   class="p-3 sm:p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--outline-variant)] hover:border-purple-400/60 dark:hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                
                <!-- Info Left -->
                <div class="space-y-1 flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 text-[10px] font-extrabold border border-purple-200 dark:border-purple-700/50">
                      {{ getEditalOrgao(ed) }}
                    </span>
                    <span *ngIf="getEditalBancaName(ed)" class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                      {{ getEditalBancaName(ed) }}
                    </span>
                    <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <span class="material-symbols-outlined !text-[13px]">verified</span> Pareto 80/20 Pronto
                    </span>
                  </div>
                  <h4 class="text-xs sm:text-sm font-black text-[var(--on-surface)] truncate" [title]="ed.title || ed.cargo">
                    {{ ed.cargo || ed.title }}
                  </h4>
                  <p *ngIf="ed.concurso && ed.concurso !== ed.cargo" class="text-[11px] text-[var(--on-surface-variant)] truncate">
                    {{ ed.concurso }}
                  </p>
                </div>

                <!-- Action Right -->
                <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <!-- Se já está no perfil -->
                  <span *ngIf="isEditalAlreadyAdded(ed.id) && newlyAddedEditalId !== ed.id"
                        class="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[15px]">check_circle</span>
                    <span>Adicionado</span>
                  </span>

                  <!-- Se acabou de adicionar nesta sessão -->
                  <div *ngIf="newlyAddedEditalId === ed.id" class="flex items-center gap-1.5 animate-fadeIn">
                    <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <span class="material-symbols-outlined !text-[15px]">task_alt</span> Adicionado!
                    </span>
                    <button (click)="openDisciplinasPage(ed.id)"
                            class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer">
                      <span>Abrir Mapa</span>
                      <span class="material-symbols-outlined !text-[14px]">arrow_forward</span>
                    </button>
                  </div>

                  <!-- Botão para adicionar -->
                  <button *ngIf="!isEditalAlreadyAdded(ed.id) && newlyAddedEditalId !== ed.id"
                          (click)="addPopularEdital(ed)"
                          [disabled]="addingSuggestedEditalId === ed.id"
                          class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50">
                    <span class="material-symbols-outlined !text-[15px]">{{ addingSuggestedEditalId === ed.id ? 'hourglass_top' : 'add_circle' }}</span>
                    <span>{{ addingSuggestedEditalId === ed.id ? 'Adicionando...' : '+ Adicionar ao Perfil' }}</span>
                  </button>
                </div>

              </div>

              <!-- Sem resultados na busca -->
              <div *ngIf="filteredPopularEditais.length === 0" class="p-6 text-center text-xs text-[var(--on-surface-variant)] space-y-1">
                <span class="material-symbols-outlined !text-[28px] text-slate-400">search_off</span>
                <p class="font-bold">Nenhum edital pronto encontrado para "{{ popularSearchQuery }}".</p>
                <p class="text-[11px]">Você pode consultar o catálogo completo ou enviar o seu arquivo abaixo.</p>
              </div>
            </div>
          </div>

          <!-- Ações Inferiores: Consultar Catálogo Completo ou Enviar Novo -->
          <div class="pt-2 flex flex-col gap-3">
            <div class="flex items-center justify-between text-xs px-1">
              <button (click)="goToCatalogAndClose()"
                      class="text-[var(--primary)] hover:underline font-bold flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined !text-[16px]">apps</span>
                <span>Consultar acervo completo no Catálogo de Editais</span>
                <span class="material-symbols-outlined !text-[14px]">arrow_forward</span>
              </button>
            </div>

            <!-- Divisor -->
            <div class="relative flex items-center justify-center pt-2">
              <div class="w-full border-t border-[var(--outline-variant)]"></div>
              <span class="absolute bg-white dark:bg-[#141927] px-3 text-[10px] font-extrabold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Não encontrou seu concurso?
              </span>
            </div>

            <!-- Botão para avançar para o upload de novo edital -->
            <button
              (click)="goToUploadForm()"
              class="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-purple-400/80 dark:border-purple-500/60 hover:border-purple-600 dark:hover:border-purple-400 bg-purple-50/40 dark:bg-purple-950/10 text-purple-900 dark:text-purple-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shadow-xs">
              <span class="material-symbols-outlined !text-[18px] text-purple-600 dark:text-purple-400">cloud_upload</span>
              <span>Enviar Novo Edital (PDF ou Link) para Análise</span>
            </button>
          </div>

        </div>

        <!-- ================= ETAPA 2: FORMULÁRIO (uploadStatus === 'idle' && uploadModalStep === 'form') ================= -->
        <div *ngIf="uploadStatus === 'idle' && uploadModalStep === 'form'" class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto flex-1 animate-fadeIn">

          <!-- Botão Voltar para sugestões -->
          <div class="flex items-center justify-between">
            <button (click)="uploadModalStep = 'suggest'"
                    class="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer">
              <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
              <span>Voltar para editais já analisados</span>
            </button>
            <span class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">Novo Upload</span>
          </div>

          <p class="text-xs text-[var(--on-surface-variant)] leading-relaxed">
            Preencha os dados do seu concurso e edital. A IA aplicará o princípio de Pareto 80/20 para gerar seu mapa de prioridades, régua de corte e cronograma personalizado.
          </p>

          <!-- Contexto do Candidato -->
          <div class="rounded-2xl border border-[var(--outline-variant)] bg-purple-50/40 dark:bg-white/[0.02] p-3 sm:p-4 space-y-3">
            <p class="text-[11px] font-extrabold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">person</span>
              Contexto do Candidato
            </p>

            <!-- Título do Edital -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">description</span>
              <input
                [(ngModel)]="editalTitle"
                type="text"
                placeholder="Título do Edital (Ex: Concurso TCU 2026)"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <!-- Concurso Alvo -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">emoji_events</span>
              <input
                [(ngModel)]="editalConcurso"
                type="text"
                placeholder="Concurso alvo (Ex: SEFAZ-RS 2026)"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <!-- Cargo -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">badge</span>
              <input
                [(ngModel)]="editalCargo"
                type="text"
                placeholder="Cargo (Ex: Auditor Fiscal da Receita Estadual) *"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <!-- Data da prova (opcional no upload) -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">event</span>
              <input
                [(ngModel)]="editalDataProva"
                type="date"
                [min]="today"
                placeholder="Data da prova (opcional)"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <!-- Info: horas/dia serão configuradas depois -->
            <div class="bg-purple-100/70 dark:bg-[#7c3aed]/20 rounded-xl px-3 py-2.5 flex items-start gap-2 text-[11px] text-purple-800 dark:text-[#c084fc] border border-purple-200/60 dark:border-[#7c3aed]/30">
              <span class="material-symbols-outlined !text-[15px] shrink-0 mt-0.5">info</span>
              <span>Após adicionar o edital ao seu perfil, você poderá configurar seu ritmo de estudos (horas/dia, dias/semana) na aba <strong>Cronogramas</strong>.</span>
            </div>

          </div>

          <!-- Modo de upload (Link / PDF) -->
          <div class="flex gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              (click)="editalUploadMode = 'link'"
              [ngClass]="editalUploadMode === 'link' ? 'bg-white dark:bg-[#1e2438] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer">
              Link do Edital
            </button>
            <button
              type="button"
              (click)="editalUploadMode = 'pdf'"
              [ngClass]="editalUploadMode === 'pdf' ? 'bg-white dark:bg-[#1e2438] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer">
              Arquivo PDF
            </button>
          </div>

          <div class="space-y-3">
            <div *ngIf="editalUploadMode === 'link'" class="neo-pressed rounded-xl p-3 flex items-center bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] mr-2 shrink-0">link</span>
              <input
                [(ngModel)]="editalLink"
                type="text"
                placeholder="Cole aqui a URL do edital"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm px-1 text-[var(--on-surface)]">
            </div>

            <div *ngIf="editalUploadMode === 'pdf'" class="neo-pressed rounded-2xl p-5 sm:p-6 border-2 border-dashed border-[var(--outline-variant)] flex flex-col items-center justify-center text-center relative hover:border-[var(--primary)] transition-colors cursor-pointer bg-[var(--background)]">
              <span class="material-symbols-outlined !text-[36px] sm:!text-[40px] text-[var(--primary)] mb-1">picture_as_pdf</span>
              <p class="text-xs font-semibold text-[var(--on-surface)] truncate max-w-xs">
                {{ selectedFile ? selectedFile.name : 'Selecionar Edital em PDF' }}
              </p>
              <input type="file" (change)="onFileSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
          </div>

          <!-- Toast Feedback -->
          <div *ngIf="showUploadToast"
               class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
               [ngClass]="uploadToastType === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'">
            <span class="material-symbols-outlined !text-[16px] shrink-0">
              {{ uploadToastType === 'success' ? 'check_circle' : 'error' }}
            </span>
            <span>{{ uploadToastMsg }}</span>
          </div>

        </div>

        <!-- ================= MODO 2: SIMULAÇÃO DE LOGS IA (uploadStatus !== 'idle') ================= -->
        <div *ngIf="uploadStatus !== 'idle'" class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto flex-1 animate-fadeIn">

          <!-- Top Progress Card -->
          <div class="rounded-2xl p-4 neo-pressed bg-[var(--background)] border border-[var(--outline-variant)] space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full"
                      [ngClass]="uploadStatus === 'error' ? 'bg-red-500' : (uploadStatus === 'completed' ? 'bg-emerald-500' : 'bg-[#7c3aed] animate-ping')">
                </span>
                <span class="text-xs font-extrabold uppercase tracking-wider"
                      [ngClass]="uploadStatus === 'error' ? 'text-red-500' : (uploadStatus === 'completed' ? 'text-emerald-500' : 'text-[var(--primary)]')">
                  {{ uploadStatus === 'error' ? 'Processamento Interrompido' : (uploadStatus === 'completed' ? 'Processamento Finalizado com Sucesso' : 'Executando Análise Pareto 80/20') }}
                </span>
              </div>
              <span class="text-sm font-black text-[var(--on-surface)]">{{ uploadProgress }}%</span>
            </div>

            <!-- Animated Bar -->
            <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
              <div class="h-full rounded-full transition-all duration-500 ease-out"
                   [style.width.%]="uploadProgress"
                   [ngClass]="uploadStatus === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' : (uploadStatus === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-[#5d3bf6] via-[#7c3aed] to-[#c084fc]')">
              </div>
            </div>

            <p class="text-[11px] text-[var(--on-surface-variant)] flex items-center justify-between flex-wrap gap-1">
              <span>Cargo Alvo: <strong class="text-[var(--on-surface)]">{{ editalCargo || 'Não informado' }}</strong></span>
              <span *ngIf="editalConcurso" class="truncate max-w-[220px] text-right">Concurso: <strong class="text-[var(--on-surface)]">{{ editalConcurso }}</strong></span>
            </p>
          </div>

          <!-- ================= ALERTA E APRESENTAÇÃO DE MENSAGEM DE SUCESSO NO FINAL DA ANÁLISE ================= -->
          <div *ngIf="uploadStatus === 'completed'"
               class="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white dark:from-emerald-950/40 dark:via-[#131b24] dark:to-[#141927] border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-100 flex flex-col gap-4 animate-fadeIn shadow-xl shadow-emerald-500/10">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20">
                <span class="material-symbols-outlined !text-[28px]">verified</span>
              </div>
              <div class="space-y-1 flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <h3 class="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100">
                    Edital pronto para a Análise Pareto 80/20 !
                  </h3>
                  <span class="text-[10px] sm:text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-500/40 flex items-center gap-1">
                    <span class="material-symbols-outlined !text-[14px]">check_circle</span> Pronto
                  </span>
                </div>
                <p class="text-xs text-emerald-800/90 dark:text-emerald-200/90 leading-relaxed">
                  O edital para <strong>{{ editalCargo || 'o cargo selecionado' }}</strong> foi extraído e estruturado com sucesso. As disciplinas e o conteúdo programático foram catalogados. O edital já está pronto para você consultar o mapa das disciplinas ou realizar a Análise de Pareto 80/20!
                </p>
              </div>
            </div>

            <!-- Resumo das Conquistas da Estruturação -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-center">
              <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Disciplinas</span>
                <span class="text-sm font-black text-indigo-600 dark:text-indigo-400">Estruturadas</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Conteúdo</span>
                <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">Catalogado</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Questões</span>
                <span class="text-sm font-black text-purple-600 dark:text-purple-400">Vinculadas</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Próximo Passo</span>
                <span class="text-sm font-black text-amber-600 dark:text-amber-400">Pareto 80/20 ⚡</span>
              </div>
            </div>

            <!-- Ações Diretas no Card de Sucesso: Mapa das Disciplinas e Análise de Pareto -->
            <div class="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                (click)="goToDisciplinas()"
                class="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700/60 shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-outlined !text-[18px] text-purple-700 dark:text-purple-300">grid_view</span>
                <span>Mapa das Disciplinas</span>
              </button>

              <button
                (click)="goToPareto()"
                class="w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-outlined !text-[18px]">donut_large</span>
                <span>Análise de Pareto</span>
                <span class="material-symbols-outlined !text-[16px]">arrow_forward</span>
              </button>

              <button
                (click)="closeUploadModalAfterSuccess()"
                class="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                Painel
              </button>
            </div>
          </div>

          <!-- Alerta de Instabilidade em Caso de Erro -->
          <div *ngIf="uploadStatus === 'error'"
               class="rounded-2xl p-4 bg-red-500/10 border-2 border-red-500/30 dark:border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-3 animate-fadeIn">
            <span class="material-symbols-outlined !text-[24px] text-red-500 shrink-0 mt-0.5">cloud_off</span>
            <div class="space-y-1 text-xs">
              <h4 class="font-extrabold text-red-600 dark:text-red-400 text-xs sm:text-sm">
                Instabilidade no Serviço
              </h4>
              <p class="leading-relaxed">
                {{ uploadErrorMessage || 'O serviço está passando por alguma instabilidade no momento. Por favor, tente novamente mais tarde.' }}
              </p>
              <p class="text-[11px] text-[var(--on-surface-variant)] pt-1">
                Suas informações continuam salvas. Clique no botão abaixo para tentar novamente quando desejar.
              </p>
            </div>
          </div>

          <!-- Timeline / Terminal de Logs -->
          <div id="edital-logs-container" class="rounded-2xl p-3.5 sm:p-4 bg-slate-900/95 dark:bg-[#0b0e17] text-slate-100 border border-purple-500/20 shadow-inner max-h-[300px] sm:max-h-[340px] overflow-y-auto space-y-2.5 scroll-smooth">
            <div class="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full"
                      [ngClass]="uploadStatus === 'error' ? 'bg-red-400' : (uploadStatus === 'completed' ? 'bg-emerald-400' : 'bg-purple-400 animate-ping')"></span>
                <span>LOGS DE PROCESSAMENTO DA IA</span>
              </span>
              <span>PARETO ENGINE 80/20</span>
            </div>

            <div *ngFor="let step of analysisLogs; let i = index"
                 [id]="'edital-log-step-' + i"
                 [attr.data-active]="step.status === 'active'"
                 [attr.data-status]="step.status"
                 class="p-2.5 rounded-xl transition-all duration-300 flex items-start gap-3"
                 [ngClass]="{
                   'bg-emerald-500/10 border border-emerald-500/30': step.status === 'completed',
                   'bg-purple-500/15 border border-purple-500/40 shadow-sm': step.status === 'active',
                   'bg-red-500/15 border border-red-500/40': step.status === 'error',
                   'bg-white/[0.02] border border-white/5 opacity-50': step.status === 'pending'
                 }">

              <!-- Icon Circle -->
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 text-white transition-colors"
                   [ngClass]="{
                     'bg-emerald-500 shadow-md shadow-emerald-500/20': step.status === 'completed',
                     'bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] shadow-md shadow-purple-500/30': step.status === 'active',
                     'bg-red-500 shadow-md shadow-red-500/20': step.status === 'error',
                     'bg-white/10 text-slate-400': step.status === 'pending'
                   }">
                <span class="material-symbols-outlined !text-[16px] sm:!text-[18px]"
                      [ngClass]="{'animate-spin': step.status === 'active'}">
                  {{ step.status === 'completed' ? 'check' : (step.status === 'error' ? 'close' : (step.status === 'active' ? 'sync' : step.icon)) }}
                </span>
              </div>

              <!-- Log Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="text-xs font-bold truncate"
                      [ngClass]="{
                        'text-emerald-300': step.status === 'completed',
                        'text-purple-300 font-extrabold': step.status === 'active',
                        'text-red-300': step.status === 'error',
                        'text-slate-400': step.status === 'pending'
                      }">
                    {{ step.title }}
                  </h4>

                  <!-- Status Badge -->
                  <span class="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0"
                        [ngClass]="{
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': step.status === 'completed',
                          'bg-purple-500/30 text-purple-200 border border-purple-400/40 animate-pulse': step.status === 'active',
                          'bg-red-500/20 text-red-300 border border-red-500/30': step.status === 'error',
                          'bg-white/5 text-slate-500': step.status === 'pending'
                        }">
                    {{ step.status === 'completed' ? 'Concluído' : (step.status === 'active' ? 'Processando...' : (step.status === 'error' ? 'Falha' : 'Aguardando')) }}
                  </span>
                </div>

                <p class="text-[11px] mt-0.5 leading-snug"
                   [ngClass]="step.status === 'pending' ? 'text-slate-500' : 'text-slate-300'">
                  {{ step.detail }}
                </p>

                <span *ngIf="step.time" class="text-[9px] font-mono text-slate-500 mt-1 block">
                  {{ step.time }}
                </span>
              </div>
            </div>

          </div>

        </div>

        <!-- Modal Footer -->
        <div class="px-4 sm:px-6 pb-5 pt-3 border-t border-[var(--outline-variant)] shrink-0">
          <!-- Footer na etapa de sugestões -->
          <div *ngIf="uploadStatus === 'idle' && uploadModalStep === 'suggest'" class="flex items-center justify-between gap-3">
            <span class="text-[11px] text-[var(--on-surface-variant)]">Adicione um edital pronto ou envie um novo arquivo</span>
            <button
              (click)="closeUploadModal()"
              class="px-5 py-2.5 rounded-xl text-xs font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
              Fechar
            </button>
          </div>

          <!-- Footer na etapa de formulário -->
          <div *ngIf="uploadStatus === 'idle' && uploadModalStep === 'form'" class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              (click)="uploadModalStep = 'suggest'"
              [disabled]="isSubmitting"
              class="w-full sm:w-1/3 py-3 rounded-xl text-xs sm:text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50 cursor-pointer">
              Voltar
            </button>
            <button
              (click)="submitEdital()"
              [disabled]="!isEditalFormValid || isSubmitting"
              class="w-full sm:flex-1 py-3 rounded-2xl font-black btn-mesh flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">auto_awesome</span>
              <span>Analisar Edital Pareto 80/20</span>
            </button>
          </div>

          <!-- Footer when processing -->
          <div *ngIf="uploadStatus === 'processing'" class="flex items-center justify-between gap-3 py-1">
            <div class="flex items-center gap-2 text-xs text-[var(--on-surface-variant)]">
              <span class="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping"></span>
              <span>O edital está sendo processado por completo. Por favor, aguarde...</span>
            </div>
            <span class="text-xs font-bold text-[var(--primary)] shrink-0">{{ uploadProgress }}%</span>
          </div>

          <!-- Footer when completed -->
          <div *ngIf="uploadStatus === 'completed'" class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              (click)="closeUploadModalAfterSuccess()"
              class="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
              Fechar
            </button>
            <button
              (click)="goToDisciplinas()"
              class="w-full sm:flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">grid_view</span>
              <span>Mapa das Disciplinas</span>
            </button>
            <button
              (click)="goToPareto()"
              class="w-full sm:flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] transition-all cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">donut_large</span>
              <span>Análise de Pareto</span>
              <span class="material-symbols-outlined !text-[16px]">arrow_forward</span>
            </button>
          </div>

          <!-- Footer when error -->
          <div *ngIf="uploadStatus === 'error'" class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              (click)="closeUploadModal()"
              class="w-full sm:w-1/3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              Fechar
            </button>
            <button
              (click)="retryUploadForm()"
              class="w-full sm:flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 shadow-md transition-all">
              <span class="material-symbols-outlined !text-[18px]">refresh</span>
              <span>Voltar e Tentar Novamente</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- MODAL: Configurar Cronograma (horas/dia, dias/semana)       -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div *ngIf="showScheduleModal"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         (click)="closeScheduleModal()">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div class="relative bg-white dark:bg-[#141927] border border-[var(--outline-variant)] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
           (click)="$event.stopPropagation()">

        <!-- Header do modal -->
        <div class="p-5 sm:p-6 border-b border-[var(--outline-variant)] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
              <span class="material-symbols-outlined !text-[22px]">tune</span>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-black text-[var(--on-surface)]">Configurar Cronograma</h3>
              <p class="text-[11px] text-[var(--on-surface-variant)]">Defina seu ritmo de estudos para este edital</p>
            </div>
          </div>
          <button (click)="closeScheduleModal()" class="w-8 h-8 rounded-xl neo-pressed flex items-center justify-center text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>

        <!-- Corpo do modal -->
        <div class="p-5 sm:p-6 space-y-4">

          <!-- Edital selecionado (read-only info) -->
          <div *ngIf="scheduleEditalId" class="bg-purple-50/70 dark:bg-[#7c3aed]/15 border border-purple-200/60 dark:border-[#7c3aed]/30 rounded-xl px-4 py-3">
            <p class="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wide mb-0.5">Edital</p>
            <p class="text-xs font-bold text-[var(--on-surface)] truncate">{{ scheduleEditalLabel }}</p>
          </div>

          <!-- Data da prova -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
              <span class="material-symbols-outlined !text-[14px]">event</span>
              Data da Prova
            </label>
            <div class="neo-pressed rounded-xl p-3 flex items-center gap-2 bg-[var(--background)]">
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
            <div class="neo-pressed rounded-xl p-3 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">schedule</span>
              <input
                [(ngModel)]="scheduleHorasPorDia"
                type="number"
                min="0.5" max="24" step="0.5"
                placeholder="Ex: 2"
                class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
              <span class="text-xs text-[var(--on-surface-variant)] shrink-0">h/dia</span>
            </div>
          </div>

          <!-- Dias por semana -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
              <span class="material-symbols-outlined !text-[14px]">calendar_view_week</span>
              Dias de Estudo por Semana <span class="text-red-500">*</span>
            </label>
            <div class="neo-pressed rounded-xl p-3 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">calendar_view_week</span>
              <input
                [(ngModel)]="scheduleDiasPorSemana"
                type="number"
                min="1" max="7" step="1"
                placeholder="Ex: 5"
                class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
              <span class="text-xs text-[var(--on-surface-variant)] shrink-0">dias</span>
            </div>
          </div>

          <!-- Preview dinâmico -->
          <div *ngIf="scheduleHorasPorDia && scheduleDiasPorSemana" class="bg-purple-100/70 dark:bg-[#7c3aed]/20 border border-purple-200/60 dark:border-[#7c3aed]/30 rounded-xl px-4 py-3 flex items-center gap-2 text-[11px] font-semibold text-purple-800 dark:text-[#c084fc] flex-wrap">
            <span class="material-symbols-outlined !text-[15px] shrink-0">insights</span>
            <span>{{ scheduleHorasPorDia }}h/dia × {{ scheduleDiasPorSemana }} dias = <strong>{{ scheduleHorasPorDia * scheduleDiasPorSemana }}h/semana</strong></span>
          </div>

        </div>

        <!-- Footer do modal -->
        <div class="px-5 sm:px-6 pb-5 pt-3 border-t border-[var(--outline-variant)] flex gap-3">
          <button
            (click)="closeScheduleModal()"
            [disabled]="isSavingSchedule"
            class="flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            (click)="saveSchedule()"
            [disabled]="!scheduleHorasPorDia || !scheduleDiasPorSemana || isSavingSchedule"
            class="flex-1 py-3 rounded-2xl font-bold btn-mesh flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50">
            <span class="material-symbols-outlined !text-[18px]">{{ isSavingSchedule ? 'hourglass_empty' : 'save' }}</span>
            <span>{{ isSavingSchedule ? 'Salvando...' : 'Salvar Cronograma' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Modal de Simulação de Logs da Análise Pareto 80/20 -->
    <app-pareto-analysis-modal
      [isOpen]="showParetoModal"
      [editalId]="paretoModalEditalId"
      [editalData]="paretoModalEdital"
      [userContext]="getParetoUserContext()"
      (closed)="showParetoModal = false"
      (existingSelected)="showParetoModal = false"
      (analysisCompleted)="onParetoCompleted($event)">
    </app-pareto-analysis-modal>

  `
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  user: UserProfile | null = null;
  editais: any[] = [];
  questions: any[] = [];
  activeTab: 'editais' | 'cronogramas' | 'mapa' | 'questions' | 'perfil' | 'estatisticas' = 'editais';

  // Modal de Análise Pareto
  showParetoModal = false;
  paretoModalEditalId = '';
  paretoModalEdital: any = null;

  openParetoModal(edital?: any) {
    const target = edital || this.selectedMapaEdital || this.editais[0];
    if (!target) return;
    this.paretoModalEdital = target;
    this.paretoModalEditalId = target.id;
    this.showParetoModal = true;
  }

  openParetoFromFlow() {
    const target = this.selectedMapaEdital || this.editais[0];
    if (target) {
      this.openParetoModal(target);
    } else {
      this.activeTab = 'editais';
    }
  }

  getParetoUserContext() {
    if (!this.paretoModalEdital) return {};
    return {
      cargo: this.paretoModalEdital.cargo || 'Cargo Principal',
      concurso: this.paretoModalEdital.concurso || this.paretoModalEdital.title || 'Edital Oficial',
      dataProva: this.paretoModalEdital.data_prova,
      horasPorDia: this.paretoModalEdital.horas_por_dia || 4,
      diasPorSemana: this.paretoModalEdital.dias_por_semana || 5,
    };
  }

  onParetoCompleted(updatedEdital: any) {
    this.loadData();
  }

  get formattedQuestionsCount(): string {
    const count = this.questions ? this.questions.length : 0;
    return count > 0 ? count.toLocaleString('pt-BR') : '6.227';
  }
  selectedMapaEditalId: string | null = null;
  selectedCronogramaEditalId: string | null = null;

  // ---- Editais Recentes Globais ----
  recentEditais: any[] = [];
  loadingRecentEditais = false;
  addingEditalId: string | null = null;

  // ---- User Schedules (cronograma por user+edital) ----
  userSchedules: Record<string, any> = {}; // keyed by editalId
  loadingSchedule = false;

  // ---- Schedule Modal (configurar ritmo de estudos) ----
  showScheduleModal = false;
  scheduleEditalId: string | null = null;
  scheduleHorasPorDia: number | null = null;
  scheduleDiasPorSemana: number | null = null;
  scheduleDataProva = '';
  isSavingSchedule = false;

  // ---- Upload Modal state ----
  showUploadModal = false;
  uploadModalStep: 'suggest' | 'form' = 'suggest';
  popularEditais: any[] = [];
  loadingPopularEditais = false;
  popularSearchQuery = '';
  addingSuggestedEditalId: string | null = null;
  newlyAddedEditalId: string | null = null;
  completedEditalId: string | null = null;

  // ---- Simulação de Logs de Processamento IA ----
  uploadStatus: 'idle' | 'processing' | 'completed' | 'error' = 'idle';
  uploadProgress = 0;
  uploadLogInterval: any = null;
  uploadErrorMessage = '';
  analysisLogs: AnalysisLogStep[] = [];

  // ---- Upload form ----
  editalTitle = '';
  editalLink = '';
  editalCargo = '';
  editalConcurso = '';
  editalDataProva = '';
  editalUploadMode: 'link' | 'pdf' = 'link';
  selectedFile: File | null = null;
  isSubmitting = false;

  // ---- Questions Filters (Acumulativos / Múltipla Seleção) ----
  searchSubject = '';
  selectedDisciplinas: string[] = [];
  selectedBancas: string[] = [];
  selectedAnos: (number | string)[] = [];
  selectedOrgaos: string[] = [];
  selectedCargos: string[] = [];
  filterAssunto = '';

  // Getters/setters para compatibilidade legada
  get selectedDisciplina(): string { return this.selectedDisciplinas[0] || ''; }
  set selectedDisciplina(val: string) { this.selectedDisciplinas = val ? [val] : []; }

  get selectedBanca(): string { return this.selectedBancas[0] || ''; }
  set selectedBanca(val: string) { this.selectedBancas = val ? [val] : []; }

  get selectedAno(): string { return this.selectedAnos[0] ? String(this.selectedAnos[0]) : ''; }
  set selectedAno(val: string) { this.selectedAnos = val ? [val] : []; }

  get selectedOrgao(): string { return this.selectedOrgaos[0] || ''; }
  set selectedOrgao(val: string) { this.selectedOrgaos = val ? [val] : []; }

  get filterCargo(): string { return this.selectedCargos[0] || ''; }
  set filterCargo(val: string) { this.selectedCargos = val ? [val] : []; }
  questionsCurrentPage = 1;
  questionsPageSize = 10;
  selectedAnswers: { [key: string]: string } = {};
  sessionAnswers: Record<string, { selectedOption: string; isCorrect: boolean; disciplina: string }> = {};
  /** Filtro de status: 'all' | 'resolved' | 'wrong' */
  questionStatusFilter: 'all' | 'resolved' | 'wrong' = 'all';
  /** Mapa de respostas do usuário: question_id → { isCorrect } (carregado do Supabase + sessão) */
  userAnswerMap: Record<string, { isCorrect: boolean }> = {};

  // ---- Toast (upload) ----
  uploadToastMsg = '';
  uploadToastType: 'success' | 'error' = 'success';
  showUploadToast = false;

  // ---- Dismiss ----
  dismissConfirmId: string | null = null;

  // ---- Edit modal ----
  showEditModal = false;
  editingEdital: any = null;
  editTitle = '';
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

  // ---- Edital Progress Map ----
  editalProgressMap: Record<string, { percentage: number; completed: number; total: number }> = {};

  // ---- Acerto por Disciplina (persistido no Supabase) ----
  accuracyByDisciplina: { disciplina: string; total: number; corretas: number; pct: number }[] = [];

  // ---- Sessões de Estudo Pomodoro (Banco de Horas) ----
  studySessions: any[] = [];

  // ---- Email verification banner ----
  emailBannerDismissed = false;
  isResendingVerify = false;
  resendVerifySuccess = false;

  // Expose authService to template
  readonly authService = this.authServiceRef;

  constructor(
    private apiService: ApiService,
    private authServiceRef: AuthService,
    private router: Router,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit() {
    this.user = this.authServiceRef.getCurrentUser();
    this.loadSavedAnswers();
    this.loadData();
    this.loadRecentEditais();
    this.loadAccuracyStats();
    this.loadUserAnswerMap();
    this.loadStudySessions();

    this.supabaseService.session$.subscribe(session => {
      if (session?.user) {
        this.loadAccuracyStats();
        this.loadUserAnswerMap();
        this.loadStudySessions();
      }
    });
  }

  async loadStudySessions() {
    try {
      this.studySessions = await this.supabaseService.getStudySessions({ limite: 500 });
    } catch (e) {
      console.warn('Erro ao carregar sessões de estudo Pomodoro:', e);
    }
  }

  async resendVerificationEmail() {
    if (this.isResendingVerify) return;
    this.isResendingVerify = true;
    this.resendVerifySuccess = false;
    try {
      const email = this.authServiceRef.getCurrentUser()?.email ?? '';
      await this.supabaseService.resendConfirmationEmail(email);
      this.resendVerifySuccess = true;
    } catch (err) {
      console.error('Erro ao reenviar confirmação:', err);
    } finally {
      this.isResendingVerify = false;
    }
  }

  private getStorageKey(): string {
    const uid = this.user?.id || 'default_user';
    return `aprovando_user_answers_${uid}`;
  }

  loadSavedAnswers() {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sessionAnswers) this.sessionAnswers = { ...parsed.sessionAnswers };
        if (parsed.selectedAnswers) this.selectedAnswers = { ...parsed.selectedAnswers };
      }
    } catch (e) {
      console.warn('Erro ao carregar respostas do localStorage:', e);
    }
  }

  saveAnswersToStorage() {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify({
        sessionAnswers: this.sessionAnswers,
        selectedAnswers: this.selectedAnswers
      }));
    } catch (e) {
      console.warn('Erro ao salvar respostas no localStorage:', e);
    }
  }

  async loadAccuracyStats() {
    this.accuracyByDisciplina = await this.supabaseService.getAccuracyByDisciplina();
  }

  /**
   * Carrega do Supabase o mapa de questões já respondidas pelo usuário.
   * Mescla com os dados da sessão atual (sessionAnswers) para garantir consistência.
   */
  async loadUserAnswerMap() {
    const supabaseMap = await this.supabaseService.getUserAnswerMap();
    // Mescla: Supabase é a base, session sobrescreve (mais recente)
    const merged: Record<string, { isCorrect: boolean }> = { ...supabaseMap };
    for (const [id, ans] of Object.entries(this.sessionAnswers)) {
      merged[id] = { isCorrect: ans.isCorrect };
    }
    this.userAnswerMap = merged;
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
          this.loadUserSchedule(this.editais[0].id);
        }
        this.editais.forEach(ed => this.calculateEditalProgress(ed));
      }
      // Recarrega editais recentes após atualizar a lista (exclui os já adicionados)
      this.loadRecentEditais();
    });
    this.apiService.getQuestions(true).subscribe(qs => this.questions = qs || []);
  }

  loadRecentEditais() {
    if (!this.user?.id) return;
    this.loadingRecentEditais = true;
    this.apiService.getRecentPublicEditais(this.user.id, 4).subscribe({
      next: (eds) => {
        this.recentEditais = eds || [];
        this.loadingRecentEditais = false;
      },
      error: () => { this.loadingRecentEditais = false; }
    });
  }

  loadUserSchedule(editalId: string) {
    if (!this.user?.id || !editalId) return;
    if (this.userSchedules[editalId] !== undefined) return; // já carregado
    this.loadingSchedule = true;
    this.apiService.getUserSchedule(this.user.id, editalId).subscribe({
      next: (res) => {
        this.userSchedules[editalId] = res?.data || null;
        this.loadingSchedule = false;
      },
      error: () => {
        this.userSchedules[editalId] = null;
        this.loadingSchedule = false;
      }
    });
  }

  onCronogramaEditalChange(editalId: string) {
    this.selectedCronogramaEditalId = editalId;
    this.loadUserSchedule(editalId);
    const ed = this.editais.find(e => e.id === editalId);
    if (ed) {
      this.calculateEditalProgress(ed);
    }
  }

  get selectedCronogramaProgress(): { percentage: number; completed: number; total: number } {
    if (!this.selectedCronogramaEditalId) return { percentage: 0, completed: 0, total: 0 };
    return this.editalProgressMap[this.selectedCronogramaEditalId] || { percentage: 0, completed: 0, total: 0 };
  }

  async calculateEditalProgress(edital: any): Promise<{ percentage: number; completed: number; total: number }> {
    if (!edital?.id) return { percentage: 0, completed: 0, total: 0 };
    try {
      const stored = localStorage.getItem(`edital_checklist_${edital.id}`);
      let checkedMap = stored ? JSON.parse(stored) : {};

      if (!stored || Object.keys(checkedMap).length === 0) {
        const remoteMap = await this.supabaseService.getUserEditalChecklist(edital.id);
        if (remoteMap && Object.keys(remoteMap).length > 0) {
          checkedMap = remoteMap;
          localStorage.setItem(`edital_checklist_${edital.id}`, JSON.stringify(checkedMap));
        }
      }

      const disciplines = this.extractDisciplines(edital);
      let totalSubtopics = 0;
      let completedSubtopics = 0;

      disciplines.forEach((disc: any) => {
        const discName = disc.nome;
        (disc.camada_2_topicos || []).forEach((topic: any) => {
          const topicName = topic.nome;
          const topicKey = `${discName}::${topicName}::__TOPIC__`;
          const isTopicChecked = !!checkedMap[topicKey];

          const subs = topic.camada_3_subtopicos || [];
          if (subs.length > 0) {
            subs.forEach((sub: any) => {
              totalSubtopics++;
              const subName = typeof sub === 'string' ? sub : (sub.nome || sub.name || 'Subtópico');
              const subKey = `${discName}::${topicName}::${subName}`;
              if (isTopicChecked || !!checkedMap[subKey]) {
                completedSubtopics++;
              }
            });
          } else {
            totalSubtopics++;
            if (isTopicChecked || !!checkedMap[`${discName}::${topicName}::${topicName}`]) {
              completedSubtopics++;
            }
          }
        });
      });

      const percentage = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;
      const result = { percentage, completed: completedSubtopics, total: totalSubtopics };
      this.editalProgressMap[edital.id] = result;
      return result;
    } catch (e) {
      console.error('Erro ao ler progresso do edital:', e);
      return { percentage: 0, completed: 0, total: 0 };
    }
  }

  private extractDisciplines(editalInput: any): any[] {
    let pd = editalInput?.pareto_data || editalInput || {};
    if (typeof pd === 'string') {
      try { pd = JSON.parse(pd); } catch (e) { }
    }

    let basicas: any[] = [];
    let especificas: any[] = [];

    if (pd?.mapa_geral?.disciplinas_basicas) {
      basicas = pd.mapa_geral.disciplinas_basicas;
    } else if (pd?.disciplinas_basicas) {
      basicas = pd.disciplinas_basicas;
    }

    if (pd?.mapa_geral?.disciplinas_especificas) {
      especificas = pd.mapa_geral.disciplinas_especificas;
    } else if (pd?.disciplinas_especificas) {
      especificas = pd.disciplinas_especificas;
    }

    if (basicas.length > 0 || especificas.length > 0) {
      return [...basicas, ...especificas];
    }

    if (pd?.mapa_geral?.disciplinas) {
      return pd.mapa_geral.disciplinas;
    }
    if (pd?.disciplinas) {
      return pd.disciplinas;
    }
    return [];
  }

  get selectedUserSchedule(): any {
    if (!this.selectedCronogramaEditalId) return null;
    return this.userSchedules[this.selectedCronogramaEditalId] || null;
  }

  get scheduleEditalLabel(): string {
    if (!this.scheduleEditalId) return 'Edital Selecionado';
    const ed = this.editais.find(e => e.id === this.scheduleEditalId);
    return ed ? (ed.cargo || ed.title || 'Edital Selecionado') : 'Edital Selecionado';
  }

  /** Adiciona um edital recente ao perfil do user */
  addEditalToProfile(ed: any) {
    if (!this.user?.id) return;
    this.addingEditalId = ed.id;
    this.apiService.sendEditalToUser(ed.id, this.user.id).subscribe({
      next: () => {
        this.addingEditalId = null;
        this.loadData(); // recarrega Meus Editais e atualiza lista de recentes
      },
      error: () => { this.addingEditalId = null; }
    });
  }

  goToCatalog() {
    this.router.navigate(['/editais-catalog']);
  }

  navigateToPomodoro() {
    this.router.navigate(['/pomodoro']);
  }

  // ---- Helper methods for Recent Editais Model ----
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

  getEditalBancaName(ed: any): string {
    if (!ed) return 'FGV';
    return ed.banca ||
      ed.concurso_info?.banca ||
      ed.pareto_data?.concurso_info?.banca ||
      ed.pareto_data?.alertas_banca?.banca_identificada ||
      'FGV';
  }

  getEditalBanca(ed: any): BancaInfo | null {
    const name = this.getEditalBancaName(ed);
    return getBancaInfo(name);
  }

  getEditalBancaLogo(ed: any): string | null {
    const name = this.getEditalBancaName(ed);
    return getBancaLogo(name);
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

  // ---- Schedule Modal ----

  openScheduleModal(editalId?: string) {
    const id = editalId || this.selectedCronogramaEditalId;
    if (!id) return;
    this.scheduleEditalId = id;
    const existing = this.userSchedules[id];
    this.scheduleHorasPorDia = existing?.horas_por_dia || null;
    this.scheduleDiasPorSemana = existing?.dias_por_semana || null;
    this.scheduleDataProva = existing?.data_prova || '';
    this.showScheduleModal = true;
  }

  closeScheduleModal() {
    if (!this.isSavingSchedule) {
      this.showScheduleModal = false;
      this.scheduleEditalId = null;
    }
  }

  saveSchedule() {
    if (!this.user?.id || !this.scheduleEditalId) return;
    if (!this.scheduleHorasPorDia || !this.scheduleDiasPorSemana) return;
    this.isSavingSchedule = true;
    this.apiService.saveUserSchedule({
      userId: this.user.id,
      editalId: this.scheduleEditalId,
      horas_por_dia: this.scheduleHorasPorDia,
      dias_por_semana: this.scheduleDiasPorSemana,
      data_prova: this.scheduleDataProva || undefined,
    }).subscribe({
      next: (res) => {
        // Atualiza cache local
        if (this.scheduleEditalId) {
          this.userSchedules[this.scheduleEditalId] = res?.data || {
            horas_por_dia: this.scheduleHorasPorDia,
            dias_por_semana: this.scheduleDiasPorSemana,
            data_prova: this.scheduleDataProva,
          };
        }
        this.isSavingSchedule = false;
        this.showScheduleModal = false;
      },
      error: () => { this.isSavingSchedule = false; }
    });
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

  // ---- Filter Logic ----
  onFilterChange() {
    this.questionsCurrentPage = 1;
  }

  clearFilters() {
    this.searchSubject = '';
    this.selectedDisciplinas = [];
    this.selectedBancas = [];
    this.selectedAnos = [];
    this.selectedOrgaos = [];
    this.selectedCargos = [];
    this.filterAssunto = '';
    this.questionStatusFilter = 'all';
    this.questionsCurrentPage = 1;
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.searchSubject?.trim() ||
      this.selectedDisciplinas.length > 0 ||
      this.selectedBancas.length > 0 ||
      this.selectedAnos.length > 0 ||
      this.selectedOrgaos.length > 0 ||
      this.selectedCargos.length > 0 ||
      this.filterAssunto?.trim() ||
      this.questionStatusFilter !== 'all'
    );
  }

  get hasActiveFilterChips(): boolean {
    return (
      this.selectedDisciplinas.length > 0 ||
      this.selectedBancas.length > 0 ||
      this.selectedAnos.length > 0 ||
      this.selectedOrgaos.length > 0 ||
      this.selectedCargos.length > 0
    );
  }

  removeFilterItem(type: 'disciplina' | 'banca' | 'ano' | 'orgao' | 'cargo', value: string | number) {
    if (type === 'disciplina') {
      this.selectedDisciplinas = this.selectedDisciplinas.filter(item => item !== value);
    } else if (type === 'banca') {
      this.selectedBancas = this.selectedBancas.filter(item => item !== value);
    } else if (type === 'ano') {
      this.selectedAnos = this.selectedAnos.filter(item => String(item) !== String(value));
    } else if (type === 'orgao') {
      this.selectedOrgaos = this.selectedOrgaos.filter(item => item !== value);
    } else if (type === 'cargo') {
      this.selectedCargos = this.selectedCargos.filter(item => item !== value);
    }
    this.onFilterChange();
  }

  get availableDisciplinas(): string[] {
    if (!this.questions) return [];
    const set = new Set<string>();
    for (const q of this.questions) {
      const val = q.disciplina || q.subject;
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  get availableBancas(): string[] {
    if (!this.questions) return [];
    const set = new Set<string>();
    for (const q of this.questions) {
      const val = q.banca;
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  get availableAnos(): (number | string)[] {
    if (!this.questions) return [];
    const set = new Set<number | string>();
    for (const q of this.questions) {
      if (q.ano != null && q.ano !== '') {
        set.add(String(q.ano).trim());
      }
    }
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }

  get availableOrgaos(): string[] {
    if (!this.questions) return [];
    const set = new Set<string>();
    for (const q of this.questions) {
      const val = q.orgao;
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  get availableCargos(): string[] {
    if (!this.questions) return [];
    const set = new Set<string>();
    for (const q of this.questions) {
      const val = q.cargo;
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  get filteredQuestions(): any[] {
    if (!this.questions || this.questions.length === 0) return [];

    return this.questions.filter(q => {
      // 0. Filtro de status (Resolvidas / Erradas)
      if (this.questionStatusFilter !== 'all') {
        const qId = String(q.id_qc || q.id || q.codigo || '');
        const answerEntry = this.userAnswerMap[qId];
        if (this.questionStatusFilter === 'resolved') {
          if (!answerEntry) return false; // não respondida
        } else if (this.questionStatusFilter === 'wrong') {
          if (!answerEntry || answerEntry.isCorrect) return false; // não respondida ou correta
        }
      }

      // 1. Disciplina (Múltipla Seleção Acumulativa)
      if (this.selectedDisciplinas && this.selectedDisciplinas.length > 0) {
        const disc = (q.disciplina || q.subject || '').toString().toLowerCase().trim();
        const match = this.selectedDisciplinas.some(d => String(d).toLowerCase().trim() === disc);
        if (!match) return false;
      }

      // 2. Banca (Múltipla Seleção Acumulativa)
      if (this.selectedBancas && this.selectedBancas.length > 0) {
        const banca = (q.banca || '').toString().toLowerCase().trim();
        const match = this.selectedBancas.some(b => String(b).toLowerCase().trim() === banca);
        if (!match) return false;
      }

      // 3. Ano (Múltipla Seleção Acumulativa)
      if (this.selectedAnos && this.selectedAnos.length > 0) {
        const anoStr = String(q.ano || '').trim();
        const match = this.selectedAnos.some(a => String(a).trim() === anoStr);
        if (!match) return false;
      }

      // 4. Órgão (Múltipla Seleção Acumulativa)
      if (this.selectedOrgaos && this.selectedOrgaos.length > 0) {
        const orgao = (q.orgao || '').toString().toLowerCase().trim();
        const match = this.selectedOrgaos.some(o => String(o).toLowerCase().trim() === orgao);
        if (!match) return false;
      }

      // 5. Cargo (Múltipla Seleção Acumulativa)
      if (this.selectedCargos && this.selectedCargos.length > 0) {
        const cargo = (q.cargo || '').toString().toLowerCase().trim();
        const match = this.selectedCargos.some(c => {
          const target = String(c).toLowerCase().trim();
          return cargo === target || cargo.includes(target) || target.includes(cargo);
        });
        if (!match) return false;
      }

      // 6. Assunto (Input de texto)
      if (this.filterAssunto && this.filterAssunto.trim() !== '') {
        const assunto = (q.assunto || q.topic || '').toString().toLowerCase();
        if (!assunto.includes(this.filterAssunto.trim().toLowerCase())) return false;
      }

      // 7. General search term
      if (this.searchSubject && this.searchSubject.trim() !== '') {
        const term = this.searchSubject.trim().toLowerCase();
        const matchGeneral =
          (q.subject && q.subject.toString().toLowerCase().includes(term)) ||
          (q.topic && q.topic.toString().toLowerCase().includes(term)) ||
          (q.statement && q.statement.toString().toLowerCase().includes(term)) ||
          (q.disciplina && q.disciplina.toString().toLowerCase().includes(term)) ||
          (q.assunto && q.assunto.toString().toLowerCase().includes(term)) ||
          (q.enunciado && q.enunciado.toString().toLowerCase().includes(term)) ||
          (q.cargo && q.cargo.toString().toLowerCase().includes(term)) ||
          (q.banca && q.banca.toString().toLowerCase().includes(term)) ||
          (q.orgao && q.orgao.toString().toLowerCase().includes(term));

        if (!matchGeneral) return false;
      }

      return true;
    });
  }

  /** Número de questões resolvidas (acertadas) */
  get resolvedCount(): number {
    return Object.values(this.userAnswerMap).filter(a => a.isCorrect).length;
  }

  /** Número de questões respondidas e erradas */
  get wrongCount(): number {
    return Object.values(this.userAnswerMap).filter(a => !a.isCorrect).length;
  }

  /** Helpers para binding nos cards */
  isQuestionResolved(q: any): boolean {
    const qId = String(q.id_qc || q.id || q.codigo || '');
    return qId in this.userAnswerMap;
  }

  isQuestionWrong(q: any): boolean {
    const qId = String(q.id_qc || q.id || q.codigo || '');
    return qId in this.userAnswerMap && !this.userAnswerMap[qId].isCorrect;
  }

  get paginatedQuestions() {
    const start = (this.questionsCurrentPage - 1) * this.questionsPageSize;
    return this.filteredQuestions.slice(start, start + this.questionsPageSize);
  }

  onQuestionsPageChange(page: number) {
    this.questionsCurrentPage = page;
  }

  get isEditalFormValid(): boolean {
    const hasFile = this.editalUploadMode === 'pdf'
      ? !!this.selectedFile
      : !!this.editalLink?.trim();
    return (
      hasFile &&
      !!this.editalCargo?.trim()
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
    return 0; // agora calculado via user_schedules
  }

  ngOnDestroy(): void {
    this.clearUploadLogInterval();
  }

  private getCurrentTimeStr(): string {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  }

  openUploadModal() {
    this.uploadStatus = 'idle';
    this.uploadModalStep = 'suggest';
    this.isSubmitting = false;
    this.uploadErrorMessage = '';
    this.showUploadModal = true;
    this.showUploadToast = false;
    this.popularSearchQuery = '';
    this.newlyAddedEditalId = null;
    this.loadPopularEditais();
  }

  closeUploadModal() {
    if (this.uploadStatus === 'processing') return;
    this.clearUploadLogInterval();
    this.uploadStatus = 'idle';
    this.uploadModalStep = 'suggest';
    this.isSubmitting = false;
    this.showUploadModal = false;
    this.showUploadToast = false;
    this.newlyAddedEditalId = null;
  }

  goToUploadForm() {
    this.uploadModalStep = 'form';
    this.uploadStatus = 'idle';
    this.isSubmitting = false;
  }

  loadPopularEditais() {
    this.loadingPopularEditais = true;
    this.apiService.getPublicEditais().subscribe({
      next: (eds) => {
        const completed = (eds || []).filter((e: any) => e.status === 'completed');
        if (completed.length > 0) {
          this.popularEditais = completed;
        } else if (this.recentEditais && this.recentEditais.length > 0) {
          this.popularEditais = this.recentEditais;
        } else {
          this.popularEditais = this.getDefaultPopularEditais();
        }
        this.loadingPopularEditais = false;
      },
      error: () => {
        this.popularEditais = (this.recentEditais && this.recentEditais.length > 0) ? this.recentEditais : this.getDefaultPopularEditais();
        this.loadingPopularEditais = false;
      }
    });
  }

  getDefaultPopularEditais(): any[] {
    return [
      {
        id: 'tcu-auditor-2026',
        title: 'Tribunal de Contas da União',
        concurso: 'TCU 2026',
        cargo: 'Auditor Federal de Controle Externo',
        banca: 'FGV',
        status: 'completed',
        pareto_data: { coverage_percentage: 80, high_priority_subjects: 4, total_hot_topics: 18 }
      },
      {
        id: 'rfb-auditor-2026',
        title: 'Receita Federal do Brasil',
        concurso: 'Receita Federal 2026',
        cargo: 'Auditor-Fiscal da Receita Federal',
        banca: 'FGV',
        status: 'completed',
        pareto_data: { coverage_percentage: 80, high_priority_subjects: 5, total_hot_topics: 22 }
      },
      {
        id: 'pf-agente-2026',
        title: 'Polícia Federal',
        concurso: 'Polícia Federal 2026',
        cargo: 'Agente de Polícia Federal',
        banca: 'Cebraspe',
        status: 'completed',
        pareto_data: { coverage_percentage: 80, high_priority_subjects: 4, total_hot_topics: 16 }
      },
      {
        id: 'sefaz-auditor-2026',
        title: 'Secretaria da Fazenda Estadual',
        concurso: 'SEFAZ 2026',
        cargo: 'Auditor Fiscal da Receita Estadual',
        banca: 'FGV',
        status: 'completed',
        pareto_data: { coverage_percentage: 80, high_priority_subjects: 5, total_hot_topics: 20 }
      }
    ];
  }

  get filteredPopularEditais(): any[] {
    const list = this.popularEditais || [];
    if (!this.popularSearchQuery?.trim()) {
      return list.slice(0, 4);
    }
    const q = this.popularSearchQuery.toLowerCase().trim();
    return list.filter(e =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.cargo || '').toLowerCase().includes(q) ||
      (e.concurso || '').toLowerCase().includes(q) ||
      (e.banca || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }

  isEditalAlreadyAdded(editalId: string): boolean {
    if (!editalId) return false;
    return (this.editais || []).some(e => e.id === editalId);
  }

  addPopularEdital(ed: any) {
    if (!this.user?.id || !ed) return;
    if (this.isEditalAlreadyAdded(ed.id)) return;

    this.addingSuggestedEditalId = ed.id;
    this.apiService.sendEditalToUser(ed.id, this.user.id).subscribe({
      next: () => {
        this.addingSuggestedEditalId = null;
        this.newlyAddedEditalId = ed.id;
        this.loadData();
      },
      error: () => {
        this.addingSuggestedEditalId = null;
        this.newlyAddedEditalId = ed.id;
        this.loadData();
      }
    });
  }

  goToCatalogAndClose() {
    this.closeUploadModal();
    this.goToCatalog();
  }

  openDisciplinasPage(editalId: string) {
    this.closeUploadModal();
    this.router.navigate(['/disciplinas', editalId]);
  }

  goToDisciplinas(targetId?: string) {
    const id = targetId || this.completedEditalId || (this.editais.length > 0 ? this.editais[0].id : null);
    this.closeUploadModal();
    if (id) {
      this.router.navigate(['/disciplinas', id]);
    }
  }

  goToPareto(targetId?: string) {
    const id = targetId || this.completedEditalId || (this.editais.length > 0 ? this.editais[0].id : null);
    this.closeUploadModal();
    if (id) {
      this.router.navigate(['/pareto', id]);
    }
  }

  goToCompletedEdital() {
    this.goToDisciplinas();
  }

  closeUploadModalAfterSuccess() {
    this.closeUploadModal();
    this.loadData();
    this.activeTab = 'editais';
  }

  retryUploadForm() {
    this.clearUploadLogInterval();
    this.uploadStatus = 'idle';
    this.isSubmitting = false;
    this.uploadErrorMessage = '';
  }

  clearUploadLogInterval() {
    if (this.uploadLogInterval) {
      clearTimeout(this.uploadLogInterval);
      clearInterval(this.uploadLogInterval);
      this.uploadLogInterval = null;
    }
  }

  startUploadLogSimulation(cargo: string, concurso?: string, filenameOrLink?: string) {
    this.clearUploadLogInterval();
    this.uploadStatus = 'processing';
    this.uploadProgress = 12;
    this.uploadErrorMessage = '';

    const displayCargo = cargo ? cargo.trim() : 'Cargo Alvo';
    const displayConcurso = concurso ? ` • Concurso: ${concurso.trim()}` : '';
    const displayDoc = filenameOrLink ? ` (${filenameOrLink})` : '';

    this.analysisLogs = [
      {
        id: 'info',
        icon: 'save',
        title: 'Salvamos suas informações',
        detail: `Contexto do concurso e perfil do candidato registrados com sucesso${displayConcurso}.`,
        status: 'completed',
        time: this.getCurrentTimeStr()
      },
      {
        id: 'received',
        icon: 'cloud_done',
        title: 'Edital recebido',
        detail: `Documento recebido e verificação de integridade aprovada${displayDoc}.`,
        status: 'active',
        time: this.getCurrentTimeStr()
      },
      {
        id: 'cargo',
        icon: 'badge',
        title: 'Identificamos o seu cargo',
        detail: `Foco de análise configurado para: "${displayCargo}".`,
        status: 'pending'
      },
      {
        id: 'sent_ai',
        icon: 'psychology',
        title: 'Enviado para análise',
        detail: 'Conectando ao motor de inteligência artificial para extração e leitura detalhada.',
        status: 'pending'
      },
      {
        id: 'disciplinas',
        icon: 'menu_book',
        title: 'Mapeando Conteúdo Programático',
        detail: 'Separação de disciplinas, tópicos e subtópicos.',
        status: 'pending'
      },
      {
        id: 'questoes',
        icon: 'inventory_2',
        title: 'Indexando Questões e Relevância',
        detail: 'Catalogando banco de questões e associando às disciplinas do edital.',
        status: 'pending'
      },
      {
        id: 'preparando',
        icon: 'query_stats',
        title: 'Preparando Base para Análise Pareto 80/20',
        detail: 'Matérias organizadas para o cálculo de incidência e priorização.',
        status: 'pending'
      },
      {
        id: 'plano',
        icon: 'auto_awesome',
        title: 'Edital Estruturado com Sucesso',
        detail: 'Edital pronto para o Mapa de Disciplinas e para a Análise Pareto 80/20.',
        status: 'pending'
      }
    ];

    let currentStep = 1;
    const progressTargets = [12, 25, 42, 58, 72, 85, 93, 97];

    // Tempos customizados por etapa (ms) - etapas cognitivas mais demoradas
    const stepDurations = [
      0,     // 0: info (inicia concluído)
      3200,  // 1: Edital recebido
      3200,  // 2: Cargo identificado
      3500,  // 3: Enviado para análise IA
      10500, // 4: Mapeando Conteúdo Programático (10.5s)
      10500, // 5: Aplicando Análise Pareto 80/20 (10.5s)
      8500,  // 6: Calibrando Régua de Corte e Pesos (8.5s)
      6000   // 7: Finalizando Plano Estratégico
    ];

    // Mantém no topo inicialmente para os primeiros logs ficarem visíveis
    setTimeout(() => {
      const container = document.getElementById('edital-logs-container');
      if (container) {
        container.scrollTop = 0;
      }
      this.scrollActiveLogToCenter(1);
    }, 60);

    const runStep = () => {
      if (this.uploadStatus !== 'processing') {
        this.clearUploadLogInterval();
        return;
      }

      const nextDuration = stepDurations[currentStep] || 4000;

      this.uploadLogInterval = setTimeout(() => {
        if (this.uploadStatus !== 'processing') return;

        if (currentStep < this.analysisLogs.length - 1) {
          this.analysisLogs[currentStep].status = 'completed';
          this.analysisLogs[currentStep].time = this.getCurrentTimeStr();

          currentStep++;
          this.analysisLogs[currentStep].status = 'active';
          this.analysisLogs[currentStep].time = this.getCurrentTimeStr();

          this.uploadProgress = progressTargets[currentStep] || 95;
          this.scrollActiveLogToCenter(currentStep);

          runStep();
        } else {
          // No último passo, continua ajustando levemente a barra enquanto a IA conclui
          if (this.uploadProgress < 98) {
            this.uploadProgress += 1;
          }
          this.uploadLogInterval = setTimeout(runStep, 2500);
        }
      }, nextDuration);
    };

    runStep();
  }

  scrollActiveLogToCenter(stepIndex?: number) {
    setTimeout(() => {
      const container = document.getElementById('edital-logs-container');
      if (!container) return;

      let targetEl: HTMLElement | null = null;
      if (typeof stepIndex === 'number') {
        targetEl = document.getElementById('edital-log-step-' + stepIndex);
      }
      if (!targetEl) {
        targetEl = container.querySelector('[data-active="true"], [data-status="error"]') as HTMLElement;
      }
      if (!targetEl) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const relativeTop = targetRect.top - containerRect.top;
      const targetCenter = relativeTop + (targetRect.height / 2);
      const containerCenter = container.clientHeight / 2;
      const delta = targetCenter - containerCenter;

      const targetScrollTop = Math.max(0, container.scrollTop + delta);

      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }, 80);
  }

  finishUploadSuccess(callback: () => void) {
    this.clearUploadLogInterval();
    this.uploadProgress = 100;
    this.uploadStatus = 'completed';

    this.analysisLogs.forEach(step => {
      step.status = 'completed';
      if (!step.time) step.time = this.getCurrentTimeStr();
    });
    this.scrollActiveLogToCenter(this.analysisLogs.length - 1);
    this.isSubmitting = false;

    callback();
  }

  handleUploadError(err?: any) {
    this.clearUploadLogInterval();
    this.isSubmitting = false;
    this.uploadStatus = 'error';
    this.uploadErrorMessage = 'O serviço está passando por alguma instabilidade no momento. Por favor, tente novamente mais tarde.';

    const activeStep = this.analysisLogs.find(s => s.status === 'active');
    if (activeStep) {
      activeStep.status = 'error';
      activeStep.time = this.getCurrentTimeStr();
    }
    this.scrollActiveLogToCenter();
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
    };

    const docName = this.editalUploadMode === 'pdf' && this.selectedFile
      ? this.selectedFile.name
      : (this.editalLink ? 'Link Web' : undefined);

    this.startUploadLogSimulation(this.editalCargo, this.editalConcurso, docName);

    this.apiService.uploadEdital(fileToUpload, title, linkToSend, this.user?.id || 'usr-2', userContext).subscribe({
      next: (res: any) => {
        const newId = res?.data?.id || res?.id;
        this.completedEditalId = newId || null;

        this.finishUploadSuccess(() => {
          this.selectedFile = null;
          this.editalLink = '';
          this.editalTitle = '';
          this.loadData();
          this.activeTab = 'editais';
        });
      },
      error: (err) => {
        this.handleUploadError(err);
      }
    });
  }

  // ---- Edit Modal ----

  openEditModal(ed: any) {
    this.editingEdital = ed;
    this.editTitle = ed.title || '';
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
    this.editTitle = '';
  }

  saveEditalContext() {
    if (!this.editCargo?.trim() || !this.editingEdital) return;
    this.isSaving = true;

    const context = {
      title: this.editTitle.trim() || undefined,
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
      title: this.editTitle.trim() || undefined,
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

  onAnswerSubmitted(event: { questionId: string; selectedOption: string; isCorrect: boolean }) {
    if (!event.questionId) return;
    const eventIdStr = String(event.questionId);

    // Encontra a questão correspondente
    const q = this.questions.find(
      q => String(q.id) === eventIdStr ||
           String(q.id_qc) === eventIdStr ||
           String(q.codigo) === eventIdStr
    );

    const disciplina = q?.disciplina || q?.subject || 'GERAL';

    this.selectedAnswers = { ...this.selectedAnswers, [eventIdStr]: event.selectedOption };
    this.sessionAnswers = {
      ...this.sessionAnswers,
      [eventIdStr]: {
        selectedOption: event.selectedOption,
        isCorrect: event.isCorrect,
        disciplina
      }
    };
    // Atualiza o mapa de respostas imediatamente (sem esperar o Supabase)
    this.userAnswerMap = {
      ...this.userAnswerMap,
      [eventIdStr]: { isCorrect: event.isCorrect }
    };
    this.saveAnswersToStorage();

    // Persiste no Supabase (fire-and-forget)
    if (q) {
      this.supabaseService.saveQuestionAnswer({
        questionId: String(q.id_qc || q.id || q.codigo || eventIdStr),
        disciplina,
        banca: q.banca,
        ano: q.ano,
        isCorrect: event.isCorrect,
      }).then(() => {
        // Atualiza o gráfico de acerto após salvar
        this.loadAccuracyStats();
      });
    }
  }

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
    this.authServiceRef.logout();
    this.router.navigate(['/login']);
  }
}
