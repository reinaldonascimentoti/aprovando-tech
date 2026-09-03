import { Component, OnInit, inject } from '@angular/core';
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

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditalCardComponent, QuestionCardComponent, PaginationComponent, UserProfileComponent, StatsDashboardComponent],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] transition-colors duration-300 p-3 sm:p-6 md:p-8">
      <!-- Top Navigation Bar -->
      <header class="neo-raised rounded-2xl p-3.5 sm:p-5 mb-6 md:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div class="flex items-center gap-3 shrink-0">
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
        <div class="text-center flex-1 my-1 sm:my-0 px-2">
          <p class="text-xs sm:text-sm font-semibold text-[var(--on-surface-variant)] leading-tight">
            Bem-vindo, <strong class="text-[var(--primary)]">{{ user?.full_name || 'reinaldodrive123' }}</strong>.
          </p>
          <p class="text-xs sm:text-sm font-extrabold text-[var(--primary)] mt-1 flex items-center justify-center gap-1">
            <span>Você está no caminho da aprovação!</span>
            <span class="material-symbols-outlined !text-[18px]">rocket_launch</span>
          </p>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--outline-variant)]/30 shrink-0">
          <!-- Botão Modo Dark/Claro -->
          <button (click)="themeService.toggle()" class="btn-neo px-3 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 text-[var(--on-surface)] transition-all cursor-pointer" [title]="themeService.isDark() ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'">
            <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
            <span>{{ themeService.isDark() ? 'Claro' : 'Escuro' }}</span>
          </button>

          <!-- Botão Voltar para o Dashboard (Visível ao navegar em Questões) -->
          <button 
            *ngIf="activeTab === 'questions'" 
            (click)="activeTab = 'editais'" 
            class="btn-neo px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all cursor-pointer">
            <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
            <span>Voltar ao Dashboard</span>
          </button>

          <!-- Botão Meu Perfil -->
          <button
            (click)="activeTab = 'perfil'"
            [class.text-[var(--primary)]]="activeTab === 'perfil'"
            class="btn-neo px-3 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0 text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-all cursor-pointer">
            <span class="material-symbols-outlined !text-[16px]">account_circle</span>
            <span class="hidden sm:inline">Meu Perfil</span>
          </button>

          <!-- Botão Sair da Aplicação -->
          <button (click)="logout()" class="btn-neo px-3 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0 text-[var(--on-surface)]">
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

      <!-- Linha 1: Navigation Tabs Bar (Oculto no modo Questões) -->
      <div *ngIf="activeTab !== 'questions'" class="neo-raised rounded-3xl p-3 sm:p-4 md:p-6 mb-6 md:mb-8 bg-[var(--card-bg)] shadow-lg border border-[var(--outline-variant)]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--outline-variant)]/40 pb-2">
          <div class="flex items-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar w-full pb-1 sm:pb-0">
            <button 
              (click)="activeTab = 'editais'"
              [class.border-b-2]="activeTab === 'editais'"
              [class.border-[var(--primary)]]="activeTab === 'editais'"
              [class.text-[var(--primary)]]="activeTab === 'editais'"
              class="pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-[var(--on-surface-variant)] transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
              <span class="material-symbols-outlined !text-[18px] sm:!text-[20px]">folder_special</span>
              <span>1. Meus Editais ({{ editais.length }})</span>
            </button>

            <button 
              (click)="activeTab = 'cronogramas'"
              [class.border-b-2]="activeTab === 'cronogramas'"
              [class.border-[var(--primary)]]="activeTab === 'cronogramas'"
              [class.text-[var(--primary)]]="activeTab === 'cronogramas'"
              class="pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-[var(--on-surface-variant)] transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
              <span class="material-symbols-outlined !text-[18px] sm:!text-[20px]">calendar_month</span>
              <span>2. Cronogramas</span>
            </button>

            <button 
              (click)="activeTab = 'mapa'"
              [class.border-b-2]="activeTab === 'mapa'"
              [class.border-[var(--primary)]]="activeTab === 'mapa'"
              [class.text-[var(--primary)]]="activeTab === 'mapa'"
              class="pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-[var(--on-surface-variant)] transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
              <span class="material-symbols-outlined !text-[18px] sm:!text-[20px]">map</span>
              <span>3. Mapa de Disciplinas</span>
            </button>

            <button 
              (click)="activeTab = 'questions'"
              class="pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer">
              <span class="material-symbols-outlined !text-[18px] sm:!text-[20px]">quiz</span>
              <span>4. Questões ({{ questions.length }})</span>
            </button>

            <button
              (click)="activeTab = 'perfil'"
              [class.border-b-2]="activeTab === 'perfil'"
              [class.border-[var(--primary)]]="activeTab === 'perfil'"
              [class.text-[var(--primary)]]="activeTab === 'perfil'"
              class="pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer">
              <span class="material-symbols-outlined !text-[18px] sm:!text-[20px]">account_circle</span>
              <span>5. Meu Perfil</span>
            </button>

            <button
              (click)="activeTab = 'estatisticas'"
              [class.border-b-2]="activeTab === 'estatisticas'"
              [class.border-[var(--primary)]]="activeTab === 'estatisticas'"
              [class.text-[var(--primary)]]="activeTab === 'estatisticas'"
              class="pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer">
              <span class="material-symbols-outlined !text-[18px] sm:!text-[20px]">bar_chart</span>
              <span>6. Estatísticas</span>
            </button>
          </div>

          <button 
            (click)="openUploadModal()"
            class="sm:ml-auto pb-1 sm:pb-3 text-xs sm:text-sm font-extrabold text-[var(--secondary)] transition-colors flex items-center gap-1.5 whitespace-nowrap hover:opacity-80 shrink-0 self-end sm:self-auto">
            <span class="material-symbols-outlined !text-[18px] sm:!text-[20px]">cloud_upload</span>
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
            <button (click)="openUploadModal()" class="btn-neo px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-[var(--secondary)] hover:opacity-80 transition-all cursor-pointer">
              <span class="material-symbols-outlined !text-[16px]">cloud_upload</span>
              <span class="hidden sm:inline">+ Enviar Edital</span>
            </button>
          </div>

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
            <div *ngIf="editais.length === 0" class="w-full flex flex-col items-center justify-center py-10 text-center gap-3">
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
            <div *ngIf="loadingRecentEditais" class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div *ngFor="let _ of [1,2]" class="rounded-3xl p-6 bg-slate-100 dark:bg-[#0f1220] border border-slate-200 dark:border-[#1f253d] animate-pulse h-64"></div>
            </div>

            <!-- Recent Editais Cards (Light & Dark Mode Adaptive) -->
            <div *ngIf="!loadingRecentEditais" class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                *ngFor="let ed of recentEditais"
                class="rounded-3xl p-6 bg-[#f8fafd] dark:bg-[#0f1220] border border-slate-200/90 dark:border-[#1f253d] shadow-sm hover:shadow-xl dark:shadow-xl hover:border-indigo-400/60 dark:hover:border-[#7c3aed]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-3.5 relative overflow-hidden text-slate-800 dark:text-white group">
                
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
              <div *ngIf="recentEditais.length === 0" class="col-span-2 text-center py-6">
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
              <div class="group relative flex flex-col items-center text-center flex-1 min-w-[125px] max-w-[160px] shrink-0 justify-between py-1 transition-all">
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
                <button *ngIf="selectedMapaEdital.pareto_analisado" (click)="openEditalPareto(selectedMapaEdital.id)" class="btn-neo px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 text-[var(--on-surface)]">
                  <span class="material-symbols-outlined !text-[20px] text-[var(--primary)]">analytics</span>
                  <span>Ver Pareto</span>
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
              <div class="flex items-center gap-2 text-[var(--on-surface)]">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[22px]">tune</span>
                <h3 class="font-extrabold text-sm sm:text-base">Filtros de Pesquisa</h3>
                <span *ngIf="hasActiveFilters" class="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                  Filtros Ativos
                </span>
              </div>
              <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <!-- Badge de quantidade de questões localizadas -->
                <div
                  [class]="hasActiveFilters
                    ? 'flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all duration-300 bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all duration-300 bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'">
                  <span class="material-symbols-outlined !text-[16px]">{{ hasActiveFilters ? 'filter_alt' : 'quiz' }}</span>
                  <span>
                    <strong class="text-[15px]">{{ filteredQuestions.length }}</strong>
                    <span class="font-semibold opacity-80"> / {{ questions.length }}</span>
                    <span class="ml-1 font-semibold">{{ hasActiveFilters ? 'questões localizadas' : 'questões no banco' }}</span>
                  </span>
                </div>
                <button 
                  *ngIf="hasActiveFilters"
                  (click)="clearFilters()"
                  class="text-xs font-bold text-[#ef4444] hover:text-[#dc2626] flex items-center gap-1 transition-colors cursor-pointer neo-pressed px-2.5 py-1 rounded-lg">
                  <span class="material-symbols-outlined !text-[16px]">filter_alt_off</span>
                  <span>Limpar Filtros</span>
                </button>
              </div>
            </div>

            <!-- Selects: Disciplina, Banca, Ano, Órgão -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <!-- Disciplina -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">menu_book</span>
                  Disciplina
                </label>
                <div class="neo-pressed rounded-xl px-3 py-2 flex items-center bg-[var(--background)]">
                  <select 
                    [(ngModel)]="selectedDisciplina" 
                    (ngModelChange)="onFilterChange()"
                    class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium">
                    <option value="">Todas as Disciplinas</option>
                    <option *ngFor="let disc of availableDisciplinas" [value]="disc">{{ disc }}</option>
                  </select>
                </div>
              </div>

              <!-- Banca -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">account_balance</span>
                  Banca
                </label>
                <div class="neo-pressed rounded-xl px-3 py-2 flex items-center bg-[var(--background)]">
                  <select 
                    [(ngModel)]="selectedBanca" 
                    (ngModelChange)="onFilterChange()"
                    class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium">
                    <option value="">Todas as Bancas</option>
                    <option *ngFor="let banca of availableBancas" [value]="banca">{{ banca }}</option>
                  </select>
                </div>
              </div>

              <!-- Ano -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">calendar_today</span>
                  Ano
                </label>
                <div class="neo-pressed rounded-xl px-3 py-2 flex items-center bg-[var(--background)]">
                  <select 
                    [(ngModel)]="selectedAno" 
                    (ngModelChange)="onFilterChange()"
                    class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium">
                    <option value="">Todos os Anos</option>
                    <option *ngFor="let ano of availableAnos" [value]="ano">{{ ano }}</option>
                  </select>
                </div>
              </div>

              <!-- Órgão -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">domain</span>
                  Órgão
                </label>
                <div class="neo-pressed rounded-xl px-3 py-2 flex items-center bg-[var(--background)]">
                  <select 
                    [(ngModel)]="selectedOrgao" 
                    (ngModelChange)="onFilterChange()"
                    class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium">
                    <option value="">Todos os Órgãos</option>
                    <option *ngFor="let orgao of availableOrgaos" [value]="orgao">{{ orgao }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Inputs de Texto: Cargo, Assunto, Keyword -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <!-- Cargo (Input texto) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">badge</span>
                  Cargo
                </label>
                <div class="neo-pressed rounded-xl px-3 py-2 flex items-center gap-2 bg-[var(--background)]">
                  <span class="material-symbols-outlined text-[var(--outline)] !text-[16px]">work</span>
                  <input 
                    type="text"
                    [(ngModel)]="filterCargo" 
                    (ngModelChange)="onFilterChange()"
                    placeholder="Digite o termo do cargo..."
                    class="bg-transparent border-none outline-none text-xs w-full text-[var(--on-surface)] placeholder:text-[var(--outline)]">
                </div>
              </div>

              <!-- Assunto (Input texto) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">label</span>
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
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4 sm:gap-5">
            <app-question-card 
              *ngFor="let q of paginatedQuestions; let i = index" 
              [question]="q" 
              [index]="(questionsCurrentPage - 1) * questionsPageSize + i"
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
      <div class="neo-raised rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fadeIn bg-white dark:bg-[#141927] border border-[var(--outline-variant)] my-auto flex flex-col max-h-[92vh]">

        <!-- Modal Header -->
        <div class="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-[var(--outline-variant)] bg-gradient-to-r from-purple-50/70 dark:from-[#1b2238] to-white dark:to-[#141927] shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md shrink-0">
              <span class="material-symbols-outlined !text-[20px] sm:!text-[22px]">cloud_upload</span>
            </div>
            <div>
              <h2 class="text-sm sm:text-base font-extrabold text-[var(--on-surface)]">Upload do Edital</h2>
              <p class="text-[10px] sm:text-[11px] font-semibold text-[var(--primary)]">Informações para o Seu Plano Estratégico</p>
            </div>
          </div>
          <button (click)="closeUploadModal()" [disabled]="isSubmitting" class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[var(--on-surface-variant)] hover:text-red-500 transition-colors disabled:opacity-50 shrink-0">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto flex-1">

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
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all">
              Link do Edital
            </button>
            <button
              type="button"
              (click)="editalUploadMode = 'pdf'"
              [ngClass]="editalUploadMode === 'pdf' ? 'bg-white dark:bg-[#1e2438] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all">
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

        <!-- Modal Footer -->
        <div class="px-4 sm:px-6 pb-5 pt-3 border-t border-[var(--outline-variant)] flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
          <button
            (click)="closeUploadModal()"
            [disabled]="isSubmitting"
            class="w-full sm:flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            (click)="submitEdital()"
            [disabled]="!isEditalFormValid || isSubmitting"
            class="w-full sm:flex-1 py-3 rounded-2xl font-bold btn-mesh flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50">
            <span class="material-symbols-outlined !text-[18px]">auto_awesome</span>
            <span>{{ isSubmitting ? 'Gerando Análise Pareto...' : 'Analisar Edital Pareto 80/20' }}</span>
          </button>
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

  `
})
export class StudentDashboardComponent implements OnInit {
  public themeService = inject(ThemeService);
  user: UserProfile | null = null;
  editais: any[] = [];
  questions: any[] = [];
  activeTab: 'editais' | 'cronogramas' | 'mapa' | 'questions' | 'perfil' | 'estatisticas' = 'editais';
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

  // ---- Upload form ----
  editalTitle = '';
  editalLink = '';
  editalCargo = '';
  editalConcurso = '';
  editalDataProva = '';
  editalUploadMode: 'link' | 'pdf' = 'link';
  selectedFile: File | null = null;
  isSubmitting = false;

  // ---- Questions ----
  searchSubject = '';
  selectedDisciplina = '';
  selectedBanca = '';
  selectedAno = '';
  selectedOrgao = '';
  filterCargo = '';
  filterAssunto = '';
  questionsCurrentPage = 1;
  questionsPageSize = 10;
  selectedAnswers: { [key: string]: string } = {};
  sessionAnswers: Record<string, { selectedOption: string; isCorrect: boolean; disciplina: string }> = {};

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

    this.supabaseService.session$.subscribe(session => {
      if (session?.user) {
        this.loadAccuracyStats();
      }
    });
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
    this.selectedDisciplina = '';
    this.selectedBanca = '';
    this.selectedAno = '';
    this.selectedOrgao = '';
    this.filterCargo = '';
    this.filterAssunto = '';
    this.questionsCurrentPage = 1;
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.searchSubject ||
      this.selectedDisciplina ||
      this.selectedBanca ||
      this.selectedAno ||
      this.selectedOrgao ||
      this.filterCargo?.trim() ||
      this.filterAssunto?.trim()
    );
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
    return Array.from(set).sort();
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
    return Array.from(set).sort();
  }

  get availableAnos(): (number | string)[] {
    if (!this.questions) return [];
    const set = new Set<number | string>();
    for (const q of this.questions) {
      if (q.ano != null && q.ano !== '') {
        set.add(q.ano);
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
    return Array.from(set).sort();
  }

  get filteredQuestions(): any[] {
    if (!this.questions || this.questions.length === 0) return [];

    return this.questions.filter(q => {
      // 1. Disciplina (Select)
      if (this.selectedDisciplina) {
        const disc = (q.disciplina || q.subject || '').toString().toLowerCase();
        if (disc !== this.selectedDisciplina.toLowerCase()) return false;
      }

      // 2. Banca (Select)
      if (this.selectedBanca) {
        const banca = (q.banca || '').toString().toLowerCase();
        if (banca !== this.selectedBanca.toLowerCase()) return false;
      }

      // 3. Ano (Select)
      if (this.selectedAno) {
        if (String(q.ano) !== String(this.selectedAno)) return false;
      }

      // 4. Órgão (Select)
      if (this.selectedOrgao) {
        const orgao = (q.orgao || '').toString().toLowerCase();
        if (orgao !== this.selectedOrgao.toLowerCase()) return false;
      }

      // 5. Cargo (Input de texto)
      if (this.filterCargo && this.filterCargo.trim() !== '') {
        const cargo = (q.cargo || '').toString().toLowerCase();
        if (!cargo.includes(this.filterCargo.trim().toLowerCase())) return false;
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
