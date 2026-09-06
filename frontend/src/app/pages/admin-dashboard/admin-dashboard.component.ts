import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { EditalCardComponent } from '../../components/edital-card/edital-card.component';
import { QuestionCardComponent } from '../../components/question-card/question-card.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { AnalysisLogStep } from '../student-dashboard/student-dashboard.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditalCardComponent, QuestionCardComponent, PaginationComponent],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] transition-colors duration-300 p-4 md:p-8">
      <!-- Top Navigation Bar -->
      <header class="neo-raised rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 flex items-center justify-center">
            <img src="assets/admin_panel_icon.svg" alt="Admin Panel Icon" class="w-full h-full object-contain drop-shadow-md">
          </div>
          <div>
            <h1 class="text-xl font-bold text-[var(--on-surface)]">Painel Administrativo</h1>
            <p class="text-xs text-[var(--on-surface-variant)]">Aprovando Tech • Gestão de Conteúdo e Qualidade IA</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-[var(--on-surface-variant)] hidden sm:inline">Olá, <strong class="text-[var(--primary)]">{{ user?.full_name }}</strong></span>
          <button (click)="themeService.toggle()" class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-[var(--on-surface)] transition-all cursor-pointer" [title]="themeService.isDark() ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'">
            <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
            <span>{{ themeService.isDark() ? 'Claro' : 'Escuro' }}</span>
          </button>
          <button (click)="logout()" class="btn-neo px-4 py-2 rounded-xl text-xs flex items-center gap-1 text-[var(--on-surface)] cursor-pointer">
            <span class="material-symbols-outlined !text-[16px]">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <!-- ===================================================================== -->
      <!-- 1ª LINHA — Grid de Cards de Métricas KPI Interativos                 -->
      <!-- ===================================================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <!-- Card 1: Questões Extraídas -->
        <div 
          (click)="goToTab('questions')"
          class="neo-raised rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-200 active:scale-[0.98] group"
          title="Clique para ir para Gestão de Questões">
          <div class="w-14 h-14 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <img src="assets/laptop_code_icon.svg" alt="Questões" class="w-12 h-12 object-contain drop-shadow-sm">
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-[var(--on-surface-variant)]">Questões Extraídas</p>
              <span class="material-symbols-outlined !text-[14px] text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </div>
            <h3 class="text-2xl font-extrabold text-[var(--on-surface)]">{{ questions.length }}</h3>
            <p class="text-[10px] text-[var(--primary)] font-bold mt-0.5">Ver Banco de Questões →</p>
          </div>
        </div>

        <!-- Card 2: Score Qualidade Média IA -->
        <div 
          (click)="goToTab('quality')"
          class="neo-raised rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-200 active:scale-[0.98] group"
          title="Clique para ir para Análise de Qualidade">
          <div class="w-14 h-14 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <img src="assets/security_shield_icon.svg" alt="Qualidade" class="w-12 h-12 object-contain drop-shadow-sm">
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-[var(--on-surface-variant)]">Score Qualidade Média IA</p>
              <span class="material-symbols-outlined !text-[14px] text-[var(--tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </div>
            <h3 class="text-2xl font-extrabold text-[var(--tertiary)]">{{ qualityReport?.average_metrics?.avg_overall_quality_score || 9.2 }}/10</h3>
            <p class="text-[10px] text-[var(--tertiary)] font-bold mt-0.5">Ver Métricas de Qualidade →</p>
          </div>
        </div>

        <!-- Card 3: Editais Pareto (80/20) -->
        <div 
          (click)="scrollToSection('editais-table-section')"
          class="neo-raised rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-200 active:scale-[0.98] group"
          title="Clique para ver a Tabela de Editais Analisados">
          <div class="w-14 h-14 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <img src="assets/growth_chart_icon.svg" alt="Pareto" class="w-12 h-12 object-contain drop-shadow-sm">
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-[var(--on-surface-variant)]">Editais Pareto (80/20)</p>
              <span class="material-symbols-outlined !text-[14px] text-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity">arrow_downward</span>
            </div>
            <h3 class="text-2xl font-extrabold text-[var(--on-surface)]">{{ editais.length }}</h3>
            <p class="text-[10px] text-[var(--secondary)] font-bold mt-0.5">Ir para Editais Analisados ↓</p>
          </div>
        </div>

        <!-- Card 4: Usuários Cadastrados -->
        <div 
          (click)="goToTab('users')"
          class="neo-raised rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-200 active:scale-[0.98] group"
          title="Clique para ir para Usuários e Permissões">
          <div class="w-14 h-14 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <img src="assets/registered_users_icon.svg" alt="Usuários" class="w-12 h-12 object-contain drop-shadow-sm">
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-[var(--on-surface-variant)]">Usuários Cadastrados</p>
              <span class="material-symbols-outlined !text-[14px] text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </div>
            <h3 class="text-2xl font-extrabold text-[var(--on-surface)]">{{ users.length }}</h3>
            <p class="text-[10px] text-[var(--primary)] font-bold mt-0.5">Gerenciar Usuários →</p>
          </div>
        </div>

      </div>

      <!-- ===================================================================== -->
      <!-- 2ª LINHA — Editais Analisados (Tabela)                                -->
      <!-- ===================================================================== -->
      <div id="editais-table-section" class="neo-raised rounded-3xl p-6 mb-8 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[24px]">folder_special</span>
            <div>
              <h2 class="text-lg font-bold text-[var(--on-surface)]">Editais Analisados</h2>
              <p class="text-xs text-[var(--outline)]">Gerencie os editais processados com Pareto 80/20, edite metadados ou envie para usuários.</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-extrabold px-3 py-1.5 rounded-full">
              Total Analisados: {{ editaisAnalisados.length }} Editais
            </span>
            <button
              (click)="openUploadModal()"
              class="btn-mesh px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md">
              <span class="material-symbols-outlined !text-[16px]">cloud_upload</span>
              <span>+ Novo Edital</span>
            </button>
          </div>
        </div>

        <!-- Tabela de Editais Analisados -->
        <div *ngIf="editaisAnalisados.length > 0; else noEditaisAnalisados" class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr class="bg-[var(--surface-container)] text-[var(--on-surface-variant)] text-[11px] font-black uppercase tracking-wider border-b border-[var(--outline-variant)]">
                <th class="py-3 px-4">Edital / Concurso</th>
                <th class="py-3 px-4">Cargo Alvo</th>
                <th class="py-3 px-4">Data Prova / Carga</th>
                <th class="py-3 px-4">Status & Enviado Por</th>
                <th class="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--outline-variant)]/40">
              <ng-container *ngFor="let ed of editaisAnalisados">
                <tr class="hover:bg-[var(--surface-container-high)] transition-colors">
                  <!-- Edital / Concurso -->
                  <td class="py-3.5 px-4 font-bold text-[var(--on-surface)]">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-black text-[var(--on-surface)]">{{ ed.title }}</span>
                      <span *ngIf="ed.concurso" class="text-xs font-semibold text-[var(--primary)]">{{ ed.concurso }}</span>
                    </div>
                  </td>

                  <!-- Cargo -->
                  <td class="py-3.5 px-4">
                    <span *ngIf="ed.cargo" class="bg-[var(--secondary)]/15 text-[var(--secondary)] text-xs font-extrabold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <span class="material-symbols-outlined !text-[13px]">badge</span>
                      {{ ed.cargo }}
                    </span>
                    <span *ngIf="!ed.cargo" class="text-[var(--outline)] italic">Geral / Não informado</span>
                  </td>

                  <!-- Data Prova / Carga -->
                  <td class="py-3.5 px-4 text-[var(--on-surface-variant)]">
                    <div class="flex flex-col text-[11px] gap-0.5">
                      <span *ngIf="ed.data_prova" class="font-bold text-[var(--on-surface)] flex items-center gap-1">
                        <span class="material-symbols-outlined !text-[13px] text-[var(--primary)]">event</span>
                        {{ ed.data_prova }}
                      </span>
                      <span *ngIf="ed.horas_por_dia" class="text-[var(--outline)]">
                        {{ ed.horas_por_dia }}h/dia × {{ ed.dias_por_semana || 5 }}d/sem
                      </span>
                      <span *ngIf="!ed.data_prova && !ed.horas_por_dia" class="text-[var(--outline)] italic">Não informada</span>
                    </div>
                  </td>

                  <!-- Status & Uploader -->
                  <td class="py-3.5 px-4">
                    <div class="flex flex-col gap-1">
                      <span class="bg-[var(--tertiary-container)]/20 text-[var(--tertiary)] text-[10px] font-extrabold px-2 py-0.5 rounded-full w-fit flex items-center gap-1">
                        <span class="material-symbols-outlined !text-[12px]">check_circle</span>
                        {{ ed.status || 'Concluído' }}
                      </span>
                      <span class="text-[10px] text-[var(--outline)]">Por: {{ ed.uploader_name || 'Admin' }}</span>
                    </div>
                  </td>

                  <!-- Ações -->
                  <td class="py-3.5 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5 flex-wrap">
                      <!-- Ver Análise -->
                      <a
                        [routerLink]="['/pareto', ed.id]"
                        class="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-[#e1dfff] dark:bg-[#2b20d2]/30 text-[#2b20d2] dark:text-[#c1c1ff] hover:bg-[#d5d2ff] dark:hover:bg-[#2b20d2]/50 transition-all"
                        title="Ver Análise Pareto">
                        <span class="material-symbols-outlined !text-[15px]">donut_large</span>
                        <span>Análise</span>
                      </a>

                      <!-- Mapa Geral -->
                      <a
                        [routerLink]="['/disciplinas', ed.id]"
                        class="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-[#e9ddff] dark:bg-[#5516be]/30 text-[#5516be] dark:text-[#d0bcff] hover:bg-[#dcc8ff] dark:hover:bg-[#5516be]/50 transition-all"
                        title="Ver Mapa Geral das Disciplinas">
                        <span class="material-symbols-outlined !text-[15px]">grid_view</span>
                        <span>Mapa</span>
                      </a>

                      <!-- Editar -->
                      <button
                        (click)="openEditModal(ed)"
                        class="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-[#fff3e0] dark:bg-[#e65100]/25 text-[#e65100] dark:text-[#ffb74d] hover:bg-[#ffe0b2] dark:hover:bg-[#e65100]/40 transition-all cursor-pointer"
                        title="Editar Contexto / Reanalisar">
                        <span class="material-symbols-outlined !text-[15px]">edit</span>
                        <span>Editar</span>
                      </button>

                      <!-- Enviar a Usuário -->
                      <button
                        (click)="toggleSendEditalPanel(ed.id)"
                        class="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        [ngClass]="sendEditalOpenId === ed.id ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'"
                        title="Enviar Link a Usuário">
                        <span class="material-symbols-outlined !text-[15px]">send</span>
                        <span>{{ sendEditalOpenId === ed.id ? 'Fechar' : 'Enviar' }}</span>
                      </button>

                      <!-- Excluir -->
                      <button
                        (click)="deleteEdital(ed)"
                        class="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-[#ffdad6] dark:bg-[#ba1a1a]/30 text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffb4ab] dark:hover:bg-[#ba1a1a]/50 transition-all cursor-pointer"
                        title="Excluir Edital">
                        <span class="material-symbols-outlined !text-[15px]">delete</span>
                        <span>Excluir</span>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Painel Inline de Envio em linha expansível da tabela -->
                <tr *ngIf="sendEditalOpenId === ed.id" class="bg-[var(--surface-container-low)] dark:bg-[#1a1e2a]">
                  <td colspan="5" class="p-4">
                    <div class="neo-raised rounded-2xl p-4 space-y-3 border-l-4 border-[var(--primary)] animate-fadeIn">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="material-symbols-outlined text-[var(--primary)] !text-[20px]">person_add</span>
                          <p class="text-xs font-bold text-[var(--on-surface)]">Selecione o usuário para receber o edital "{{ ed.title }}"</p>
                        </div>
                        <button (click)="sendEditalOpenId = null" class="text-[var(--outline)] hover:text-[var(--on-surface)] cursor-pointer">
                          <span class="material-symbols-outlined !text-[18px]">close</span>
                        </button>
                      </div>
                      <div class="flex gap-3 items-center">
                        <div class="neo-pressed rounded-xl p-1 flex-1">
                          <select 
                            [(ngModel)]="sendEditalSelectedUserId" 
                            class="w-full border-none outline-none text-sm px-3 py-2 text-[var(--on-surface)] cursor-pointer bg-transparent">
                            <option value="" disabled>Escolha um usuário...</option>
                            <option *ngFor="let u of nonAdminUsers" [value]="u.id">
                              {{ u.full_name }} ({{ u.email }})
                            </option>
                          </select>
                        </div>
                        <button 
                          (click)="sendEditalToUser(ed.id)" 
                          [disabled]="!sendEditalSelectedUserId || isSendingEdital"
                          class="px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
                          [ngClass]="!sendEditalSelectedUserId || isSendingEdital 
                            ? 'bg-[var(--surface-container)] text-[var(--outline)] cursor-not-allowed' 
                            : 'bg-gradient-to-r from-[#433fe5] to-[#6b38d4] dark:from-[#5d5cff] dark:to-[#8455ef] text-white hover:shadow-lg hover:scale-[1.01]'">
                          <span class="material-symbols-outlined !text-[16px]">{{ isSendingEdital ? 'hourglass_top' : 'rocket_launch' }}</span>
                          <span>{{ isSendingEdital ? 'Enviando...' : 'Enviar Edital para Análise' }}</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Toast de Envio em linha expansível da tabela -->
                <tr *ngIf="sendEditalToastId === ed.id && sendEditalToastMsg" class="bg-[var(--surface-container-low)] dark:bg-[#1a1e2a]">
                  <td colspan="5" class="p-2 px-4">
                    <div class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
                      [ngClass]="sendEditalToastType === 'success' ? 'bg-[#eefff2] dark:bg-[#003824] text-[#005236] dark:text-[#6ffbbe]' : 'bg-[#ffdad6] dark:bg-[#ba1a1a]/30 text-[#93000a] dark:text-[#ffb4ab]'">
                      <span class="material-symbols-outlined !text-[16px]">
                        {{ sendEditalToastType === 'success' ? 'check_circle' : 'error' }}
                      </span>
                      <span>{{ sendEditalToastMsg }}</span>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <ng-template #noEditaisAnalisados>
          <div class="neo-pressed rounded-2xl p-8 text-center space-y-3">
            <span class="material-symbols-outlined text-[var(--outline)] !text-[36px]">folder_open</span>
            <p class="text-sm font-bold text-[var(--on-surface)]">Nenhum edital analisado até o momento</p>
            <p class="text-xs text-[var(--outline)]">Utilize o botão abaixo ou o card de upload para enviar e gerar a análise do primeiro edital.</p>
            <button
              (click)="openUploadModal()"
              class="btn-mesh px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md">
              <span class="material-symbols-outlined !text-[16px]">cloud_upload</span>
              <span>+ Enviar Primeiro Edital</span>
            </button>
          </div>
        </ng-template>
      </div>

      <!-- ===================================================================== -->
      <!-- 3ª LINHA — Uploads                                                    -->
      <!-- ===================================================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        <!-- Upload PDF de Aulas (Extração IA) -->
        <div class="neo-raised rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-[var(--on-surface)] flex items-center gap-2">
                <img src="assets/cloud_upload_icon.svg" class="w-12 h-12 drop-shadow-sm">
                Upload de PDF de Aula (IA + Qualidade JSON)
              </h2>
              <span class="bg-[#e1dfff] dark:bg-[#2b20d2]/30 text-[#2b20d2] dark:text-[#c1c1ff] text-[11px] font-bold px-2.5 py-1 rounded-full">BullMQ + OpenAI</span>
            </div>
            <p class="text-xs text-[var(--on-surface-variant)] mb-6">
              Envie o PDF da aula teórica. A IA extrairá as questões, calculará o score de clareza psicométrica e salvará em <code>backend/data/questions.json</code> e <code>quality_analysis.json</code>.
            </p>

            <div class="neo-pressed rounded-2xl p-8 border-2 border-dashed border-[var(--outline-variant)] flex flex-col items-center justify-center text-center relative hover:border-[var(--primary)] transition-colors cursor-pointer mb-4">
              <span class="material-symbols-outlined !text-[40px] text-[var(--secondary)] mb-1">picture_as_pdf</span>
              <p class="text-sm font-semibold text-[var(--on-surface)]">
                {{ selectedPdfFile ? selectedPdfFile.name : 'Arraste o PDF da aula ou clique para selecionar' }}
              </p>
              <p class="text-xs text-[var(--outline)] mt-1">Formato suportado: PDF (até 50MB)</p>
              <input type="file" (change)="onPdfSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
          </div>

          <button 
            (click)="uploadPdfLesson()" 
            [disabled]="!selectedPdfFile || isUploadingPdf"
            class="btn-mesh w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer">
            <span class="material-symbols-outlined">auto_awesome</span>
            <span>{{ isUploadingPdf ? 'Extraindo Questões e Analisando Qualidade...' : 'Extrair Questões & Análise de Qualidade' }}</span>
          </button>
        </div>

        <!-- Upload de Edital (Regra Pareto 80/20) -->
        <div class="neo-raised rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-[var(--on-surface)] flex items-center gap-3">
                <img src="assets/cloud_upload_icon.svg" class="w-12 h-12 drop-shadow-sm">
                Upload de Edital (Análise Pareto 3 Camadas)
              </h2>
              <span class="bg-[#e9ddff] dark:bg-[#5516be]/30 text-[#5516be] dark:text-[#d0bcff] text-[11px] font-bold px-2.5 py-1 rounded-full">Macro → Meso → Micro</span>
            </div>
            <p class="text-xs text-[var(--on-surface-variant)] mb-6">
              Faça upload do edital oficial. A IA aplicará Pareto 80/20 em 3 camadas gerando mapa de prioridades, cronograma adaptado ao seu tempo disponível, régua de corte e alertas de banca.
            </p>

            <!-- Card de Acionamento do Modal de Upload -->
            <div (click)="openUploadModal()" class="neo-pressed rounded-2xl p-8 border-2 border-dashed border-[var(--outline-variant)] flex flex-col items-center justify-center text-center relative hover:border-[var(--primary)] transition-all cursor-pointer mb-4 group">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform">
                <span class="material-symbols-outlined !text-[32px]">cloud_upload</span>
              </div>
              <p class="text-sm font-bold text-[var(--on-surface)]">
                Clique para abrir o formulário de Upload
              </p>
              <p class="text-xs text-[var(--outline)] mt-1">
                Contexto do candidato, cargo, data e arquivo PDF ou link do edital
              </p>
            </div>
          </div>

          <button 
            (click)="openUploadModal()" 
            class="btn-mesh w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
            style="background: linear-gradient(135deg, #6b38d4 0%, #8455ef 100%);">
            <span class="material-symbols-outlined">add_circle</span>
            <span>Novo Upload de Edital</span>
          </button>
        </div>

      </div>

      <!-- Tabbed Views: Questions Bank, Quality Analysis & Users -->
      <div id="tabbed-views-section" class="neo-raised rounded-3xl p-6 mb-8">
        <div class="flex border-b border-[var(--outline-variant)]/40 mb-6 gap-6 overflow-x-auto">
          <button 
            (click)="activeTab = 'questions'"
            [class.border-b-2]="activeTab === 'questions'"
            [class.border-[var(--primary)]]="activeTab === 'questions'"
            [class.text-[var(--primary)]]="activeTab === 'questions'"
            class="pb-3 text-sm font-bold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined">quiz</span>
            <span>Gestão de Questões</span>
          </button>

          <button 
            (click)="activeTab = 'quality'"
            [class.border-b-2]="activeTab === 'quality'"
            [class.border-[var(--primary)]]="activeTab === 'quality'"
            [class.text-[var(--primary)]]="activeTab === 'quality'"
            class="pb-3 text-sm font-bold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined">analytics</span>
            <span>Análise de Qualidade (JSON)</span>
          </button>

          <button 
            (click)="activeTab = 'users'"
            [class.border-b-2]="activeTab === 'users'"
            [class.border-[var(--primary)]]="activeTab === 'users'"
            [class.text-[var(--primary)]]="activeTab === 'users'"
            class="pb-3 text-sm font-bold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined">manage_accounts</span>
            <span>Usuários e Permissões</span>
          </button>

          <button 
            (click)="activeTab = 'stats'"
            [class.border-b-2]="activeTab === 'stats'"
            [class.border-[var(--primary)]]="activeTab === 'stats'"
            [class.text-[var(--primary)]]="activeTab === 'stats'"
            class="pb-3 text-sm font-bold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined">bar_chart</span>
            <span>Estatísticas de Estudo</span>
          </button>
        </div>

        <!-- Questions Tab Content -->
        <div *ngIf="activeTab === 'questions'" class="space-y-6">

          <!-- Card de Upload de Questões via Arquivo JSON -->
          <div class="neo-raised rounded-3xl p-6 bg-gradient-to-br from-white to-[#f5f3ff] dark:from-[#202433] dark:to-[#1a1d29] border border-[var(--outline-variant)] shadow-sm">
            <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-[#e1dfff] dark:bg-[#2b20d2]/30 flex items-center justify-center text-[#2b20d2] dark:text-[#c1c1ff] shrink-0">
                  <span class="material-symbols-outlined !text-[28px]">upload_file</span>
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-[var(--on-surface)]">Upload de Questões via Arquivo JSON</h3>
                  <p class="text-xs text-[var(--outline)]">Selecione ou arraste um arquivo .json para importar questões com gabaritos, alternativas e imagens no catálogo.</p>
                </div>
              </div>
              <span class="bg-[#eefff2] dark:bg-[#003824] text-[#005236] dark:text-[#6ffbbe] text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                <span class="material-symbols-outlined !text-[14px]">verified</span>
                POST /api/questions/import
              </span>
            </div>

            <!-- Área de Drop/Seleção do arquivo JSON -->
            <div class="neo-pressed rounded-2xl p-6 border-2 border-dashed border-[var(--outline-variant)] flex flex-col items-center justify-center text-center relative hover:border-[var(--primary)] transition-colors cursor-pointer mb-4">
              <span class="material-symbols-outlined !text-[36px] text-[var(--primary)] mb-1">integration_instructions</span>
              <p class="text-sm font-bold text-[var(--on-surface)]">
                {{ selectedJsonFile ? selectedJsonFile.name : 'Clique ou arraste seu arquivo .json aqui' }}
              </p>
              <p class="text-xs text-[var(--outline)] mt-1">
                <ng-container *ngIf="jsonPreviewCount !== null; else jsonHelp">
                  <strong class="text-[var(--primary)] font-extrabold">{{ jsonPreviewCount }} questão(ões)</strong> pronta(s) para importação!
                </ng-container>
                <ng-template #jsonHelp>Suporta Múltipla Escolha (A-E ou C/E) e Certo/Errado com ou sem imagem.</ng-template>
              </p>
              <input type="file" (change)="onJsonFileSelected($event)" accept=".json,application/json" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>

            <!-- Toast / Feedback de Importação -->
            <div *ngIf="jsonUploadToastMsg" class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn"
                 [ngClass]="jsonUploadToastType === 'success' ? 'bg-[#eefff2] dark:bg-[#003824] text-[#005236] dark:text-[#6ffbbe]' : 'bg-[#ffdad6] dark:bg-[#ba1a1a]/30 text-[#93000a] dark:text-[#ffb4ab]'">
              <span class="material-symbols-outlined !text-[16px]">{{ jsonUploadToastType === 'success' ? 'check_circle' : 'error' }}</span>
              <span>{{ jsonUploadToastMsg }}</span>
            </div>

            <!-- Botão de Ação -->
            <button 
              (click)="uploadQuestionsJson()" 
              [disabled]="!parsedJsonData || isUploadingJson"
              class="btn-mesh w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
              [ngClass]="!parsedJsonData || isUploadingJson ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'">
              <span class="material-symbols-outlined !text-[18px]">{{ isUploadingJson ? 'hourglass_top' : 'cloud_upload' }}</span>
              <span>{{ isUploadingJson ? 'Importando e Salvando Questões...' : 'Importar Questões para o Banco' }}</span>
            </button>
          </div>

          <!-- Console de Logs (Real-time) -->
          <div *ngIf="isLogConsoleExpanded" class="neo-raised rounded-2xl p-4 bg-[#191c1e]">
            <div class="flex items-center justify-between mb-2">
               <h4 class="text-xs font-bold text-[#eefff2]">Processo de Importação (Logs)</h4>
               <button (click)="disconnectLogStream(); isLogConsoleExpanded = false" class="text-[#767587] hover:text-white cursor-pointer">
                 <span class="material-symbols-outlined !text-[16px]">close</span>
               </button>
            </div>
            <div id="log-console-container" class="h-48 overflow-y-auto space-y-1 font-mono text-[10px]">
              <div *ngFor="let log of importLogs" [class.text-[#eefff2]]="log.type === 'info'" [class.text-[#ffb4ab]]="log.type === 'error'" [class.text-[#d0bcff]]="log.type === 'warn'">
                 [{{ log.time | date:'HH:mm:ss' }}] {{ log.message }}
              </div>
            </div>
          </div>

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
                <span class="text-xs font-semibold text-[var(--on-surface-variant)]">
                  Mostrando <strong>{{ filteredQuestions.length }}</strong> de {{ questions.length }} questões
                </span>
                <button 
                  *ngIf="hasActiveFilters"
                  (click)="clearFilters()"
                  class="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 transition-colors cursor-pointer neo-pressed px-2.5 py-1 rounded-lg">
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
                    class="border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium bg-transparent">
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
                    class="border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium bg-transparent">
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
                    class="border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium bg-transparent">
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
                    class="border-none outline-none text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium bg-transparent">
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

          <!-- Listagem das Questões -->
          <div class="flex flex-col gap-4 sm:gap-5">
            <app-question-card 
              *ngFor="let q of paginatedQuestions; let i = index" 
              [question]="q" 
              [index]="(questionsCurrentPage - 1) * questionsPageSize + i"
              [isAdmin]="true"
              (toggleRelease)="toggleRelease($event)"
              (editQuestion)="openEditQuestionModal($event)"
              (deleteQuestion)="confirmDeleteQuestion($event)">
            </app-question-card>

            <app-pagination
              [currentPage]="questionsCurrentPage"
              [totalItems]="filteredQuestions.length"
              [pageSize]="questionsPageSize"
              (pageChange)="onQuestionsPageChange($event)">
            </app-pagination>
          </div>
        </div>

        <!-- Quality Analysis Tab Content (JSON View) -->
        <div *ngIf="activeTab === 'quality'" class="space-y-6">

          <!-- Header & Seletor de Edital do Relatório do Prompt 1 -->
          <div class="neo-raised rounded-2xl p-5 border-l-4 border-[var(--primary)] space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[28px]">data_object</span>
                <div>
                  <h3 class="text-base font-extrabold text-[var(--on-surface)]">Relatório de Qualidade do JSON — Disciplinas (Prompt 1)</h3>
                  <p class="text-xs text-[var(--outline)]">Resumo e validação de integridade da extração de conteúdo programático (Disciplinas → Tópicos → Subtópicos).</p>
                </div>
              </div>

              <!-- Dropdown de Seleção do Edital Analisado -->
              <div *ngIf="editaisAnalisados.length > 0" class="flex items-center gap-2">
                <span class="text-xs font-bold text-[var(--on-surface-variant)]">Edital:</span>
                <div class="neo-pressed rounded-xl p-1 bg-[var(--surface-container)]">
                  <select 
                    [(ngModel)]="selectedQualityEditalId"
                    class="border-none outline-none text-xs font-semibold px-3 py-1.5 text-[var(--on-surface)] cursor-pointer bg-transparent">
                    <option *ngFor="let ed of editaisAnalisados" [value]="ed.id">
                      {{ ed.title }} ({{ ed.cargo || 'Geral' }})
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Resumo das Métricas de Qualidade do Prompt 1 -->
            <div *ngIf="promptQualitySummary" class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div class="neo-pressed rounded-xl p-3 text-center bg-[var(--surface-container-low)]/80 dark:bg-[#252a3b]/80">
                <p class="text-[11px] font-bold text-[var(--outline)]">Disciplinas Extraídas</p>
                <h4 class="text-xl font-black text-[var(--primary)]">{{ promptQualitySummary.totalDisciplinas }}</h4>
              </div>
              <div class="neo-pressed rounded-xl p-3 text-center bg-[var(--surface-container-low)]/80 dark:bg-[#252a3b]/80">
                <p class="text-[11px] font-bold text-[var(--outline)]">Tópicos Extratificados</p>
                <h4 class="text-xl font-black text-[var(--secondary)]">{{ promptQualitySummary.totalTopicos }}</h4>
              </div>
              <div class="neo-pressed rounded-xl p-3 text-center bg-[var(--surface-container-low)]/80 dark:bg-[#252a3b]/80">
                <p class="text-[11px] font-bold text-[var(--outline)]">Subtópicos Detalhados</p>
                <h4 class="text-xl font-black text-[var(--tertiary)]">{{ promptQualitySummary.totalSubtopicos }}</h4>
              </div>
              <div class="neo-pressed rounded-xl p-3 text-center bg-[var(--surface-container-low)]/80 dark:bg-[#252a3b]/80 flex flex-col items-center justify-center">
                <p class="text-[11px] font-bold text-[var(--outline)]">Conformidade Schema</p>
                <span 
                  [ngClass]="promptQualitySummary.isValidSchema 
                    ? 'bg-[#eefff2] dark:bg-[#003824] text-[#005236] dark:text-[#6ffbbe]' 
                    : 'bg-[var(--surface-container)] text-[var(--outline)]'"
                  class="mt-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[12px]">verified</span>
                  {{ promptQualitySummary.isValidSchema ? 'Draft-07 Válido' : 'Pendente' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tabela Resumida das Disciplinas Extraídas pelo Prompt 1 -->
          <div *ngIf="promptQualitySummary && promptQualitySummary.totalDisciplinas > 0" class="space-y-4">
            <h4 class="text-xs font-black uppercase text-[var(--on-surface-variant)] tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">menu_book</span>
              Resumo por Disciplina (Conhecimentos Gerais e Específicos)
            </h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Conhecimentos Gerais -->
              <div class="neo-pressed rounded-2xl p-4 space-y-3 bg-[var(--surface-container-low)]/50 dark:bg-[#202433]/50">
                <div class="flex items-center justify-between border-b border-[var(--outline-variant)]/40 pb-2">
                  <span class="text-xs font-extrabold text-[var(--primary)] flex items-center gap-1.5">
                    <span class="material-symbols-outlined !text-[15px] text-[var(--primary)]">category</span>
                    Conhecimentos Gerais
                  </span>
                  <span class="bg-[#e1dfff] dark:bg-[#2b20d2]/30 text-[#2b20d2] dark:text-[#c1c1ff] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {{ promptQualitySummary.gerais.length }} Disciplinas
                  </span>
                </div>

                <div *ngIf="promptQualitySummary.gerais.length === 0" class="text-xs text-[var(--outline)] italic p-2">
                  Nenhuma disciplina geral cadastrada.
                </div>

                <div *ngFor="let d of promptQualitySummary.gerais" class="neo-raised rounded-xl p-3 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--on-surface)]">{{ d.disciplina }}</span>
                    <span class="text-[10px] font-bold text-[var(--primary)] bg-[#e1dfff] dark:bg-[#2b20d2]/30 dark:text-[#c1c1ff] px-2 py-0.5 rounded-md">
                      {{ d.topicosCount }} tópicos • {{ d.subtopicosCount }} subtópicos
                    </span>
                  </div>
                </div>
              </div>

              <!-- Conhecimentos Específicos -->
              <div class="neo-pressed rounded-2xl p-4 space-y-3 bg-[var(--surface-container-low)]/50 dark:bg-[#202433]/50">
                <div class="flex items-center justify-between border-b border-[var(--outline-variant)]/40 pb-2">
                  <span class="text-xs font-extrabold text-[var(--secondary)] flex items-center gap-1.5">
                    <span class="material-symbols-outlined !text-[15px] text-[var(--secondary)]">stars</span>
                    Conhecimentos Específicos
                  </span>
                  <span class="bg-[#e9ddff] dark:bg-[#5516be]/30 text-[#5516be] dark:text-[#d0bcff] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {{ promptQualitySummary.especificos.length }} Disciplinas
                  </span>
                </div>

                <div *ngIf="promptQualitySummary.especificos.length === 0" class="text-xs text-[var(--outline)] italic p-2">
                  Nenhuma disciplina específica cadastrada.
                </div>

                <div *ngFor="let d of promptQualitySummary.especificos" class="neo-raised rounded-xl p-3 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--on-surface)]">{{ d.disciplina }}</span>
                    <span class="text-[10px] font-bold text-[var(--secondary)] bg-[#e9ddff] dark:bg-[#5516be]/30 dark:text-[#d0bcff] px-2 py-0.5 rounded-md">
                      {{ d.topicosCount }} tópicos • {{ d.subtopicosCount }} subtópicos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Código JSON Bruto do Prompt 1 (conteudo_programatico) -->
          <div class="neo-pressed rounded-2xl p-4">
            <h4 class="text-xs font-bold text-[var(--on-surface)] mb-2 flex items-center justify-between">
              <span>Estrutura JSON das Disciplinas Extraídas (Prompt 1 — <code>conteudo_programatico</code>)</span>
              <span class="text-[10px] font-bold text-[var(--primary)] bg-[#e1dfff] dark:bg-[#2b20d2]/30 dark:text-[#c1c1ff] px-2 py-0.5 rounded-md">Draft-07 Schema</span>
            </h4>
            <pre class="bg-[#191c1e] text-[#eefff2] p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-96">{{ promptQualityJson }}</pre>
          </div>

          <!-- Seção de Relatório Psicométrico de Questões -->
          <div class="border-t border-[var(--outline-variant)]/40 pt-6 space-y-4">
            <div class="bg-[#eefff2] dark:bg-[#003824]/40 border border-[#6ffbbe] dark:border-[#006847] rounded-2xl p-4 text-xs text-[#005236] dark:text-[#6ffbbe] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[var(--tertiary)]">description</span>
                <span>Relatório salvo em tempo real em <code>backend/data/quality_analysis.json</code> e <code>questions.json</code></span>
              </div>
              <span class="font-bold">Total Analisado: {{ qualityReport?.total_questions_analyzed || questions.length }} Questões</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="neo-pressed rounded-2xl p-4 text-center">
                <p class="text-xs text-[var(--outline)]">Score de Clareza Médio</p>
                <h4 class="text-xl font-bold text-[var(--primary)]">{{ qualityReport?.average_metrics?.avg_clarity_score || 9.5 }}/10</h4>
              </div>
              <div class="neo-pressed rounded-2xl p-4 text-center">
                <p class="text-xs text-[var(--outline)]">Plausibilidade dos Distratores</p>
                <h4 class="text-xl font-bold text-[var(--secondary)]">{{ qualityReport?.average_metrics?.avg_distractor_plausibility || 9.1 }}/10</h4>
              </div>
              <div class="neo-pressed rounded-2xl p-4 text-center">
                <p class="text-xs text-[var(--outline)]">Qualidade Psicométrica Geral</p>
                <h4 class="text-xl font-bold text-[var(--tertiary)]">{{ qualityReport?.average_metrics?.avg_overall_quality_score || 9.3 }}/10</h4>
              </div>
            </div>

            <div class="neo-pressed rounded-2xl p-4">
              <h4 class="text-xs font-bold text-[var(--on-surface)] mb-2">Estrutura JSON do Relatório de Qualidade em Disco (backend/data/quality_analysis.json)</h4>
              <pre class="bg-[#191c1e] text-[#eefff2] p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-96">{{ qualityReportJson }}</pre>
            </div>
          </div>

        </div>

        <!-- Stats Tab Content (Admin Only) -->
        <div *ngIf="activeTab === 'stats'" class="space-y-8">

          <!-- Header -->
          <div class="flex items-center gap-3 pb-2 border-b border-[var(--outline-variant)]/40">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#433fe5] to-[#6b38d4] flex items-center justify-center">
              <span class="material-symbols-outlined text-white !text-[22px]">bar_chart</span>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-[var(--on-surface)]">Estatísticas de Estudo</h3>
              <p class="text-xs text-[var(--outline)]">Visão analítica do banco de questões — distribuição por banca e tendência histórica por ano.</p>
            </div>
            <span class="ml-auto bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
              <span class="material-symbols-outlined !text-[14px]">lock</span>
              Somente Admin
            </span>
          </div>

          <!-- ============================================================= -->
          <!-- CARD 1: Distribuição de Questões por Banca                    -->
          <!-- ============================================================= -->
          <div class="neo-raised rounded-3xl p-6 space-y-5">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[24px]">account_balance</span>
                <div>
                  <h4 class="text-sm font-extrabold text-[var(--on-surface)]">Distribuição por Banca</h4>
                  <p class="text-[11px] text-[var(--outline)]">Questões no banco por organizador/banca examinadora</p>
                </div>
              </div>
              <span class="bg-[#e1dfff] dark:bg-[#2b20d2]/30 text-[#2b20d2] dark:text-[#c1c1ff] text-xs font-extrabold px-3 py-1 rounded-full">
                {{ statsBancas.length }} Bancas
              </span>
            </div>

            <div *ngIf="statsBancas.length === 0" class="neo-pressed rounded-2xl p-8 text-center">
              <span class="material-symbols-outlined text-[var(--outline)] !text-[36px]">bar_chart</span>
              <p class="text-sm font-bold text-[var(--on-surface)] mt-2">Nenhuma questão com banca definida ainda</p>
            </div>

            <div class="space-y-3">
              <div *ngFor="let item of statsBancas; let i = index" class="group">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      [style.background]="bancaColors[i % bancaColors.length]">{{ i + 1 }}</span>
                    <span class="text-xs font-bold text-[var(--on-surface)]">{{ item.banca }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold text-[var(--primary)]">{{ item.count }}</span>
                    <span class="text-[10px] text-[var(--outline)] font-medium">{{ item.percentage }}%</span>
                  </div>
                </div>
                <div class="w-full bg-[var(--surface-container-high)] rounded-full h-3 overflow-hidden">
                  <div
                    class="h-3 rounded-full transition-all duration-700 ease-out"
                    [style.width]="item.percentage + '%'"
                    [style.background]="bancaColors[i % bancaColors.length]">
                  </div>
                </div>
              </div>
            </div>

            <!-- Totalizador -->
            <div class="neo-pressed rounded-2xl p-4 flex items-center justify-between bg-[var(--surface-container-low)]/60">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[20px]">summarize</span>
                <span class="text-xs font-bold text-[var(--on-surface)]">Total de Questões no Banco</span>
              </div>
              <span class="text-xl font-black text-[var(--primary)]">{{ questions.length }}</span>
            </div>
          </div>

          <!-- ============================================================= -->
          <!-- CARD 2: Questões por Ano — Tendência Histórica                -->
          <!-- ============================================================= -->
          <div class="neo-raised rounded-3xl p-6 space-y-5">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#8455ef] to-[#5516be] flex items-center justify-center text-white shadow-sm">
                  <span class="material-symbols-outlined !text-[22px]">timeline</span>
                </div>
                <div>
                  <h4 class="text-sm font-extrabold text-[var(--on-surface)]">Questões por Ano — Tendência Histórica</h4>
                  <p class="text-[11px] text-[var(--outline)]">Evolução do volume de questões ao longo dos anos por disciplina e banca examinadora</p>
                </div>
              </div>

              <!-- Seletores Combinados e Contadores -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Dropdown de Disciplina -->
                <div class="neo-pressed rounded-xl px-3 py-1.5 flex items-center gap-1.5 bg-[var(--surface-container-high)]/70 border border-[var(--outline-variant)]">
                  <span class="material-symbols-outlined text-[var(--primary)] !text-[16px]">school</span>
                  <select
                    [(ngModel)]="statsAnoSelectedDisciplina"
                    class="bg-transparent text-xs font-extrabold text-[var(--on-surface)] outline-none border-none pr-1 cursor-pointer max-w-[190px] truncate">
                    <option value="Todas" class="bg-[var(--card-bg)] text-[var(--on-surface)]">Todas as Disciplinas ({{ questions.length }})</option>
                    <option *ngFor="let disc of availableDisciplinas" [value]="disc" class="bg-[var(--card-bg)] text-[var(--on-surface)]">
                      {{ disc }} ({{ getDisciplinaTotalCount(disc) }})
                    </option>
                  </select>
                </div>

                <!-- Dropdown de Banca -->
                <div class="neo-pressed rounded-xl px-3 py-1.5 flex items-center gap-1.5 bg-[var(--surface-container-high)]/70 border border-[var(--outline-variant)]">
                  <span class="material-symbols-outlined text-[var(--secondary)] !text-[16px]">account_balance</span>
                  <select
                    [(ngModel)]="statsAnoSelectedBanca"
                    class="bg-transparent text-xs font-extrabold text-[var(--on-surface)] outline-none border-none pr-1 cursor-pointer max-w-[170px] truncate">
                    <option value="Todas" class="bg-[var(--card-bg)] text-[var(--on-surface)]">Todas as Bancas ({{ questions.length }})</option>
                    <option *ngFor="let b of availableBancas" [value]="b" class="bg-[var(--card-bg)] text-[var(--on-surface)]">
                      {{ b }} ({{ getBancaTotalCount(b) }})
                    </option>
                  </select>
                </div>

                <span class="bg-[#e9ddff] dark:bg-[#5516be]/30 text-[#5516be] dark:text-[#d0bcff] text-xs font-extrabold px-3 py-1 rounded-full">
                  {{ statsAnos.length }} Anos
                </span>
              </div>
            </div>

            <!-- Chips de Filtros Rápidos: Disciplinas e Bancas -->
            <div class="space-y-2 pt-1 border-t border-[var(--outline-variant)]/30">
              <!-- Linha 1: Chips de Disciplinas -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span class="text-[10px] font-bold text-[var(--outline)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                  <span class="material-symbols-outlined !text-[13px] text-[var(--primary)]">school</span>
                  Disciplina:
                </span>
                <button
                  type="button"
                  (click)="statsAnoSelectedDisciplina = 'Todas'"
                  [ngClass]="statsAnoSelectedDisciplina === 'Todas' ? 'bg-[var(--primary)] text-white shadow-sm font-black' : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] font-semibold'"
                  class="px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] flex items-center gap-1">
                  <span>Todas</span>
                  <span class="opacity-80 text-[10px]">({{ questions.length }})</span>
                </button>
                <button
                  *ngFor="let disc of availableDisciplinas.slice(0, 6)"
                  type="button"
                  (click)="statsAnoSelectedDisciplina = disc"
                  [ngClass]="statsAnoSelectedDisciplina === disc ? 'bg-[var(--primary)] text-white shadow-sm font-black' : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] font-semibold'"
                  class="px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full shrink-0" [style.background]="getDisciplineColor(disc)"></span>
                  <span>{{ disc }}</span>
                  <span class="opacity-80 text-[10px]">({{ getDisciplinaTotalCount(disc) }})</span>
                </button>
              </div>

              <!-- Linha 2: Chips de Bancas -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span class="text-[10px] font-bold text-[var(--outline)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                  <span class="material-symbols-outlined !text-[13px] text-[var(--secondary)]">account_balance</span>
                  Banca:
                </span>
                <button
                  type="button"
                  (click)="statsAnoSelectedBanca = 'Todas'"
                  [ngClass]="statsAnoSelectedBanca === 'Todas' ? 'bg-[var(--secondary)] text-white shadow-sm font-black' : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] font-semibold'"
                  class="px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] flex items-center gap-1">
                  <span>Todas</span>
                  <span class="opacity-80 text-[10px]">({{ questions.length }})</span>
                </button>
                <button
                  *ngFor="let b of availableBancas.slice(0, 6)"
                  type="button"
                  (click)="statsAnoSelectedBanca = b"
                  [ngClass]="statsAnoSelectedBanca === b ? 'bg-[var(--secondary)] text-white shadow-sm font-black' : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] font-semibold'"
                  class="px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 text-[11px] flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full shrink-0" [style.background]="getBancaColor(b)"></span>
                  <span>{{ b }}</span>
                  <span class="opacity-80 text-[10px]">({{ getBancaTotalCount(b) }})</span>
                </button>
              </div>
            </div>

            <!-- Indicador de Filtros Ativos -->
            <div *ngIf="statsAnoSelectedDisciplina !== 'Todas' || statsAnoSelectedBanca !== 'Todas'" class="flex items-center gap-2 text-xs flex-wrap bg-[var(--surface-container-low)]/80 p-2.5 rounded-2xl border border-[var(--outline-variant)]/40">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[16px]">filter_alt</span>
              <span class="text-[11px] text-[var(--outline)] font-bold">Filtros ativos:</span>
              <span *ngIf="statsAnoSelectedDisciplina !== 'Todas'" class="inline-flex items-center gap-1 bg-[var(--primary)]/15 text-[var(--primary)] px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold">
                <span class="w-1.5 h-1.5 rounded-full" [style.background]="getDisciplineColor(statsAnoSelectedDisciplina)"></span>
                {{ statsAnoSelectedDisciplina }}
                <button type="button" (click)="statsAnoSelectedDisciplina = 'Todas'" class="hover:opacity-75 cursor-pointer ml-1 font-black">×</button>
              </span>
              <span *ngIf="statsAnoSelectedBanca !== 'Todas'" class="inline-flex items-center gap-1 bg-[var(--secondary)]/15 text-[var(--secondary)] px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold">
                <span class="w-1.5 h-1.5 rounded-full" [style.background]="getBancaColor(statsAnoSelectedBanca)"></span>
                {{ statsAnoSelectedBanca }}
                <button type="button" (click)="statsAnoSelectedBanca = 'Todas'" class="hover:opacity-75 cursor-pointer ml-1 font-black">×</button>
              </span>
              <button
                type="button"
                (click)="statsAnoSelectedDisciplina = 'Todas'; statsAnoSelectedBanca = 'Todas'"
                class="ml-auto text-[11px] text-[var(--primary)] font-bold hover:underline cursor-pointer flex items-center gap-0.5">
                <span class="material-symbols-outlined !text-[13px]">refresh</span>
                Limpar filtros
              </button>
            </div>

            <!-- Estado Vazio -->
            <div *ngIf="statsAnos.length === 0" class="neo-pressed rounded-2xl p-8 text-center">
              <span class="material-symbols-outlined text-[var(--outline)] !text-[36px]">timeline</span>
              <p class="text-sm font-bold text-[var(--on-surface)] mt-2">Nenhuma questão encontrada para a combinação de filtros selecionada</p>
              <button
                type="button"
                (click)="statsAnoSelectedDisciplina = 'Todas'; statsAnoSelectedBanca = 'Todas'"
                class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline">
                Redefinir filtros
              </button>
            </div>

            <!-- Gráfico de Barras Vertical por Ano -->
            <div *ngIf="statsAnos.length > 0" class="space-y-4">
              <!-- Barras visuais com cores dinâmicas -->
              <div class="flex items-end gap-2 h-52 px-2 pt-6">
                <div
                  *ngFor="let item of statsAnos"
                  class="flex-1 flex flex-col items-center gap-1.5 group cursor-default min-w-0"
                  [title]="item.ano + ': ' + item.count + ' questões' + (statsAnoSelectedDisciplina !== 'Todas' ? ' em ' + statsAnoSelectedDisciplina : '') + (statsAnoSelectedBanca !== 'Todas' ? ' na ' + statsAnoSelectedBanca : '')"
                >
                  <!-- Tooltip value -->
                  <div class="text-[10px] font-black opacity-80 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                    <span [style.color]="statsAnoSelectedDisciplina !== 'Todas' ? getDisciplineColor(statsAnoSelectedDisciplina) : (statsAnoSelectedBanca !== 'Todas' ? getBancaColor(statsAnoSelectedBanca) : 'var(--secondary)')">
                      {{ item.count }}
                    </span>
                  </div>
                  <!-- Bar -->
                  <div
                    class="w-full rounded-t-lg transition-all duration-700 ease-out hover:brightness-110"
                    [style.background]="statsAnoSelectedDisciplina !== 'Todas' 
                      ? 'linear-gradient(180deg, ' + getDisciplineColor(statsAnoSelectedDisciplina) + ' 0%, ' + getDisciplineColor(statsAnoSelectedDisciplina) + 'cc 100%)' 
                      : (statsAnoSelectedBanca !== 'Todas'
                        ? 'linear-gradient(180deg, ' + getBancaColor(statsAnoSelectedBanca) + ' 0%, ' + getBancaColor(statsAnoSelectedBanca) + 'cc 100%)'
                        : 'linear-gradient(180deg, #8455ef 0%, #5516be 100%)')"
                    [style.height]="(item.count / statsMaxAnoCount * 100) + '%'"
                    [style.min-height]="'6px'"
                  ></div>
                  <!-- Year label -->
                  <span class="text-[10px] font-extrabold text-[var(--on-surface-variant)] truncate w-full text-center">{{ item.ano }}</span>
                </div>
              </div>

              <!-- Tabela de dados analítica por Ano, Disciplinas e Bancas -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr class="bg-[var(--surface-container)] text-[var(--on-surface-variant)] text-[11px] font-black uppercase tracking-wider border-b border-[var(--outline-variant)]">
                      <th class="py-2.5 px-4">Ano</th>
                      <th class="py-2.5 px-4">Questões</th>
                      <th class="py-2.5 px-4">% do Período</th>
                      <th class="py-2.5 px-4">
                        {{ statsAnoSelectedDisciplina === 'Todas' ? 'Disciplinas Cobradas no Ano' : 'Disciplina Selecionada' }}
                      </th>
                      <th class="py-2.5 px-4">
                        {{ statsAnoSelectedBanca === 'Todas' ? 'Bancas Organizadoras no Ano' : 'Banca Selecionada' }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[var(--outline-variant)]/40">
                    <tr *ngFor="let item of statsAnos" class="hover:bg-[var(--surface-container-high)] transition-colors">
                      <td class="py-2.5 px-4 font-extrabold text-[var(--on-surface)]">{{ item.ano }}</td>
                      <td class="py-2.5 px-4">
                        <span class="font-black text-xs" [style.color]="statsAnoSelectedDisciplina !== 'Todas' ? getDisciplineColor(statsAnoSelectedDisciplina) : (statsAnoSelectedBanca !== 'Todas' ? getBancaColor(statsAnoSelectedBanca) : 'var(--secondary)')">
                          {{ item.count }}
                        </span>
                      </td>
                      <td class="py-2.5 px-4 text-[var(--on-surface-variant)] font-semibold">{{ item.percentage }}%</td>
                      
                      <!-- Coluna de Disciplinas no Ano -->
                      <td class="py-2.5 px-4">
                        <div *ngIf="statsAnoSelectedDisciplina === 'Todas'" class="flex items-center gap-1.5 flex-wrap">
                          <span
                            *ngFor="let disc of item.topDisciplinas"
                            (click)="statsAnoSelectedDisciplina = disc.name"
                            class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:scale-105 cursor-pointer transition-all"
                            [title]="disc.name + ': ' + disc.count + ' questões (clique para filtrar)'">
                            <span class="w-2 h-2 rounded-full shrink-0" [style.background]="disc.color"></span>
                            <span class="truncate max-w-[130px]">{{ disc.name }}</span>
                            <strong class="text-[var(--primary)] font-extrabold ml-0.5">{{ disc.count }}</strong>
                          </span>
                        </div>
                        <div *ngIf="statsAnoSelectedDisciplina !== 'Todas'" class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="getDisciplineColor(statsAnoSelectedDisciplina)"></span>
                          <span class="font-bold text-[11px] text-[var(--on-surface)] truncate">{{ statsAnoSelectedDisciplina }}</span>
                          <span class="text-[10px] text-[var(--outline)] font-semibold">({{ item.count }} questões)</span>
                        </div>
                      </td>

                      <!-- Coluna de Bancas no Ano -->
                      <td class="py-2.5 px-4">
                        <div *ngIf="statsAnoSelectedBanca === 'Todas'" class="flex items-center gap-1.5 flex-wrap">
                          <span
                            *ngFor="let b of item.topBancas"
                            (click)="statsAnoSelectedBanca = b.name"
                            class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:scale-105 cursor-pointer transition-all"
                            [title]="b.name + ': ' + b.count + ' questões (clique para filtrar)'">
                            <span class="w-2 h-2 rounded-full shrink-0" [style.background]="b.color"></span>
                            <span class="truncate max-w-[100px]">{{ b.name }}</span>
                            <strong class="text-[var(--secondary)] font-extrabold ml-0.5">{{ b.count }}</strong>
                          </span>
                        </div>
                        <div *ngIf="statsAnoSelectedBanca !== 'Todas'" class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="getBancaColor(statsAnoSelectedBanca)"></span>
                          <span class="font-bold text-[11px] text-[var(--on-surface)] truncate">{{ statsAnoSelectedBanca }}</span>
                          <span class="text-[10px] text-[var(--outline)] font-semibold">({{ item.count }} questões)</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Insights automáticos -->
            <div *ngIf="statsAnos.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="neo-pressed rounded-2xl p-4 text-center bg-[var(--surface-container-low)]/60">
                <p class="text-[11px] font-bold text-[var(--outline)] mb-1">Ano Mais Ativo</p>
                <h5 class="text-lg font-black text-[var(--secondary)]">{{ statsTopAno?.ano || '—' }}</h5>
                <p class="text-[10px] text-[var(--outline)]">
                  {{ statsTopAno?.count }} questões
                  <span *ngIf="statsAnoSelectedDisciplina !== 'Todas'">em {{ statsAnoSelectedDisciplina }}</span>
                  <span *ngIf="statsAnoSelectedBanca !== 'Todas'">na {{ statsAnoSelectedBanca }}</span>
                </p>
              </div>
              <div class="neo-pressed rounded-2xl p-4 text-center bg-[var(--surface-container-low)]/60">
                <p class="text-[11px] font-bold text-[var(--outline)] mb-1">Período Coberto</p>
                <h5 class="text-base font-black text-[var(--on-surface)]">{{ statsAnos[0].ano }} – {{ statsAnos[statsAnos.length - 1].ano }}</h5>
                <p class="text-[10px] text-[var(--outline)]">{{ statsAnos.length }} anos registrados</p>
              </div>
              <div class="neo-pressed rounded-2xl p-4 text-center bg-[var(--surface-container-low)]/60">
                <p class="text-[11px] font-bold text-[var(--outline)] mb-1">Média por Ano</p>
                <h5 class="text-lg font-black text-[var(--primary)]">{{ statsAvgPerYear }}</h5>
                <p class="text-[10px] text-[var(--outline)]">questões/ano ({{ statsFilteredQuestionsForAno.length }} total no filtro)</p>
              </div>
            </div>

            <!-- ============================================================= -->
            <!-- SUB-SEÇÃO: Distribuição Analítica de Disciplinas por Banca    -->
            <!-- ============================================================= -->
            <div class="pt-5 border-t border-[var(--outline-variant)]/40 space-y-4">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary)]">
                    <span class="material-symbols-outlined !text-[20px]">hub</span>
                  </div>
                  <div>
                    <h5 class="text-xs font-black uppercase tracking-wider text-[var(--on-surface)]">Disciplinas por Banca Examinadora</h5>
                    <p class="text-[10px] text-[var(--outline)]">Relação e proporção de matérias aplicadas por cada organizadora</p>
                  </div>
                </div>

                <!-- Seletor de visualização (Visão por Banca vs Bancas por Disciplina) -->
                <div class="flex items-center gap-1 bg-[var(--surface-container)] p-1 rounded-xl text-xs font-bold border border-[var(--outline-variant)]/30">
                  <button
                    type="button"
                    (click)="statsBancaViewMode = 'cards'"
                    [ngClass]="statsBancaViewMode === 'cards' ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm font-black' : 'text-[var(--outline)] hover:text-[var(--on-surface)]'"
                    class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] cursor-pointer">
                    <span class="material-symbols-outlined !text-[14px]">account_balance</span>
                    Visão por Banca
                  </button>
                  <button
                    type="button"
                    (click)="statsBancaViewMode = 'discipline'"
                    [ngClass]="statsBancaViewMode === 'discipline' ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm font-black' : 'text-[var(--outline)] hover:text-[var(--on-surface)]'"
                    class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] cursor-pointer">
                    <span class="material-symbols-outlined !text-[14px]">school</span>
                    Bancas por Disciplina
                  </button>
                </div>
              </div>

              <!-- MODO 1: Visão por Banca (Disciplinas de cada Banca) -->
              <div *ngIf="statsBancaViewMode === 'cards'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  *ngFor="let item of statsDisciplinasPorBanca"
                  class="neo-pressed rounded-2xl p-4 space-y-3 bg-[var(--surface-container-low)]/50 border border-[var(--outline-variant)]/40 hover:border-[var(--primary)]/40 transition-all">
                  <!-- Header da Banca -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="w-3 h-3 rounded-full shrink-0" [style.background]="item.color"></span>
                      <span class="text-xs font-black text-[var(--on-surface)]">{{ item.banca }}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--surface-container-high)] text-[var(--outline)]">
                        {{ item.percentageOfTotal }}% do banco
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-black text-[var(--primary)]">{{ item.total }} questões</span>
                      <button
                        type="button"
                        (click)="statsAnoSelectedBanca = (statsAnoSelectedBanca === item.banca ? 'Todas' : item.banca)"
                        [title]="statsAnoSelectedBanca === item.banca ? 'Remover filtro de banca' : 'Filtrar tendência anual por esta banca'"
                        class="p-1 rounded-lg hover:bg-[var(--surface-container-high)] text-[var(--outline)] hover:text-[var(--primary)] transition-all cursor-pointer">
                        <span class="material-symbols-outlined !text-[16px]">
                          {{ statsAnoSelectedBanca === item.banca ? 'filter_alt_off' : 'filter_alt' }}
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- Barra de Proporção Multi-Segmento por Disciplina -->
                  <div class="w-full bg-[var(--surface-container-high)] rounded-full h-3 overflow-hidden flex" [title]="item.banca + ' - Distribuição'">
                    <div
                      *ngFor="let disc of item.disciplinas"
                      class="h-3 transition-all duration-500 ease-out hover:brightness-110 cursor-pointer"
                      [style.width]="disc.percentage + '%'"
                      [style.background]="disc.color"
                      [title]="disc.name + ': ' + disc.count + ' questões (' + disc.percentage + '%)'"
                      (click)="statsAnoSelectedDisciplina = disc.name; statsAnoSelectedBanca = item.banca">
                    </div>
                  </div>

                  <!-- Tags de Disciplinas da Banca -->
                  <div class="flex items-center gap-1.5 flex-wrap pt-1">
                    <span
                      *ngFor="let disc of item.disciplinas.slice(0, 5)"
                      (click)="statsAnoSelectedDisciplina = disc.name; statsAnoSelectedBanca = item.banca"
                      class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:brightness-95 cursor-pointer transition-all"
                      [title]="'Clique para cruzar ' + disc.name + ' com ' + item.banca">
                      <span class="w-2 h-2 rounded-full shrink-0" [style.background]="disc.color"></span>
                      <span class="truncate max-w-[120px]">{{ disc.name }}</span>
                      <strong class="text-[var(--primary)] font-extrabold ml-0.5">{{ disc.count }}</strong>
                      <span class="text-[9px] text-[var(--outline)] opacity-80">({{ disc.percentage }}%)</span>
                    </span>
                    <span *ngIf="item.disciplinas.length > 5" class="text-[10px] text-[var(--outline)] font-bold px-1.5 py-0.5">
                      +{{ item.disciplinas.length - 5 }} outras
                    </span>
                  </div>
                </div>
              </div>

              <!-- MODO 2: Bancas por Disciplina -->
              <div *ngIf="statsBancaViewMode === 'discipline'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  *ngFor="let item of statsBancasPorTodasDisciplinas"
                  class="neo-pressed rounded-2xl p-4 space-y-3 bg-[var(--surface-container-low)]/50 border border-[var(--outline-variant)]/40 hover:border-[var(--secondary)]/40 transition-all">
                  <!-- Header da Disciplina -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="w-3 h-3 rounded-full shrink-0" [style.background]="item.color"></span>
                      <span class="text-xs font-black text-[var(--on-surface)]">{{ item.disciplina }}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--surface-container-high)] text-[var(--outline)]">
                        {{ item.percentageOfTotal }}% do banco
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-black text-[var(--secondary)]">{{ item.total }} questões</span>
                      <button
                        type="button"
                        (click)="statsAnoSelectedDisciplina = (statsAnoSelectedDisciplina === item.disciplina ? 'Todas' : item.disciplina)"
                        [title]="statsAnoSelectedDisciplina === item.disciplina ? 'Remover filtro de disciplina' : 'Filtrar tendência anual por esta disciplina'"
                        class="p-1 rounded-lg hover:bg-[var(--surface-container-high)] text-[var(--outline)] hover:text-[var(--secondary)] transition-all cursor-pointer">
                        <span class="material-symbols-outlined !text-[16px]">
                          {{ statsAnoSelectedDisciplina === item.disciplina ? 'filter_alt_off' : 'filter_alt' }}
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- Proporção de Bancas que Cobram esta Disciplina -->
                  <div class="w-full bg-[var(--surface-container-high)] rounded-full h-3 overflow-hidden flex" [title]="item.disciplina + ' - Distribuição por Banca'">
                    <div
                      *ngFor="let b of item.bancas"
                      class="h-3 transition-all duration-500 ease-out hover:brightness-110 cursor-pointer"
                      [style.width]="b.percentage + '%'"
                      [style.background]="b.color"
                      [title]="b.name + ': ' + b.count + ' questões (' + b.percentage + '%)'"
                      (click)="statsAnoSelectedDisciplina = item.disciplina; statsAnoSelectedBanca = b.name">
                    </div>
                  </div>

                  <!-- Tags de Bancas da Disciplina -->
                  <div class="flex items-center gap-1.5 flex-wrap pt-1">
                    <span
                      *ngFor="let b of item.bancas.slice(0, 5)"
                      (click)="statsAnoSelectedDisciplina = item.disciplina; statsAnoSelectedBanca = b.name"
                      class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:brightness-95 cursor-pointer transition-all"
                      [title]="'Clique para cruzar ' + item.disciplina + ' com ' + b.name">
                      <span class="w-2 h-2 rounded-full shrink-0" [style.background]="b.color"></span>
                      <span class="truncate max-w-[120px]">{{ b.name }}</span>
                      <strong class="text-[var(--secondary)] font-extrabold ml-0.5">{{ b.count }}</strong>
                      <span class="text-[9px] text-[var(--outline)] opacity-80">({{ b.percentage }}%)</span>
                    </span>
                    <span *ngIf="item.bancas.length > 5" class="text-[10px] text-[var(--outline)] font-bold px-1.5 py-0.5">
                      +{{ item.bancas.length - 5 }} outras
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Users Management Tab Content -->
        <div *ngIf="activeTab === 'users'" class="overflow-x-auto space-y-4">
          <!-- Toast de Usuários -->
          <div *ngIf="showUserToast"
               class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
               [ngClass]="userToastType === 'success' ? 'bg-[#eefff2] dark:bg-[#003824] text-[#005236] dark:text-[#6ffbbe]' : 'bg-[#ffdad6] dark:bg-[#ba1a1a]/30 text-[#93000a] dark:text-[#ffb4ab]'">
            <span class="material-symbols-outlined !text-[16px]">{{ userToastType === 'success' ? 'check_circle' : 'error' }}</span>
            <span>{{ userToastMsg }}</span>
          </div>

          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[var(--outline-variant)] text-[var(--on-surface-variant)] uppercase">
                <th class="py-3 px-4">Usuário</th>
                <th class="py-3 px-4">E-mail</th>
                <th class="py-3 px-4">Perfil Atual</th>
                <th class="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of users" class="border-b border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container-high)] transition-colors">
                <td class="py-3.5 px-4 font-bold text-[var(--on-surface)] flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[var(--primary)] font-bold">
                    {{ u.full_name?.charAt(0) || u.email?.charAt(0) || 'U' }}
                  </div>
                  <span>{{ u.full_name || 'Sem nome' }}</span>
                </td>
                <td class="py-3.5 px-4 text-[var(--on-surface-variant)]">{{ u.email }}</td>
                <td class="py-3.5 px-4">
                  <span 
                    [ngClass]="u.role === 'admin' 
                      ? 'bg-[#e1dfff] dark:bg-[#2b20d2]/30 text-[#2b20d2] dark:text-[#c1c1ff]' 
                      : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)]'"
                    class="px-3 py-1 rounded-full font-bold">
                    {{ u.role === 'admin' ? 'Administrador' : 'Usuário Comum' }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button 
                      (click)="toggleUserRole(u)" 
                      class="btn-neo px-3 py-1.5 rounded-xl text-xs cursor-pointer">
                      {{ u.role === 'admin' ? 'Reverter para Aluno' : 'Promover a Admin' }}
                    </button>
                    <button 
                      (click)="openDeleteUserModal(u)" 
                      title="Excluir Usuário"
                      [disabled]="u.id === user?.id"
                      [class.opacity-30]="u.id === user?.id"
                      [class.cursor-not-allowed]="u.id === user?.id"
                      class="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center justify-center"
                      *ngIf="u.id !== user?.id">
                      <span class="material-symbols-outlined !text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===== MODAL DE UPLOAD DE EDITAL (ADMIN / PARETO 80/20) ===== -->
    <div *ngIf="showUploadModal"
         class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
         style="background: rgba(10, 12, 20, 0.65); backdrop-filter: blur(8px);">
      <div class="neo-raised rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fadeIn bg-white dark:bg-[#141927] border border-[var(--outline-variant)] my-auto flex flex-col max-h-[92vh]">

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
                {{ uploadStatus === 'error' ? 'report_problem' : (uploadStatus === 'completed' ? 'task_alt' : (uploadStatus === 'processing' ? 'sync' : 'cloud_upload')) }}
              </span>
            </div>
            <div>
              <h2 class="text-sm sm:text-base font-extrabold text-[var(--on-surface)]">
                {{ uploadStatus === 'idle' ? 'Upload do Edital' : (uploadStatus === 'error' ? 'Instabilidade no Serviço' : (uploadStatus === 'completed' ? 'Análise Concluída!' : 'Processando Edital com IA')) }}
              </h2>
              <p class="text-[10px] sm:text-[11px] font-semibold"
                 [ngClass]="uploadStatus === 'error' ? 'text-red-500' : (uploadStatus === 'completed' ? 'text-emerald-500' : 'text-[var(--primary)]')">
                {{ uploadStatus === 'idle' ? 'Análise Pareto 3 Camadas • Contexto do Candidato' : (uploadStatus === 'error' ? 'Serviço temporariamente instável' : (uploadStatus === 'completed' ? 'Redirecionando para o mapa de estudos...' : 'Princípio Pareto 80/20 • Extração Cognitiva')) }}
              </p>
            </div>
          </div>
          <button (click)="closeUploadModal()" [disabled]="uploadStatus === 'processing'"
                  class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[var(--on-surface-variant)] hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                  [title]="uploadStatus === 'processing' ? 'Aguarde o término do processamento' : 'Fechar'">
            <span class="material-symbols-outlined !text-[18px]">close</span>
          </button>
        </div>

        <!-- ================= MODO 1: FORMULÁRIO (uploadStatus === 'idle') ================= -->
        <div *ngIf="uploadStatus === 'idle'" class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto flex-1">

          <p class="text-xs text-[var(--on-surface-variant)] leading-relaxed">
            Faça upload do edital oficial. A IA aplicará Pareto 80/20 em 3 camadas gerando mapa de prioridades, cronograma adaptado ao tempo disponível, régua de corte e alertas de banca.
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
                placeholder="Edital para análise -(Ex: Concurso TCU 2026)"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <!-- Concurso Alvo -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">emoji_events</span>
              <input
                [(ngModel)]="editalConcurso"
                type="text"
                placeholder="Concurso alvo (Ex: Receita Federal)"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <!-- Cargo -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">badge</span>
              <input
                [(ngModel)]="editalCargo"
                type="text"
                placeholder="Cargo exatamente como está escrito no edital, dica: copie e cole do edital - (Ex: Auditor Fiscal da Receita Estadual) *"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <!-- Data da prova -->
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">event</span>
              <input
                [(ngModel)]="editalDataProva"
                type="date"
                [min]="today"
                placeholder="Data da prova *"
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <!-- Disponibilidade: horas/dia + dias/semana -->
            <div class="grid grid-cols-2 gap-2">
              <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">schedule</span>
                <input
                  [(ngModel)]="editalHorasPorDia"
                  type="number"
                  min="0.5" max="24" step="0.5"
                  placeholder="Horas/dia *"
                  class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
              </div>
              <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2 bg-[var(--background)]">
                <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">calendar_view_week</span>
                <input
                  [(ngModel)]="editalDiasPorSemana"
                  type="number"
                  min="1" max="7" step="1"
                  placeholder="Dias/semana *"
                  class="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
              </div>
            </div>

            <!-- Resumo dinâmico de disponibilidade -->
            <div *ngIf="editalHorasPorDia && editalDiasPorSemana && editalDataProva" class="bg-purple-100/70 dark:bg-[#7c3aed]/20 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-purple-800 dark:text-[#c084fc] border border-purple-200/60 dark:border-[#7c3aed]/30">
              <span class="material-symbols-outlined !text-[15px]">insights</span>
              <span>{{ editalHorasPorDia }}h/dia × {{ editalDiasPorSemana }} dias = <strong>{{ editalHorasPorDia * editalDiasPorSemana }}h/semana</strong>
              &nbsp;|&nbsp; {{ semanasDisponiveis }} semanas até a prova
              &nbsp;|&nbsp; ~<strong>{{ editalTotalHoras }}h</strong> no total</span>
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
                class="w-full bg-transparent border-none outline-none text-xs sm:text-sm px-1 text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <div *ngIf="editalUploadMode === 'pdf'" class="neo-pressed rounded-2xl p-5 sm:p-6 border-2 border-dashed border-[var(--outline-variant)] flex flex-col items-center justify-center text-center relative hover:border-[var(--primary)] transition-colors cursor-pointer bg-[var(--background)]">
              <span class="material-symbols-outlined !text-[36px] sm:!text-[40px] text-[var(--primary)] mb-1">picture_as_pdf</span>
              <p class="text-xs font-semibold text-[var(--on-surface)] truncate max-w-xs">
                {{ selectedEditalFile ? selectedEditalFile.name : 'Selecionar Edital em PDF' }}
              </p>
              <input type="file" (change)="onEditalSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
          </div>

          <!-- Toast Feedback no Modal -->
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
                  {{ uploadStatus === 'error' ? 'Processamento Interrompido' : (uploadStatus === 'completed' ? 'Processamento Finalizado' : 'Executando Análise Pareto 80/20') }}
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
          <div class="rounded-2xl p-3.5 sm:p-4 bg-slate-900/95 dark:bg-[#0b0e17] text-slate-100 border border-purple-500/20 shadow-inner max-h-[300px] sm:max-h-[340px] overflow-y-auto space-y-2.5">
            <div class="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full"
                      [ngClass]="uploadStatus === 'error' ? 'bg-red-400' : (uploadStatus === 'completed' ? 'bg-emerald-400' : 'bg-purple-400 animate-ping')"></span>
                <span>LOGS DE PROCESSAMENTO DA IA</span>
              </span>
              <span>PARETO ENGINE 80/20</span>
            </div>

            <div *ngFor="let step of analysisLogs; let i = index"
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
          <!-- Footer when form is active -->
          <div *ngIf="uploadStatus === 'idle'" class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              (click)="closeUploadModal()"
              [disabled]="isUploadingEdital"
              class="w-full sm:flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50 cursor-pointer">
              Cancelar
            </button>
            <button
              (click)="uploadEdital()"
              [disabled]="!isEditalFormValid || isUploadingEdital"
              class="w-full sm:flex-1 py-3 rounded-2xl font-bold btn-mesh flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
              style="background: linear-gradient(135deg, #6b38d4 0%, #8455ef 100%);">
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
          <div *ngIf="uploadStatus === 'completed'" class="flex items-center justify-center gap-2 py-1 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold animate-fadeIn">
            <span class="material-symbols-outlined !text-[18px]">check_circle</span>
            <span>Estrutura concluída com sucesso! Redirecionando...</span>
          </div>

          <!-- Footer when error -->
          <div *ngIf="uploadStatus === 'error'" class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              (click)="closeUploadModal()"
              class="w-full sm:w-1/3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
              Fechar
            </button>
            <button
              (click)="retryUploadForm()"
              class="w-full sm:flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer">
              <span class="material-symbols-outlined !text-[18px]">refresh</span>
              <span>Voltar e Tentar Novamente</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal de Edição de Análise de Edital (Admin) -->
    <div *ngIf="showEditModal"
         class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div class="neo-raised bg-white dark:bg-[#1e232a] text-[var(--on-surface)] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-[var(--outline-variant)]/30 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[22px]">edit_note</span>
            <h3 class="text-base font-bold text-[var(--on-surface)]">Editar Análise de Edital</h3>
          </div>
          <button (click)="closeEditModal()" class="text-[var(--outline)] hover:text-[var(--on-surface)] transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4 overflow-y-auto flex-1">
          <p class="text-xs text-[var(--outline)]">
            Atualize as informações do concurso/cargo para este edital. Você pode salvar apenas o contexto ou reprocessar o edital com Pareto 80/20.
          </p>

          <!-- Título Principal do Edital (Edital para análise) -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">description</span>
            <input
              [(ngModel)]="editTitle"
              type="text"
              placeholder="Título Principal (Edital para análise - Ex: Concurso TCU 2026) *"
              class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
          </div>

          <!-- Cargo -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">badge</span>
            <input
              [(ngModel)]="editCargo"
              type="text"
              placeholder="Cargo *"
              class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
          </div>

          <!-- Concurso -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">emoji_events</span>
            <input
              [(ngModel)]="editConcurso"
              type="text"
              placeholder="Concurso alvo"
              class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
          </div>

          <!-- Data da prova -->
          <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
            <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">event</span>
            <input
              [(ngModel)]="editDataProva"
              type="date"
              [min]="today"
              class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)]">
          </div>

          <!-- Horas/dia + Dias/semana -->
          <div class="grid grid-cols-2 gap-2">
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">schedule</span>
              <input
                [(ngModel)]="editHorasPorDia"
                type="number"
                min="0.5" max="24" step="0.5"
                placeholder="Horas/dia"
                class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>
            <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[18px] shrink-0">calendar_view_week</span>
              <input
                [(ngModel)]="editDiasPorSemana"
                type="number"
                min="1" max="7" step="1"
                placeholder="Dias/semana"
                class="w-full bg-transparent border-none outline-none text-sm text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>
          </div>

          <!-- Seção de re-análise: novo arquivo/link (opcional) -->
          <div class="rounded-xl border border-dashed border-[var(--outline-variant)] p-3 space-y-2">
            <p class="text-[11px] font-bold text-[var(--outline)] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[14px]">refresh</span>
              Re-análise (opcional — somente para "Salvar e Reenviar")
            </p>
            <!-- Modo link / pdf -->
            <div class="flex gap-2 bg-[var(--surface-container)] p-0.5 rounded-lg">
              <button type="button"
                (click)="editUploadMode = 'none'"
                [ngClass]="editUploadMode === 'none' ? 'bg-white dark:bg-[#32394f] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'"
                class="flex-1 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer">Sem novo arquivo</button>
              <button type="button"
                (click)="editUploadMode = 'link'"
                [ngClass]="editUploadMode === 'link' ? 'bg-white dark:bg-[#32394f] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'"
                class="flex-1 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer">Novo Link</button>
              <button type="button"
                (click)="editUploadMode = 'pdf'"
                [ngClass]="editUploadMode === 'pdf' ? 'bg-white dark:bg-[#32394f] shadow-sm text-[var(--primary)]' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'"
                class="flex-1 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer">Novo PDF</button>
            </div>

            <div *ngIf="editUploadMode === 'link'" class="neo-pressed rounded-lg p-2.5 flex items-center gap-2">
              <span class="material-symbols-outlined text-[var(--primary)] !text-[16px]">link</span>
              <input [(ngModel)]="editLink" type="text" placeholder="Cole aqui a URL do edital"
                class="w-full bg-transparent border-none outline-none text-xs text-[var(--on-surface)] placeholder:text-[var(--outline)]">
            </div>

            <div *ngIf="editUploadMode === 'pdf'" class="neo-pressed rounded-xl p-4 border-2 border-dashed border-[var(--outline-variant)] flex flex-col items-center text-center relative hover:border-[var(--secondary)] transition-colors cursor-pointer">
              <span class="material-symbols-outlined !text-[28px] text-[var(--secondary)] mb-1">picture_as_pdf</span>
              <p class="text-xs font-semibold text-[var(--on-surface)]">{{ editFile ? editFile.name : 'Selecionar novo PDF' }}</p>
              <input type="file" (change)="onEditFileSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
          </div>

          <!-- Toast do modal -->
          <div *ngIf="showEditToast"
               class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
               [ngClass]="editToastType === 'success' ? 'bg-[#eefff2] dark:bg-[#003824] text-[#005236] dark:text-[#6ffbbe]' : 'bg-[#ffdad6] dark:bg-[#ba1a1a]/30 text-[#93000a] dark:text-[#ffb4ab]'">
            <span class="material-symbols-outlined !text-[16px]">{{ editToastType === 'success' ? 'check_circle' : 'error' }}</span>
            <span>{{ editToastMsg }}</span>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 pb-6 pt-4 border-t border-[var(--outline-variant)]/30 flex gap-3">
          <button
            (click)="closeEditModal()"
            class="flex-1 py-3 rounded-xl text-sm font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors cursor-pointer">
            Cancelar
          </button>
          <button
            (click)="saveEditalContext()"
            [disabled]="!editCargo || isSaving"
            class="flex-1 py-3 rounded-xl text-sm font-bold btn-neo flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined !text-[18px]">save</span>
            <span>{{ isSaving ? 'Salvando...' : 'Salvar' }}</span>
          </button>
          <button
            (click)="saveAndReanalyze()"
            [disabled]="!editCargo || isSaving || isReanalyzing"
            class="flex-1 py-3 rounded-xl text-sm font-bold btn-mesh flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined !text-[18px]">{{ isReanalyzing ? 'hourglass_top' : 'auto_awesome' }}</span>
            <span>{{ isReanalyzing ? 'Analisando...' : 'Salvar e Reenviar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Edição de Questão (Admin) -->
    <div *ngIf="showEditQuestionModal"
         class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div class="neo-raised bg-white dark:bg-[#1e232a] text-[#191c1e] dark:text-[#f7f9fc] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-[#e2e8f0] dark:border-[#2d3748] flex items-center justify-between bg-white dark:bg-[#151921]">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[#433fe5] dark:text-[#818cf8] !text-[24px]">edit_note</span>
            <div>
              <h3 class="text-base font-extrabold text-[#191c1e] dark:text-white">Editar Questão</h3>
              <p class="text-xs text-[#64748b] dark:text-[#94a3b8]">ID: <span class="font-mono font-bold">{{ editQuestionForm.id ? 'Q' + editQuestionForm.id : editQuestionForm.id_qc }}</span></p>
            </div>
          </div>
          <button (click)="closeEditQuestionModal()" class="text-[#64748b] hover:text-[#0f172a] dark:text-[#94a3b8] dark:hover:text-white transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4 overflow-y-auto flex-1 text-xs md:text-sm">
          
          <!-- Metadados Básicos (Grid 2 colunas) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Disciplina *</label>
              <input type="text" [(ngModel)]="editQuestionForm.disciplina" class="w-full neo-pressed rounded-xl p-2.5 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-medium">
            </div>
            <div>
              <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Assunto / Tópico</label>
              <input type="text" [(ngModel)]="editQuestionForm.assunto" class="w-full neo-pressed rounded-xl p-2.5 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-medium">
            </div>
            <div>
              <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Banca</label>
              <input type="text" [(ngModel)]="editQuestionForm.banca" class="w-full neo-pressed rounded-xl p-2.5 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-medium">
            </div>
            <div>
              <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Ano</label>
              <input type="number" [(ngModel)]="editQuestionForm.ano" min="1900" max="2100" class="w-full neo-pressed rounded-xl p-2.5 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-medium">
            </div>
            <div>
              <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Órgão</label>
              <input type="text" [(ngModel)]="editQuestionForm.orgao" class="w-full neo-pressed rounded-xl p-2.5 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-medium">
            </div>
            <div>
              <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Cargo</label>
              <input type="text" [(ngModel)]="editQuestionForm.cargo" class="w-full neo-pressed rounded-xl p-2.5 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-medium">
            </div>
          </div>

          <!-- Tipo de Questão & Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Tipo de Questão</label>
              <select [(ngModel)]="editQuestionForm.tipo" (change)="onEditQuestionTipoChange()" class="w-full neo-pressed rounded-xl p-2.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] outline-none font-medium text-[var(--on-surface)]">
                <option value="multipla_escolha">Múltipla Escolha</option>
                <option value="certo_errado">Certo / Errado</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Status de Liberação</label>
              <select [(ngModel)]="editQuestionForm.is_released" class="w-full neo-pressed rounded-xl p-2.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] outline-none font-medium text-[var(--on-surface)]">
                <option [ngValue]="true">Liberada (Visível aos Alunos)</option>
                <option [ngValue]="false">Rascunho (Oculta dos Alunos)</option>
              </select>
            </div>
          </div>

          <!-- Enunciado -->
          <div class="pt-2">
            <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Enunciado *</label>
            <textarea [(ngModel)]="editQuestionForm.enunciado" rows="4" class="w-full neo-pressed rounded-xl p-3 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-normal leading-relaxed resize-y"></textarea>
          </div>

          <!-- Alternativas -->
          <div class="pt-2 space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-bold text-[#475569] dark:text-[#cbd5e1]">Alternativas</label>
              <button type="button" *ngIf="editQuestionForm.tipo === 'multipla_escolha'" (click)="addEditQuestionOption()" class="text-xs font-bold text-[#433fe5] dark:text-[#818cf8] hover:underline flex items-center gap-1">
                <span class="material-symbols-outlined !text-[16px]">add_circle</span> Adicionar Opção
              </button>
            </div>

            <div *ngFor="let opt of editQuestionAlternativas; let idx = index" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[#e2e8f0] dark:bg-[#2d3748] font-bold flex items-center justify-center shrink-0">
                {{ opt.letra }}
              </div>
              <input type="text" [(ngModel)]="opt.texto" placeholder="Texto da alternativa..." class="flex-1 neo-pressed rounded-xl p-2.5 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-normal">
              <button type="button" *ngIf="editQuestionForm.tipo === 'multipla_escolha' && editQuestionAlternativas.length > 2" (click)="removeEditQuestionOption(idx)" class="text-[#ef4444] p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40">
                <span class="material-symbols-outlined !text-[18px]">delete</span>
              </button>
            </div>
          </div>

          <!-- Resposta Correta (Gabarito) -->
          <div class="pt-2">
            <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Gabarito (Resposta Correta) *</label>
            <select [(ngModel)]="editQuestionForm.resposta_correta" class="w-full neo-pressed rounded-xl p-2.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] outline-none font-bold text-[var(--tertiary)]">
              <option *ngFor="let opt of editQuestionAlternativas" [value]="opt.letra">
                Alternativa {{ opt.letra }} {{ opt.texto ? '- ' + (opt.texto | slice:0:30) + '...' : '' }}
              </option>
            </select>
          </div>

          <!-- Gabarito Comentado -->
          <div class="pt-2">
            <label class="block font-bold text-[#475569] dark:text-[#cbd5e1] mb-1">Gabarito Comentado / Explicação</label>
            <textarea [(ngModel)]="editQuestionForm.gabarito_comentado" rows="3" placeholder="Explicação detalhada da questão..." class="w-full neo-pressed rounded-xl p-3 bg-transparent border border-[#cbd5e1] dark:border-[#4a5568] outline-none font-normal leading-relaxed resize-y"></textarea>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-[#e2e8f0] dark:border-[#2d3748] bg-white dark:bg-[#151921] flex items-center justify-end gap-3">
          <button type="button" (click)="closeEditQuestionModal()" class="px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm text-[#64748b] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] transition-colors cursor-pointer">
            Cancelar
          </button>
          <button type="button" (click)="saveQuestionChanges()" [disabled]="isSavingQuestion || !editQuestionForm.enunciado" class="px-6 py-2.5 rounded-xl font-extrabold text-xs md:text-sm text-white bg-[#433fe5] hover:bg-[#3632c2] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined !text-[18px]" *ngIf="isSavingQuestion">hourglass_top</span>
            <span>{{ isSavingQuestion ? 'Salvando...' : 'Salvar Alterações' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão (Admin) -->
    <div *ngIf="showDeleteQuestionModal"
         class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div class="neo-raised bg-white dark:bg-[#1e232a] text-[#191c1e] dark:text-[#f7f9fc] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5 text-center">
        <div class="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined !text-[32px]">warning</span>
        </div>

        <div class="space-y-2">
          <h3 class="text-lg font-black text-[#0f172a] dark:text-white">Excluir Questão?</h3>
          <p class="text-xs md:text-sm text-[#64748b] dark:text-[#cbd5e1] leading-relaxed">
            Você tem certeza que deseja excluir a questão <strong class="text-red-600 dark:text-red-400">{{ questionToDelete?.id ? 'Q' + questionToDelete.id : questionToDelete?.id_qc }}</strong>? 
            Esta ação é irreversível e removerá a questão do banco de dados.
          </p>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button type="button" (click)="closeDeleteQuestionModal()" class="flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm text-[#64748b] dark:text-[#cbd5e1] bg-[#f1f5f9] dark:bg-[#2d3748] hover:bg-[#e2e8f0] dark:hover:bg-[#3a475c] transition-colors cursor-pointer">
            Cancelar
          </button>
          <button type="button" (click)="executeDeleteQuestion()" [disabled]="isDeletingQuestion" class="flex-1 py-2.5 rounded-xl font-extrabold text-xs md:text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined !text-[18px]" *ngIf="isDeletingQuestion">hourglass_top</span>
            <span>{{ isDeletingQuestion ? 'Excluindo...' : 'Excluir Definitivamente' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão de Usuário (Admin) -->
    <div *ngIf="showDeleteUserModal"
         class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div class="neo-raised bg-white dark:bg-[#1e232a] text-[#191c1e] dark:text-[#f7f9fc] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5 text-center">
        <div class="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined !text-[32px]">person_remove</span>
        </div>

        <div class="space-y-2">
          <h3 class="text-lg font-black text-[#0f172a] dark:text-white">Excluir Usuário?</h3>
          <p class="text-xs md:text-sm text-[#64748b] dark:text-[#cbd5e1] leading-relaxed">
            Você tem certeza que deseja excluir o usuário <strong class="text-red-600 dark:text-red-400">{{ userToDelete?.full_name || userToDelete?.email }}</strong> (<span class="font-medium">{{ userToDelete?.email }}</span>)?
          </p>
          <p class="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-left">
            ⚠️ <strong>Atenção:</strong> Esta ação removerá o usuário permanentemente do Supabase Auth e liberará o e-mail para novos cadastros.
          </p>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button type="button" (click)="closeDeleteUserModal()" class="flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm text-[#64748b] dark:text-[#cbd5e1] bg-[#f1f5f9] dark:bg-[#2d3748] hover:bg-[#e2e8f0] dark:hover:bg-[#3a475c] transition-colors cursor-pointer">
            Cancelar
          </button>
          <button type="button" (click)="executeDeleteUser()" [disabled]="isDeletingUser" class="flex-1 py-2.5 rounded-xl font-extrabold text-xs md:text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined !text-[18px]" *ngIf="isDeletingUser">hourglass_top</span>
            <span>{{ isDeletingUser ? 'Excluindo...' : 'Excluir Definitivamente' }}</span>
          </button>
        </div>
      </div>
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.25s ease-out;
      }
    </style>
  `
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  user: UserProfile | null = null;
  questions: any[] = [];
  questionsCurrentPage: number = 1;
  questionsPageSize: number = 10;

  // Question search filters
  searchSubject = '';
  selectedDisciplina = '';
  selectedBanca = '';
  selectedAno = '';
  selectedOrgao = '';
  filterCargo = '';
  filterAssunto = '';

  // Edit Question Modal state
  showEditQuestionModal: boolean = false;
  isSavingQuestion: boolean = false;
  editQuestionForm: any = {};
  editQuestionAlternativas: { letra: string; texto: string }[] = [];

  // Delete Question Modal state
  showDeleteQuestionModal: boolean = false;
  isDeletingQuestion: boolean = false;
  questionToDelete: any = null;

  // Delete User Modal state
  showDeleteUserModal: boolean = false;
  isDeletingUser: boolean = false;
  userToDelete: any = null;
  userToastMsg = '';
  userToastType: 'success' | 'error' = 'success';
  showUserToast = false;

  users: any[] = [];
  editais: any[] = [];
  qualityReport: any = null;
  activeTab: 'questions' | 'quality' | 'users' | 'editais' | 'stats' = 'questions';

  // Real-Time Logs State
  importLogs: { message: string, type: string, time: Date }[] = [];
  private logEventSource: EventSource | null = null;
  isLogConsoleExpanded: boolean = false;

  get editaisAnalisados(): any[] {
    return (this.editais || []).filter(ed => ed.status === 'completed' || ed.pareto_data);
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
      // 1. Disciplina
      if (this.selectedDisciplina) {
        const disc = (q.disciplina || q.subject || '').toString().toLowerCase();
        if (disc !== this.selectedDisciplina.toLowerCase()) return false;
      }

      // 2. Banca
      if (this.selectedBanca) {
        const banca = (q.banca || '').toString().toLowerCase();
        if (banca !== this.selectedBanca.toLowerCase()) return false;
      }

      // 3. Ano
      if (this.selectedAno) {
        if (String(q.ano) !== String(this.selectedAno)) return false;
      }

      // 4. Órgão
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

  get paginatedQuestions(): any[] {
    const start = (this.questionsCurrentPage - 1) * this.questionsPageSize;
    return (this.filteredQuestions || []).slice(start, start + this.questionsPageSize);
  }

  onQuestionsPageChange(page: number) {
    this.questionsCurrentPage = page;
  }

  goToTab(tab: 'questions' | 'quality' | 'users' | 'stats') {
    this.activeTab = tab;
    setTimeout(() => {
      const el = document.getElementById('tabbed-views-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  selectedPdfFile: File | null = null;
  selectedEditalFile: File | null = null;

  // Estado de upload do JSON de Questões
  selectedJsonFile: File | null = null;
  parsedJsonData: any = null;
  jsonPreviewCount: number | null = null;
  isUploadingJson = false;
  jsonUploadToastMsg: string | null = null;
  jsonUploadToastType: 'success' | 'error' = 'success';

  onJsonFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file: File = event.target.files[0];
      this.selectedJsonFile = file;
      this.jsonUploadToastMsg = null;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const content = JSON.parse(e.target.result);
          this.parsedJsonData = content;

          let questionsList: any[] = [];
          if (Array.isArray(content)) {
            questionsList = content.map(q => ({
              disciplina: q.disciplina || q.subject || q.materia || null,
              ...q
            }));
          } else if (content && typeof content === 'object') {
            const topDisciplina = content.disciplina || content.subject || content.materia || null;
            const raw = content.questoes || content.questions || content.data || content.items;
            if (Array.isArray(raw)) {
              questionsList = raw.map((q: any) => ({
                disciplina: q.disciplina || topDisciplina || q.subject || null,
                ...q,
              }));
            } else if (content.enunciado || content.pergunta || content.texto || content.statement) {
              questionsList = [{
                disciplina: content.disciplina || topDisciplina || null,
                ...content,
              }];
            } else {
              questionsList = [content];
            }
          }

          this.jsonPreviewCount = questionsList.length;
        } catch (err) {
          this.parsedJsonData = null;
          this.jsonPreviewCount = null;
          this.jsonUploadToastMsg = 'Arquivo JSON inválido. Verifique a formatação do arquivo.';
          this.jsonUploadToastType = 'error';
        }
      };
      reader.readAsText(file);
    }
  }

  uploadQuestionsJson() {
    if (!this.parsedJsonData) return;

    this.isUploadingJson = true;
    this.jsonUploadToastMsg = null;
    this.connectLogStream(); // Inicia o console de logs

    this.apiService.importQuestionsJson(this.parsedJsonData).subscribe({
      next: (res: any) => {
        this.isUploadingJson = false;
        this.jsonUploadToastType = 'success';
        this.jsonUploadToastMsg = res?.message || 'Questões importadas com sucesso!';
        this.parsedJsonData = null;
        this.selectedJsonFile = null;
        this.jsonPreviewCount = null;
        this.loadDashboardData();
        setTimeout(() => { this.jsonUploadToastMsg = null; }, 6000);
      },
      error: (err: any) => {
        this.isUploadingJson = false;
        this.jsonUploadToastType = 'error';
        this.jsonUploadToastMsg = err?.error?.message || 'Erro ao importar questões no servidor.';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // REAL-TIME LOGS
  // ---------------------------------------------------------------------------

  connectLogStream() {
    if (this.logEventSource) return;
    this.isLogConsoleExpanded = true;
    this.importLogs = [];
    this.logEventSource = this.apiService.getEventSource('/questions/import-logs');
    
    this.logEventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        this.importLogs.push({
          message: log.message,
          type: log.type,
          time: new Date(log.time)
        });
        this.scrollToBottomLogs();
      } catch (e) {
        console.error('Error parsing log message', e);
      }
    };
  }

  disconnectLogStream() {
    if (this.logEventSource) {
      this.logEventSource.close();
      this.logEventSource = null;
    }
  }

  scrollToBottomLogs() {
    setTimeout(() => {
      const el = document.getElementById('log-console-container');
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  ngOnDestroy() {
    this.disconnectLogStream();
    this.clearUploadLogInterval();
  }

  private getCurrentTimeStr(): string {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  }

  // Campos do contexto do candidato
  editalTitle = '';
  editalLink = '';
  editalCargo = '';          // Cargo específico (obrigatório)
  editalConcurso = '';       // Concurso alvo
  editalDataProva = '';      // Data da prova (ISO string)
  editalHorasPorDia: number | null = null;    // h/dia
  editalDiasPorSemana: number | null = null;  // dias/semana

  editalUploadMode: 'link' | 'pdf' = 'link';

  /** Data mínima para o date picker (hoje) */
  readonly today = new Date().toISOString().split('T')[0];

  isUploadingPdf = false;
  isUploadingEdital = false;

  // ---- Modal de Upload de Edital (Admin) ----
  showUploadModal = false;
  showUploadToast = false;
  uploadToastMsg = '';
  uploadToastType: 'success' | 'error' = 'success';

  // ---- Simulação de Logs de Processamento IA ----
  uploadStatus: 'idle' | 'processing' | 'completed' | 'error' = 'idle';
  uploadProgress = 0;
  uploadLogInterval: any = null;
  uploadErrorMessage = '';
  analysisLogs: AnalysisLogStep[] = [];

  openUploadModal() {
    this.uploadStatus = 'idle';
    this.isUploadingEdital = false;
    this.uploadErrorMessage = '';
    this.showUploadModal = true;
    this.showUploadToast = false;
  }

  closeUploadModal() {
    if (this.uploadStatus === 'processing') return;
    this.clearUploadLogInterval();
    this.uploadStatus = 'idle';
    this.isUploadingEdital = false;
    this.showUploadModal = false;
    this.showUploadToast = false;
  }

  retryUploadForm() {
    this.clearUploadLogInterval();
    this.uploadStatus = 'idle';
    this.isUploadingEdital = false;
    this.uploadErrorMessage = '';
  }

  clearUploadLogInterval() {
    if (this.uploadLogInterval) {
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
        detail: `Contexto do concurso e perfil registrados com sucesso${displayConcurso}.`,
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
        detail: 'Separando disciplinas básicas e específicas, tópicos e subtópicos com pesos.',
        status: 'pending'
      },
      {
        id: 'pareto',
        icon: 'query_stats',
        title: 'Aplicando Análise Pareto 80/20',
        detail: 'Identificando o núcleo de 20% das matérias de maior incidência histórica.',
        status: 'pending'
      },
      {
        id: 'regua',
        icon: 'balance',
        title: 'Calibrando Régua de Corte e Pesos',
        detail: 'Estimando pontuação de corte e critérios de desempate da banca examinadora.',
        status: 'pending'
      },
      {
        id: 'plano',
        icon: 'auto_awesome',
        title: 'Finalizando Plano Estratégico',
        detail: 'Estruturando cronograma adaptativo de estudos e mapa de prioridades.',
        status: 'pending'
      }
    ];

    let currentStep = 1;
    const progressTargets = [12, 25, 42, 58, 72, 85, 93, 97];

    this.uploadLogInterval = setInterval(() => {
      if (this.uploadStatus !== 'processing') {
        this.clearUploadLogInterval();
        return;
      }

      if (currentStep < this.analysisLogs.length - 1) {
        this.analysisLogs[currentStep].status = 'completed';
        this.analysisLogs[currentStep].time = this.getCurrentTimeStr();

        currentStep++;
        this.analysisLogs[currentStep].status = 'active';
        this.analysisLogs[currentStep].time = this.getCurrentTimeStr();

        this.uploadProgress = progressTargets[currentStep] || 95;
      } else {
        if (this.uploadProgress < 97) {
          this.uploadProgress += 1;
        }
      }
    }, 2200);
  }

  finishUploadSuccess(callback: () => void) {
    this.clearUploadLogInterval();
    this.uploadProgress = 100;
    this.uploadStatus = 'completed';

    this.analysisLogs.forEach(step => {
      step.status = 'completed';
      if (!step.time) step.time = this.getCurrentTimeStr();
    });

    setTimeout(() => {
      this.uploadStatus = 'idle';
      this.isUploadingEdital = false;
      this.showUploadModal = false;
      this.showUploadToast = false;
      callback();
    }, 1200);
  }

  handleUploadError(err?: any) {
    this.clearUploadLogInterval();
    this.isUploadingEdital = false;
    this.uploadStatus = 'error';
    this.uploadErrorMessage = 'O serviço está passando por alguma instabilidade no momento. Por favor, tente novamente mais tarde.';

    const activeStep = this.analysisLogs.find(s => s.status === 'active');
    if (activeStep) {
      activeStep.status = 'error';
      activeStep.time = this.getCurrentTimeStr();
    }
  }

  // Estado para envio de edital para usuário
  sendEditalOpenId: string | null = null;
  sendEditalSelectedUserId = '';
  isSendingEdital = false;
  sendEditalToastId: string | null = null;
  sendEditalToastMsg = '';
  sendEditalToastType: 'success' | 'error' = 'success';

  // ---- Edit Modal ----
  showEditModal = false;
  editingEdital: any = null;
  editTitle = '';
  editCargo = '';
  editConcurso = '';
  editDataProva = '';
  editHorasPorDia: number | null = null;
  editDiasPorSemana: number | null = null;
  editUploadMode: 'link' | 'pdf' | 'none' = 'none';
  editLink = '';
  editFile: File | null = null;
  isSaving = false;
  isReanalyzing = false;
  showEditToast = false;
  editToastMsg = '';
  editToastType: 'success' | 'error' = 'success';

  onEditFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.editFile = event.target.files[0];
    }
  }

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
        this.loadDashboardData();
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
        this.loadDashboardData();
        this.closeEditModal();
      },
      error: () => {
        this.isReanalyzing = false;
        this.editToastMsg = 'Erro ao reanalisar edital. Tente novamente.';
        this.editToastType = 'error';
        this.showEditToast = true;
        setTimeout(() => { this.showEditToast = false; }, 5000);
      }
    });
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.apiService.getQuestions().subscribe(qs => this.questions = qs);
    this.apiService.getUsers().subscribe(us => this.users = us);
    this.apiService.getEditais().subscribe(eds => this.editais = eds);
    this.apiService.getQuestionQualityAnalysis().subscribe(qr => this.qualityReport = qr);
  }

  selectedQualityEditalId: string | null = null;

  get selectedQualityEdital(): any {
    if (this.selectedQualityEditalId) {
      return (this.editais || []).find(e => e.id === this.selectedQualityEditalId) || this.editaisAnalisados[0];
    }
    return this.editaisAnalisados[0] || null;
  }

  get promptQualitySummary(): any {
    const ed = this.selectedQualityEdital;
    if (!ed) return null;

    const pd = ed.pareto_data || ed;
    const cp = pd?.conteudo_programatico || {};

    const parseGroup = (groupData: any) => {
      const result: any[] = [];
      if (Array.isArray(groupData)) {
        for (const item of groupData) {
          const discName = item.disciplina || item.nome || 'Disciplina sem nome';
          const topicos = item.topicos || [];
          let subtopicoCount = 0;
          for (const top of topicos) {
            subtopicoCount += (top.subtopicos || []).length;
          }
          result.push({
            disciplina: discName,
            topicosCount: topicos.length,
            subtopicosCount: subtopicoCount,
            topicos: topicos
          });
        }
      } else if (groupData && typeof groupData === 'object') {
        for (const [discName, discObj] of Object.entries<any>(groupData)) {
          const subtopicos = discObj.subtopicos || [];
          result.push({
            disciplina: discName,
            topicosCount: subtopicos.length ? 1 : 0,
            subtopicosCount: subtopicos.length,
            topicos: [{ nome: discName, subtopicos }]
          });
        }
      }
      return result;
    };

    const gerais = parseGroup(cp.conhecimentos_gerais);
    const especificos = parseGroup(cp.conhecimentos_especificos);

    const totalDisciplinas = gerais.length + especificos.length;
    let totalTopicos = 0;
    let totalSubtopicos = 0;

    [...gerais, ...especificos].forEach(d => {
      totalTopicos += d.topicosCount;
      totalSubtopicos += d.subtopicosCount;
    });

    return {
      editalTitle: ed.title || ed.cargo || 'Edital Analisado',
      cargo: ed.cargo || 'Geral',
      concurso: ed.concurso || '',
      gerais,
      especificos,
      totalDisciplinas,
      totalTopicos,
      totalSubtopicos,
      conteudoProgramaticoRaw: cp,
      isValidSchema: totalDisciplinas > 0
    };
  }

  // ---------------------------------------------------------------------------
  // ESTATÍSTICAS DE ESTUDO (Admin Only)
  // ---------------------------------------------------------------------------

  /** Disciplina selecionada para filtro do gráfico de tendência por ano */
  statsAnoSelectedDisciplina: string = 'Todas';

  /** Banca selecionada para filtro do gráfico de tendência por ano */
  statsAnoSelectedBanca: string = 'Todas';

  /** Modo de visualização para a seção de correlação Disciplinas x Bancas */
  statsBancaViewMode: 'cards' | 'discipline' = 'cards';

  /** Cores padronizadas por disciplina */
  private readonly disciplineColorMap: Record<string, string> = {
    'BANCO DE DADOS': '#0ea5e9',
    'BANCOS DE DADOS': '#0ea5e9',
    'GOVERNANCA': '#f97316',
    'GOVERNANÇA': '#f97316',
    'GOVERNANCA DE TI': '#f97316',
    'GOVERNANÇA DE TI': '#f97316',
    'ENGENHARIA DE SOFTWARE': '#ec4899',
    'REDES DE COMPUTADORES': '#10b981',
    'REDES': '#10b981',
    'SEGURANCA DA INFORMACAO': '#ef4444',
    'SEGURANÇA DA INFORMAÇÃO': '#ef4444',
    'SISTEMAS OPERACIONAIS': '#eab308',
    'ARQUITETURA DE COMPUTADORES': '#8b5cf6',
    'CIENCIA DE DADOS': '#6366f1',
    'CIÊNCIA DE DADOS': '#6366f1',
    'DESENVOLVIMENTO DE SISTEMAS': '#a855f7',
    'PROGRAMACAO': '#a855f7',
    'PROGRAMAÇÃO': '#a855f7',
    'INFORMATICA': '#06b6d4',
    'INFORMÁTICA': '#06b6d4',
    'TECNOLOGIA DA INFORMACAO': '#06b6d4',
    'TECNOLOGIA DA INFORMAÇÃO': '#06b6d4',
    'DIREITO ADMINISTRATIVO': '#5d3bf6',
    'DIREITO CONSTITUCIONAL': '#22d3ee',
    'LINGUA PORTUGUESA': '#10b981',
    'PORTUGUES': '#10b981',
    'PORTUGUÊS': '#10b981',
    'RACIOCINIO LOGICO': '#f59e0b',
    'RACIOCÍNIO LÓGICO': '#f59e0b',
    'MATEMATICA': '#f59e0b',
    'MATEMÁTICA': '#f59e0b',
    'DIREITO PENAL': '#ef4444',
    'DIREITO CIVIL': '#8b5cf6',
    'DIREITO TRIBUTARIO': '#ec4899',
    'ADMINISTRACAO PUBLICA': '#14b8a6',
  };

  getDisciplineColor(disciplinaName: string): string {
    if (!disciplinaName) return '#5d3bf6';
    const normalized = disciplinaName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    if (this.disciplineColorMap[normalized]) {
      return this.disciplineColorMap[normalized];
    }

    const palette = ['#5d3bf6', '#22d3ee', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  getBancaColor(bancaName: string): string {
    if (!bancaName) return '#0284c7';
    const solidColors: Record<string, string> = {
      'FGV': '#0284c7',
      'CEBRASPE': '#059669',
      'CESPE': '#059669',
      'FCC': '#d97706',
      'VUNESP': '#7c3aed',
      'CESGRANRIO': '#dc2626',
      'QUADRIX': '#db2777',
      'IBFC': '#0891b2',
      'AOCP': '#ea580c',
      'INSTITUTO AOCP': '#ea580c',
      'IDECAN': '#4f46e5',
      'FUNDATEC': '#16a34a'
    };
    const key = bancaName.trim().toUpperCase();
    if (solidColors[key]) return solidColors[key];

    const fallbackPalette = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#dc2626', '#db2777', '#0891b2', '#ea580c', '#4f46e5', '#16a34a', '#854d0e', '#0d9488'];
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
  }

  getDisciplinaTotalCount(disciplina: string): number {
    if (!this.questions || this.questions.length === 0) return 0;
    const target = disciplina.trim().toUpperCase();
    return this.questions.filter(q => {
      const d = (q.disciplina || q.subject || '').toString().trim().toUpperCase();
      return d === target;
    }).length;
  }

  getBancaTotalCount(banca: string): number {
    if (!this.questions || this.questions.length === 0) return 0;
    const target = banca.trim().toUpperCase();
    return this.questions.filter(q => {
      const b = (q.banca || '').toString().trim().toUpperCase();
      return b === target;
    }).length;
  }

  get statsFilteredQuestionsForAno(): any[] {
    if (!this.questions || this.questions.length === 0) return [];
    return this.questions.filter(q => {
      if (this.statsAnoSelectedDisciplina !== 'Todas') {
        const d = (q.disciplina || q.subject || '').toString().trim().toUpperCase();
        if (d !== this.statsAnoSelectedDisciplina.trim().toUpperCase()) return false;
      }
      if (this.statsAnoSelectedBanca !== 'Todas') {
        const b = (q.banca || '').toString().trim().toUpperCase();
        if (b !== this.statsAnoSelectedBanca.trim().toUpperCase()) return false;
      }
      return true;
    });
  }

  /** Cores para os gráficos de banca */
  readonly bancaColors = [
    'linear-gradient(135deg, #433fe5 0%, #6b38d4 100%)',
    'linear-gradient(135deg, #00897b 0%, #00bfa5 100%)',
    'linear-gradient(135deg, #e65100 0%, #ff8f00 100%)',
    'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)',
    'linear-gradient(135deg, #ad1457 0%, #e91e63 100%)',
    'linear-gradient(135deg, #37474f 0%, #607d8b 100%)',
    'linear-gradient(135deg, #558b2f 0%, #8bc34a 100%)',
    'linear-gradient(135deg, #6a1b9a 0%, #ab47bc 100%)',
    'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
    'linear-gradient(135deg, #0277bd 0%, #29b6f6 100%)',
  ];

  /** Distribuição de questões por banca, ordenada de maior para menor */
  get statsBancas(): { banca: string; count: number; percentage: string }[] {
    if (!this.questions || this.questions.length === 0) return [];
    const map = new Map<string, number>();
    for (const q of this.questions) {
      const banca = (q.banca || '').toString().trim();
      if (banca) {
        map.set(banca, (map.get(banca) || 0) + 1);
      }
    }
    const total = this.questions.length;
    return Array.from(map.entries())
      .map(([banca, count]) => ({
        banca,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count);
  }

  /** Distribuição de questões por ano, filtrada por disciplina e banca, com top disciplinas e top bancas */
  get statsAnos(): {
    ano: string | number;
    count: number;
    percentage: string;
    topDisciplinas: { name: string; count: number; color: string }[];
    topBancas: { name: string; count: number; color: string }[];
  }[] {
    const list = this.statsFilteredQuestionsForAno;
    if (list.length === 0) return [];
    const map = new Map<string, { total: number; discMap: Map<string, number>; bancaMap: Map<string, number> }>();
    for (const q of list) {
      const ano = q.ano != null && q.ano !== '' ? String(q.ano).trim() : '';
      if (ano) {
        if (!map.has(ano)) {
          map.set(ano, { total: 0, discMap: new Map<string, number>(), bancaMap: new Map<string, number>() });
        }
        const entry = map.get(ano)!;
        entry.total++;
        const d = (q.disciplina || q.subject || 'Geral').toString().trim();
        entry.discMap.set(d, (entry.discMap.get(d) || 0) + 1);
        const b = (q.banca || 'Outras').toString().trim();
        if (b) {
          entry.bancaMap.set(b, (entry.bancaMap.get(b) || 0) + 1);
        }
      }
    }
    const total = list.length;
    return Array.from(map.entries())
      .map(([ano, data]) => {
        const topDisciplinas = Array.from(data.discMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({
            name,
            count,
            color: this.getDisciplineColor(name)
          }));

        const topBancas = Array.from(data.bancaMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({
            name,
            count,
            color: this.getBancaColor(name)
          }));

        return {
          ano,
          count: data.total,
          percentage: total > 0 ? ((data.total / total) * 100).toFixed(1) : '0.0',
          topDisciplinas,
          topBancas
        };
      })
      .sort((a, b) => Number(a.ano) - Number(b.ano));
  }

  /** Ano com mais questões */
  get statsTopAno(): { ano: string | number; count: number; percentage: string } | null {
    if (this.statsAnos.length === 0) return null;
    return this.statsAnos.reduce((max, item) => item.count > max.count ? item : max, this.statsAnos[0]);
  }

  /** Contagem máxima de questões em um único ano (para escalar o gráfico) */
  get statsMaxAnoCount(): number {
    if (this.statsAnos.length === 0) return 1;
    return Math.max(...this.statsAnos.map(i => i.count), 1);
  }

  /** Média de questões por ano */
  get statsAvgPerYear(): string {
    if (this.statsAnos.length === 0) return '0';
    const total = this.statsAnos.reduce((sum, i) => sum + i.count, 0);
    return (total / this.statsAnos.length).toFixed(0);
  }

  /** Distribuição de disciplinas organizadas por Banca */
  get statsDisciplinasPorBanca(): {
    banca: string;
    total: number;
    color: string;
    percentageOfTotal: string;
    disciplinas: { name: string; count: number; percentage: string; color: string }[];
  }[] {
    if (!this.questions || this.questions.length === 0) return [];

    const bancaMap = new Map<string, { total: number; discMap: Map<string, number> }>();

    for (const q of this.questions) {
      const b = (q.banca || '').toString().trim();
      if (!b) continue;

      if (!bancaMap.has(b)) {
        bancaMap.set(b, { total: 0, discMap: new Map<string, number>() });
      }
      const entry = bancaMap.get(b)!;
      entry.total++;

      const d = (q.disciplina || q.subject || 'Outras').toString().trim();
      entry.discMap.set(d, (entry.discMap.get(d) || 0) + 1);
    }

    const grandTotal = this.questions.length;

    let result = Array.from(bancaMap.entries())
      .map(([banca, data]) => {
        const discList = Array.from(data.discMap.entries())
          .map(([name, count]) => ({
            name,
            count,
            percentage: data.total > 0 ? ((count / data.total) * 100).toFixed(1) : '0.0',
            color: this.getDisciplineColor(name)
          }))
          .sort((a, b) => b.count - a.count);

        return {
          banca,
          total: data.total,
          color: this.getBancaColor(banca),
          percentageOfTotal: grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : '0.0',
          disciplinas: discList
        };
      })
      .sort((a, b) => b.total - a.total);

    if (this.statsAnoSelectedBanca !== 'Todas') {
      const targetBanca = this.statsAnoSelectedBanca.trim().toUpperCase();
      result = result.filter(r => r.banca.trim().toUpperCase() === targetBanca);
    }

    return result;
  }

  /** Distribuição de bancas organizadas por Disciplina */
  get statsBancasPorTodasDisciplinas(): {
    disciplina: string;
    total: number;
    color: string;
    percentageOfTotal: string;
    bancas: { name: string; count: number; percentage: string; color: string }[];
  }[] {
    if (!this.questions || this.questions.length === 0) return [];

    const discMap = new Map<string, { total: number; bancaMap: Map<string, number> }>();

    for (const q of this.questions) {
      const d = (q.disciplina || q.subject || 'Outras').toString().trim();
      if (!d) continue;

      if (!discMap.has(d)) {
        discMap.set(d, { total: 0, bancaMap: new Map<string, number>() });
      }
      const entry = discMap.get(d)!;
      entry.total++;

      const b = (q.banca || 'Não Informada').toString().trim();
      entry.bancaMap.set(b, (entry.bancaMap.get(b) || 0) + 1);
    }

    const grandTotal = this.questions.length;

    let result = Array.from(discMap.entries())
      .map(([disciplina, data]) => {
        const bancasList = Array.from(data.bancaMap.entries())
          .map(([name, count]) => ({
            name,
            count,
            percentage: data.total > 0 ? ((count / data.total) * 100).toFixed(1) : '0.0',
            color: this.getBancaColor(name)
          }))
          .sort((a, b) => b.count - a.count);

        return {
          disciplina,
          total: data.total,
          color: this.getDisciplineColor(disciplina),
          percentageOfTotal: grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : '0.0',
          bancas: bancasList
        };
      })
      .sort((a, b) => b.total - a.total);

    if (this.statsAnoSelectedDisciplina !== 'Todas') {
      const targetDisc = this.statsAnoSelectedDisciplina.trim().toUpperCase();
      result = result.filter(r => r.disciplina.trim().toUpperCase() === targetDisc);
    }

    return result;
  }

  get promptQualityJson(): string {
    return JSON.stringify(this.promptQualitySummary?.conteudoProgramaticoRaw || {}, null, 2);
  }

  get qualityReportJson(): string {
    return JSON.stringify(this.qualityReport || {}, null, 2);
  }

  get releasedQuestionsCount(): number {
    return this.questions.filter(q => q.is_released).length;
  }

  /** Filtra apenas usuários não-admin para o dropdown de envio */
  get nonAdminUsers(): any[] {
    return this.users.filter(u => u.role !== 'admin');
  }

  onPdfSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedPdfFile = event.target.files[0];
    }
  }

  onEditalSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedEditalFile = event.target.files[0];
    }
  }

  uploadPdfLesson() {
    if (!this.selectedPdfFile) return;
    this.isUploadingPdf = true;

    this.apiService.uploadLessonPdf(this.selectedPdfFile).subscribe({
      next: (res) => {
        this.isUploadingPdf = false;
        this.selectedPdfFile = null;
        this.loadDashboardData();
      },
      error: () => {
        this.isUploadingPdf = false;
      }
    });
  }

  /** Valida se os campos obrigatórios do formulário estão preenchidos (Arquivo/Link + Cargo Obrigatório) */
  get isEditalFormValid(): boolean {
    const hasFile = this.editalUploadMode === 'pdf'
      ? !!this.selectedEditalFile
      : !!this.editalLink?.trim();
    return hasFile && !!this.editalCargo?.trim();
  }

  /** Semanas disponíveis até a data da prova */
  get semanasDisponiveis(): number {
    if (!this.editalDataProva) return 0;
    const hoje = new Date();
    const prova = new Date(this.editalDataProva);
    const diff = prova.getTime() - hoje.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
  }

  /** Total de horas disponíveis até a prova */
  get editalTotalHoras(): number {
    if (!this.editalHorasPorDia || !this.editalDiasPorSemana || !this.editalDataProva) return 0;
    return this.editalHorasPorDia * this.editalDiasPorSemana * this.semanasDisponiveis;
  }

  uploadEdital() {
    if (!this.isEditalFormValid) return;
    this.isUploadingEdital = true;

    const title = this.editalTitle ||
      (this.editalUploadMode === 'pdf' && this.selectedEditalFile
        ? this.selectedEditalFile.name.replace('.pdf', '')
        : 'Novo Edital Concurso');

    const fileToUpload = this.editalUploadMode === 'pdf' ? this.selectedEditalFile : null;
    const linkToSend = this.editalUploadMode === 'link' ? this.editalLink : '';

    const userContext = {
      cargo: this.editalCargo.trim(),
      concurso: this.editalConcurso.trim() || undefined,
      dataProva: this.editalDataProva || undefined,
      horasPorDia: this.editalHorasPorDia ?? undefined,
      diasPorSemana: this.editalDiasPorSemana ?? undefined,
    };

    const docName = this.editalUploadMode === 'pdf' && this.selectedEditalFile
      ? this.selectedEditalFile.name
      : (this.editalLink ? 'Link Web' : undefined);

    this.startUploadLogSimulation(this.editalCargo, this.editalConcurso, docName);

    this.apiService
      .uploadEdital(fileToUpload, title, linkToSend, this.user?.id || 'usr-1', userContext)
      .subscribe({
        next: (res: any) => {
          this.finishUploadSuccess(() => {
            this.selectedEditalFile = null;
            this.editalTitle = '';
            this.editalLink = '';
            this.editalCargo = '';
            this.editalConcurso = '';
            this.editalDataProva = '';
            this.editalHorasPorDia = null;
            this.editalDiasPorSemana = null;
            this.loadDashboardData();
            const newId = res?.data?.id || res?.id;
            if (newId) {
              this.router.navigate(['/disciplinas', newId]);
            }
          });
        },
        error: (err: any) => {
          this.handleUploadError(err);
        },
      });
  }

  toggleRelease(question: any) {
    this.apiService.toggleQuestionRelease(question.id).subscribe({
      next: () => this.loadDashboardData()
    });
  }

  openEditQuestionModal(q: any) {
    this.editQuestionForm = {
      id: q.id,
      id_qc: q.id_qc || q.id,
      disciplina: q.disciplina || 'Geral',
      assunto: q.assunto || '',
      banca: q.banca || '',
      ano: q.ano || new Date().getFullYear(),
      orgao: q.orgao || '',
      cargo: q.cargo || '',
      tipo: q.tipo || (q.alternativas && q.alternativas.length > 2 ? 'multipla_escolha' : 'certo_errado'),
      enunciado: q.enunciado || q.statement || '',
      resposta_correta: q.resposta_correta || q.correct_option || 'A',
      gabarito_comentado: q.gabarito_comentado || q.explanation || '',
      is_released: q.is_released !== undefined ? q.is_released : true
    };

    if (q.alternativas && Array.isArray(q.alternativas) && q.alternativas.length > 0) {
      this.editQuestionAlternativas = q.alternativas.map((opt: any) => ({
        letra: (opt.letra || opt.letter || 'A').toUpperCase(),
        texto: opt.texto || opt.text || ''
      }));
    } else if (this.editQuestionForm.tipo === 'certo_errado') {
      this.editQuestionAlternativas = [
        { letra: 'C', texto: 'Certo' },
        { letra: 'E', texto: 'Errado' }
      ];
    } else {
      this.editQuestionAlternativas = [
        { letra: 'A', texto: '' },
        { letra: 'B', texto: '' },
        { letra: 'C', texto: '' },
        { letra: 'D', texto: '' },
        { letra: 'E', texto: '' }
      ];
    }

    this.showEditQuestionModal = true;
  }

  closeEditQuestionModal() {
    this.showEditQuestionModal = false;
    this.editQuestionForm = {};
    this.editQuestionAlternativas = [];
  }

  onEditQuestionTipoChange() {
    if (this.editQuestionForm.tipo === 'certo_errado') {
      this.editQuestionAlternativas = [
        { letra: 'C', texto: 'Certo' },
        { letra: 'E', texto: 'Errado' }
      ];
      if (this.editQuestionForm.resposta_correta !== 'C' && this.editQuestionForm.resposta_correta !== 'E') {
        this.editQuestionForm.resposta_correta = 'C';
      }
    } else {
      if (this.editQuestionAlternativas.length < 2 || this.editQuestionAlternativas[0].letra === 'C') {
        this.editQuestionAlternativas = [
          { letra: 'A', texto: '' },
          { letra: 'B', texto: '' },
          { letra: 'C', texto: '' },
          { letra: 'D', texto: '' },
          { letra: 'E', texto: '' }
        ];
        this.editQuestionForm.resposta_correta = 'A';
      }
    }
  }

  addEditQuestionOption() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const nextIdx = this.editQuestionAlternativas.length;
    const nextLetter = letters[nextIdx] || `OPT${nextIdx + 1}`;
    this.editQuestionAlternativas.push({ letra: nextLetter, texto: '' });
  }

  removeEditQuestionOption(idx: number) {
    if (this.editQuestionAlternativas.length > 2) {
      this.editQuestionAlternativas.splice(idx, 1);
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      this.editQuestionAlternativas.forEach((opt, i) => {
        opt.letra = letters[i] || `OPT${i + 1}`;
      });
    }
  }

  saveQuestionChanges() {
    if (!this.editQuestionForm.enunciado || this.isSavingQuestion) return;
    this.isSavingQuestion = true;

    const payload = {
      disciplina: this.editQuestionForm.disciplina,
      assunto: this.editQuestionForm.assunto,
      banca: this.editQuestionForm.banca,
      ano: this.editQuestionForm.ano,
      orgao: this.editQuestionForm.orgao,
      cargo: this.editQuestionForm.cargo,
      tipo: this.editQuestionForm.tipo,
      enunciado: this.editQuestionForm.enunciado,
      alternativas: this.editQuestionAlternativas,
      resposta_correta: this.editQuestionForm.resposta_correta,
      gabarito_comentado: this.editQuestionForm.gabarito_comentado,
      is_released: this.editQuestionForm.is_released
    };

    const idToUpdate = this.editQuestionForm.id || this.editQuestionForm.id_qc;
    this.apiService.updateQuestion(idToUpdate, payload).subscribe({
      next: () => {
        this.isSavingQuestion = false;
        this.closeEditQuestionModal();
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Erro ao atualizar questão:', err);
        this.isSavingQuestion = false;
      }
    });
  }

  confirmDeleteQuestion(q: any) {
    this.questionToDelete = q;
    this.showDeleteQuestionModal = true;
  }

  closeDeleteQuestionModal() {
    this.showDeleteQuestionModal = false;
    this.questionToDelete = null;
  }

  executeDeleteQuestion() {
    if (!this.questionToDelete || this.isDeletingQuestion) return;
    this.isDeletingQuestion = true;

    const idToDelete = this.questionToDelete.id || this.questionToDelete.id_qc;
    this.apiService.deleteQuestion(idToDelete).subscribe({
      next: () => {
        this.isDeletingQuestion = false;
        this.closeDeleteQuestionModal();
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Erro ao excluir questão:', err);
        this.isDeletingQuestion = false;
      }
    });
  }

  toggleUserRole(u: any) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    this.apiService.updateUserRole(u.id, newRole).subscribe({
      next: () => u.role = newRole
    });
  }

  openDeleteUserModal(u: any) {
    this.userToDelete = u;
    this.showDeleteUserModal = true;
  }

  closeDeleteUserModal() {
    this.showDeleteUserModal = false;
    this.userToDelete = null;
    this.isDeletingUser = false;
  }

  executeDeleteUser() {
    if (!this.userToDelete || this.isDeletingUser) return;
    this.isDeletingUser = true;

    const userToRemove = this.userToDelete;
    this.apiService.deleteUser(userToRemove.id).subscribe({
      next: () => {
        this.isDeletingUser = false;
        this.closeDeleteUserModal();
        this.users = this.users.filter(u => u.id !== userToRemove.id);
        this.loadDashboardData();

        this.userToastMsg = `Usuário ${userToRemove.email} excluído com sucesso!`;
        this.userToastType = 'success';
        this.showUserToast = true;
        setTimeout(() => { this.showUserToast = false; }, 5000);
      },
      error: (err) => {
        console.error('Erro ao excluir usuário:', err);
        this.isDeletingUser = false;
        this.userToastMsg = err?.error?.message || 'Erro ao excluir usuário.';
        this.userToastType = 'error';
        this.showUserToast = true;
        setTimeout(() => { this.showUserToast = false; }, 5000);
      }
    });
  }

  /** Abre/fecha o painel de envio de edital para um card específico */
  toggleSendEditalPanel(editalId: string) {
    if (this.sendEditalOpenId === editalId) {
      this.sendEditalOpenId = null;
      this.sendEditalSelectedUserId = '';
    } else {
      this.sendEditalOpenId = editalId;
      this.sendEditalSelectedUserId = '';
      this.sendEditalToastId = null;
      this.sendEditalToastMsg = '';
    }
  }

  /** Envia o link do edital para o usuário selecionado */
  sendEditalToUser(editalId: string) {
    if (!this.sendEditalSelectedUserId) return;
    this.isSendingEdital = true;

    this.apiService.sendEditalToUser(editalId, this.sendEditalSelectedUserId).subscribe({
      next: (res) => {
        this.isSendingEdital = false;
        this.sendEditalOpenId = null;
        this.sendEditalSelectedUserId = '';

        // Mostra toast de sucesso
        this.sendEditalToastId = editalId;
        this.sendEditalToastType = 'success';
        this.sendEditalToastMsg = res?.data?.already_assigned
          ? 'Este edital já havia sido enviado para este usuário.'
          : 'Edital enviado com sucesso! O usuário já pode acessar a análise.';
        setTimeout(() => {
          this.sendEditalToastId = null;
          this.sendEditalToastMsg = '';
        }, 5000);
      },
      error: (err) => {
        this.isSendingEdital = false;

        // Mostra toast de erro
        this.sendEditalToastId = editalId;
        this.sendEditalToastType = 'error';
        this.sendEditalToastMsg = 'Erro ao enviar edital. Tente novamente.';
        setTimeout(() => {
          this.sendEditalToastId = null;
          this.sendEditalToastMsg = '';
        }, 5000);
      }
    });
  }

  deleteEdital(ed: any) {
    if (confirm(`Tem certeza que deseja excluir permanentemente o edital "${ed.title}"?`)) {
      this.apiService.deleteEdital(ed.id).subscribe({
        next: () => {
          this.editais = this.editais.filter(item => item.id !== ed.id);
        },
        error: (err) => {
          alert('Erro ao excluir o edital. Tente novamente.');
        }
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
