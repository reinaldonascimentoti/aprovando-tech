import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#f7f9fc] p-4 md:p-8">
      <!-- Top Navigation Bar -->
      <header class="neo-raised rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 flex items-center justify-center">
            <img src="assets/admin_panel_icon.svg" alt="Admin Panel Icon" class="w-full h-full object-contain drop-shadow-md">
          </div>
          <div>
            <h1 class="text-xl font-bold text-[#191c1e]">Painel Administrativo</h1>
            <p class="text-xs text-[#464556]">Aprovando Tech • Gestão de Conteúdo e Qualidade IA</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-semibold text-[#464556]">Olá, <strong class="text-[#433fe5]">{{ user?.full_name }}</strong></span>
          <button (click)="logout()" class="btn-neo px-4 py-2 rounded-xl text-xs flex items-center gap-1">
            <span class="material-symbols-outlined !text-[16px]">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <!-- KPI Metric Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="neo-raised rounded-2xl p-6 flex items-center gap-4">
          <div class="w-14 h-14 flex items-center justify-center">
            <img src="assets/laptop_code_icon.svg" alt="Questões" class="w-12 h-12 object-contain drop-shadow-sm">
          </div>
          <div>
            <p class="text-xs font-semibold text-[#464556]">Questões Extraídas</p>
            <h3 class="text-2xl font-extrabold text-[#191c1e]">{{ questions.length }}</h3>
          </div>
        </div>

        <div class="neo-raised rounded-2xl p-6 flex items-center gap-4">
          <div class="w-14 h-14 flex items-center justify-center">
            <img src="assets/security_shield_icon.svg" alt="Qualidade" class="w-12 h-12 object-contain drop-shadow-sm">
          </div>
          <div>
            <p class="text-xs font-semibold text-[#464556]">Score Qualidade Média IA</p>
            <h3 class="text-2xl font-extrabold text-[#006847]">{{ qualityReport?.average_metrics?.avg_overall_quality_score || 9.2 }}/10</h3>
          </div>
        </div>

        <div class="neo-raised rounded-2xl p-6 flex items-center gap-4">
          <div class="w-14 h-14 flex items-center justify-center">
            <img src="assets/growth_chart_icon.svg" alt="Pareto" class="w-12 h-12 object-contain drop-shadow-sm">
          </div>
          <div>
            <p class="text-xs font-semibold text-[#464556]">Editais Pareto (80/20)</p>
            <h3 class="text-2xl font-extrabold text-[#191c1e]">{{ editais.length }}</h3>
          </div>
        </div>

        <div class="neo-raised rounded-2xl p-6 flex items-center gap-4">
          <div class="w-14 h-14 flex items-center justify-center">
            <img src="assets/registered_users_icon.svg" alt="Usuários" class="w-12 h-12 object-contain drop-shadow-sm">
          </div>
          <div>
            <p class="text-xs font-semibold text-[#464556]">Usuários Cadastrados</p>
            <h3 class="text-2xl font-extrabold text-[#191c1e]">{{ users.length }}</h3>
          </div>
        </div>
      </div>

      <!-- Main Action Section: Upload PDFs & Editais -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        <!-- Upload PDF de Aulas (Extração IA) -->
        <div class="neo-raised rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-[#191c1e] flex items-center gap-2">
                <img src="assets/cloud_upload_icon.svg" class="w-12 h-12 drop-shadow-sm">
                Upload de PDF de Aula (IA + Qualidade JSON)
              </h2>
              <span class="bg-[#e1dfff] text-[#2b20d2] text-[11px] font-bold px-2.5 py-1 rounded-full">BullMQ + OpenAI</span>
            </div>
            <p class="text-xs text-[#464556] mb-6">
              Envie o PDF da aula teórica. A IA extrairá as questões, calculará o score de clareza psicométrica e salvará em <code>backend/data/questions.json</code> e <code>quality_analysis.json</code>.
            </p>

            <div class="neo-pressed rounded-2xl p-8 border-2 border-dashed border-[#c7c4d8] flex flex-col items-center justify-center text-center relative hover:border-[#433fe5] transition-colors cursor-pointer mb-4">
              <span class="material-symbols-outlined !text-[40px] text-[#6b38d4] mb-1">picture_as_pdf</span>
              <p class="text-sm font-semibold text-[#191c1e]">
                {{ selectedPdfFile ? selectedPdfFile.name : 'Arraste o PDF da aula ou clique para selecionar' }}
              </p>
              <p class="text-xs text-[#767587] mt-1">Formato suportado: PDF (até 50MB)</p>
              <input type="file" (change)="onPdfSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>
          </div>

          <button 
            (click)="uploadPdfLesson()" 
            [disabled]="!selectedPdfFile || isUploadingPdf"
            class="btn-mesh w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm mt-4">
            <span class="material-symbols-outlined">auto_awesome</span>
            <span>{{ isUploadingPdf ? 'Extraindo Questões e Analisando Qualidade...' : 'Extrair Questões & Análise de Qualidade' }}</span>
          </button>
        </div>

        <!-- Upload de Edital (Regra Pareto 80/20) -->
        <div class="neo-raised rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-[#191c1e] flex items-center gap-3">
                <img src="assets/cloud_upload_icon.svg" class="w-12 h-12 drop-shadow-sm">
                Upload de Edital (Análise Pareto 3 Camadas)
              </h2>
              <span class="bg-[#e9ddff] text-[#5516be] text-[11px] font-bold px-2.5 py-1 rounded-full">Macro → Meso → Micro</span>
            </div>
            <p class="text-xs text-[#464556] mb-5">
              Faça upload do edital oficial. A IA aplicará Pareto 80/20 em 3 camadas gerando mapa de prioridades, cronograma adaptado ao seu tempo disponível, régua de corte e alertas de banca.
            </p>

            <!-- Contexto do Candidato -->
            <div class="rounded-2xl border border-[#c7c4d8] bg-[#f7f4ff] p-4 mb-4">
              <p class="text-[11px] font-extrabold text-[#5516be] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span class="material-symbols-outlined !text-[15px]">person</span>
                Contexto do Candidato
              </p>
              <div class="space-y-2.5">

                <!-- Título do Edital -->
                <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">description</span>
                  <input
                    [(ngModel)]="editalTitle"
                    type="text"
                    placeholder="Título do Edital (Ex: Concurso TCU 2026)"
                    class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
                </div>

                <!-- Concurso Alvo -->
                <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">emoji_events</span>
                  <input
                    [(ngModel)]="editalConcurso"
                    type="text"
                    placeholder="Concurso alvo (Ex: SEFAZ-RS 2026)"
                    class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
                </div>

                <!-- Cargo -->
                <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">badge</span>
                  <input
                    [(ngModel)]="editalCargo"
                    type="text"
                    placeholder="Cargo (Ex: Auditor Fiscal da Receita Estadual) *"
                    class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
                </div>

                <!-- Data da prova -->
                <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">event</span>
                  <input
                    [(ngModel)]="editalDataProva"
                    type="date"
                    [min]="today"
                    placeholder="Data da prova *"
                    class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
                </div>

                <!-- Disponibilidade: horas/dia + dias/semana -->
                <div class="grid grid-cols-2 gap-2">
                  <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#433fe5] !text-[18px] shrink-0">schedule</span>
                    <input
                      [(ngModel)]="editalHorasPorDia"
                      type="number"
                      min="0.5" max="24" step="0.5"
                      placeholder="Horas/dia *"
                      class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e] placeholder:text-[#9e9eb8]">
                  </div>
                  <div class="neo-pressed rounded-xl p-2.5 flex items-center gap-2">
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
                <div *ngIf="editalHorasPorDia && editalDiasPorSemana && editalDataProva" class="bg-[#e9ddff]/60 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-[#5516be]">
                  <span class="material-symbols-outlined !text-[15px]">insights</span>
                  <span>{{ editalHorasPorDia }}h/dia × {{ editalDiasPorSemana }} dias = <strong>{{ editalHorasPorDia * editalDiasPorSemana }}h/semana</strong>
                  &nbsp;|&nbsp; {{ semanasDisponiveis }} semanas até a prova
                  &nbsp;|&nbsp; ~<strong>{{ editalTotalHoras }}h</strong> no total</span>
                </div>

              </div>
            </div>

            <!-- Modo de upload (Link / PDF) -->
            <div class="flex gap-2 mb-3 bg-[#eceef1] p-1 rounded-xl">
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

            <div class="space-y-3 mb-4">
              <div *ngIf="editalUploadMode === 'link'" class="neo-pressed rounded-xl p-3 flex items-center">
                <span class="material-symbols-outlined text-[#433fe5] mr-2">link</span>
                <input
                  [(ngModel)]="editalLink"
                  type="text"
                  placeholder="Cole aqui a URL do edital"
                  class="w-full bg-transparent border-none outline-none text-sm px-2 text-[#191c1e]">
              </div>

              <div *ngIf="editalUploadMode === 'pdf'" class="neo-pressed rounded-2xl p-6 border-2 border-dashed border-[#c7c4d8] flex flex-col items-center justify-center text-center relative hover:border-[#6b38d4] transition-colors cursor-pointer">
                <span class="material-symbols-outlined !text-[40px] text-[#6b38d4] mb-1">picture_as_pdf</span>
                <p class="text-xs font-semibold text-[#191c1e]">
                  {{ selectedEditalFile ? selectedEditalFile.name : 'Selecionar Edital em PDF' }}
                </p>
                <input type="file" (change)="onEditalSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
              </div>
            </div>
          </div>

          <button
            (click)="uploadEdital()"
            [disabled]="!isEditalFormValid || isUploadingEdital"
            class="btn-mesh w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm mt-2"
            style="background: linear-gradient(135deg, #6b38d4 0%, #8455ef 100%);">
            <span class="material-symbols-outlined">donut_large</span>
            <span>{{ isUploadingEdital ? 'Analisando Edital...' : 'Gerar Análise Pareto 80/20' }}</span>
          </button>
        </div>

      </div>

      <!-- Tabbed Views: Questions Bank, Quality Analysis & Users -->
      <div class="neo-raised rounded-3xl p-6 mb-8">
        <div class="flex border-b border-[#c7c4d8]/40 mb-6 gap-6 overflow-x-auto">
          <button 
            (click)="activeTab = 'questions'"
            [class.border-b-2]="activeTab === 'questions'"
            [class.border-[#433fe5]]="activeTab === 'questions'"
            [class.text-[#433fe5]]="activeTab === 'questions'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">quiz</span>
            <span>Gestão de Questões</span>
          </button>

          <button 
            (click)="activeTab = 'quality'"
            [class.border-b-2]="activeTab === 'quality'"
            [class.border-[#433fe5]]="activeTab === 'quality'"
            [class.text-[#433fe5]]="activeTab === 'quality'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">analytics</span>
            <span>Análise de Qualidade (JSON)</span>
          </button>

          <button 
            (click)="activeTab = 'users'"
            [class.border-b-2]="activeTab === 'users'"
            [class.border-[#433fe5]]="activeTab === 'users'"
            [class.text-[#433fe5]]="activeTab === 'users'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">manage_accounts</span>
            <span>Usuários e Permissões</span>
          </button>

          <button 
            (click)="activeTab = 'editais'"
            [class.border-b-2]="activeTab === 'editais'"
            [class.border-[#433fe5]]="activeTab === 'editais'"
            [class.text-[#433fe5]]="activeTab === 'editais'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">folder_special</span>
            <span>Editais Analisados</span>
          </button>
        </div>

        <!-- Questions Tab Content -->
        <div *ngIf="activeTab === 'questions'" class="space-y-4">
          <div *ngFor="let q of questions" class="neo-pressed rounded-2xl p-5 transition-all">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="bg-[#e1dfff] text-[#09006b] text-xs font-bold px-3 py-1 rounded-lg">{{ q.subject }}</span>
                <span class="bg-[#eceef1] text-[#464556] text-xs font-semibold px-3 py-1 rounded-lg">{{ q.topic }}</span>
                <span *ngIf="q.codigo" class="bg-[#eceef1] text-[#464556] text-xs font-semibold px-3 py-1 rounded-lg">{{ q.codigo }}</span>
                
                <!-- Quality Score Badge -->
                <span *ngIf="q.quality_metrics" class="bg-[#eefff2] text-[#005236] text-xs font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">star</span>
                  <span>Qualidade: {{ q.quality_metrics.overall_quality_score }}/10 (Taxonomia: {{ q.quality_metrics.bloom_taxonomy }})</span>
                </span>
              </div>

              <button 
                (click)="toggleRelease(q)" 
                [class.bg-[#eefff2]]="q.is_released"
                [class.text-[#005236]]="q.is_released"
                [class.bg-[#ffdad6]]="!q.is_released"
                [class.text-[#93000a]]="!q.is_released"
                class="px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                <span class="material-symbols-outlined !text-[16px]">{{ q.is_released ? 'check_circle' : 'lock' }}</span>
                <span>{{ q.is_released ? 'Liberada para Alunos' : 'Rascunho (Privada)' }}</span>
              </button>
            </div>
            
            <p class="text-sm font-semibold text-[#191c1e] mb-3">{{ q.statement }}</p>

            <div *ngIf="q.tipo !== 'certo_errado'" class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <div *ngFor="let opt of q.options" 
                [class.bg-[#eefff2]]="opt.letter === q.correct_option"
                [class.border-l-4]="opt.letter === q.correct_option"
                [class.border-[#00845a]]="opt.letter === q.correct_option"
                class="p-2.5 rounded-xl text-xs neo-raised-sm flex items-start gap-2">
                <strong class="text-[#433fe5]">{{ opt.letter }})</strong>
                <span class="text-[#464556]">{{ opt.text }}</span>
              </div>
            </div>

            <div *ngIf="q.tipo === 'certo_errado'" class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <div 
                [class.bg-[#eefff2]]="q.resposta_boolean === true"
                [class.border-l-4]="q.resposta_boolean === true"
                [class.border-[#00845a]]="q.resposta_boolean === true"
                class="p-2.5 rounded-xl text-xs neo-raised-sm flex items-start gap-2">
                <strong class="text-[#433fe5]">C)</strong>
                <span class="text-[#464556] font-semibold">Certo</span>
              </div>
              <div 
                [class.bg-[#eefff2]]="q.resposta_boolean === false"
                [class.border-l-4]="q.resposta_boolean === false"
                [class.border-[#00845a]]="q.resposta_boolean === false"
                class="p-2.5 rounded-xl text-xs neo-raised-sm flex items-start gap-2">
                <strong class="text-[#433fe5]">E)</strong>
                <span class="text-[#464556] font-semibold">Errado</span>
              </div>
            </div>

            <p class="text-xs italic text-[#767587] bg-white/60 p-2.5 rounded-xl">
              <strong>Gabarito Comentado:</strong> {{ q.explanation }}
            </p>
          </div>
        </div>

        <!-- Quality Analysis Tab Content (JSON View) -->
        <div *ngIf="activeTab === 'quality'" class="space-y-6">
          <div class="bg-[#eefff2] border border-[#6ffbbe] rounded-2xl p-4 text-xs text-[#005236] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00845a]">description</span>
              <span>Relatório salvo em tempo real em <code>backend/data/quality_analysis.json</code> e <code>questions.json</code></span>
            </div>
            <span class="font-bold">Total Analisado: {{ qualityReport?.total_questions_analyzed || questions.length }} Questões</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="neo-pressed rounded-2xl p-4 text-center">
              <p class="text-xs text-[#767587]">Score de Clareza Médio</p>
              <h4 class="text-xl font-bold text-[#433fe5]">{{ qualityReport?.average_metrics?.avg_clarity_score || 9.5 }}/10</h4>
            </div>
            <div class="neo-pressed rounded-2xl p-4 text-center">
              <p class="text-xs text-[#767587]">Plausibilidade dos Distratores</p>
              <h4 class="text-xl font-bold text-[#6b38d4]">{{ qualityReport?.average_metrics?.avg_distractor_plausibility || 9.1 }}/10</h4>
            </div>
            <div class="neo-pressed rounded-2xl p-4 text-center">
              <p class="text-xs text-[#767587]">Qualidade Psicométrica Geral</p>
              <h4 class="text-xl font-bold text-[#00845a]">{{ qualityReport?.average_metrics?.avg_overall_quality_score || 9.3 }}/10</h4>
            </div>
          </div>

          <div class="neo-pressed rounded-2xl p-4">
            <h4 class="text-xs font-bold text-[#191c1e] mb-2">Estrutura JSON do Relatório de Qualidade em Disco (backend/data/quality_analysis.json)</h4>
            <pre class="bg-[#191c1e] text-[#eefff2] p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-96">{{ qualityReportJson }}</pre>
          </div>
        </div>

        <!-- Users Management Tab Content -->
        <div *ngIf="activeTab === 'users'" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#c7c4d8] text-[#464556] uppercase">
                <th class="py-3 px-4">Usuário</th>
                <th class="py-3 px-4">E-mail</th>
                <th class="py-3 px-4">Perfil Atual</th>
                <th class="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of users" class="border-b border-[#eceef1] hover:bg-[#f2f4f7]/50">
                <td class="py-3.5 px-4 font-bold text-[#191c1e] flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[#433fe5] font-bold">
                    {{ u.full_name.charAt(0) }}
                  </div>
                  <span>{{ u.full_name }}</span>
                </td>
                <td class="py-3.5 px-4 text-[#464556]">{{ u.email }}</td>
                <td class="py-3.5 px-4">
                  <span 
                    [class.bg-[#e1dfff]]="u.role === 'admin'"
                    [class.text-[#2b20d2]]="u.role === 'admin'"
                    [class.bg-[#eceef1]]="u.role !== 'admin'"
                    [class.text-[#464556]]="u.role !== 'admin'"
                    class="px-3 py-1 rounded-full font-bold">
                    {{ u.role === 'admin' ? 'Administrador' : 'Usuário Comum' }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right">
                  <button 
                    (click)="toggleUserRole(u)" 
                    class="btn-neo px-3 py-1.5 rounded-xl text-xs">
                    {{ u.role === 'admin' ? 'Reverter para Aluno' : 'Promover a Admin' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Editais Tab Content -->
        <div *ngIf="activeTab === 'editais'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let ed of editais" class="neo-pressed rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-[#6b38d4]">Análise Pareto 80/20</span>
                <span class="text-[11px] text-[#767587]">{{ ed.created_at | date:'dd/MM/yyyy' }}</span>
              </div>
              <h3 class="text-base font-bold text-[#191c1e] mb-2">{{ ed.title }}</h3>
              <p class="text-xs text-[#464556] mb-4">{{ ed.pareto_data?.relevance_summary }}</p>
            </div>
            <div class="flex flex-col gap-3">
              <div class="flex gap-2">
                <a [routerLink]="['/pareto', ed.id]" class="btn-mesh flex-1 py-2.5 rounded-xl text-xs font-bold">
                  Ver Análise Pareto
                </a>
                <a [routerLink]="['/sprints', ed.id]" class="btn-neo flex-1 py-2.5 rounded-xl text-xs font-bold">
                  Cronograma Sprints
                </a>
              </div>

              <!-- Enviar Link para Usuário -->
              <button 
                (click)="toggleSendEditalPanel(ed.id)" 
                class="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                [ngClass]="sendEditalOpenId === ed.id 
                  ? 'bg-[#433fe5] text-white shadow-md' 
                  : 'bg-[#e9ddff] text-[#5516be] hover:bg-[#ddd0ff]'">
                <span class="material-symbols-outlined !text-[16px]">send</span>
                <span>{{ sendEditalOpenId === ed.id ? 'Fechar Envio' : 'Enviar Link para Usuário' }}</span>
              </button>

              <!-- Painel Inline de Envio para Usuário -->
              <div *ngIf="sendEditalOpenId === ed.id" 
                class="neo-raised rounded-2xl p-4 space-y-3 border-l-4 border-[#433fe5] animate-fadeIn">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-[#433fe5] !text-[20px]">person_add</span>
                  <p class="text-xs font-bold text-[#191c1e]">Selecione o usuário para receber este edital</p>
                </div>
                <div class="neo-pressed rounded-xl p-1">
                  <select 
                    [(ngModel)]="sendEditalSelectedUserId" 
                    class="w-full bg-transparent border-none outline-none text-sm px-3 py-2 text-[#191c1e] cursor-pointer">
                    <option value="" disabled>Escolha um usuário...</option>
                    <option *ngFor="let u of nonAdminUsers" [value]="u.id">
                      {{ u.full_name }} ({{ u.email }})
                    </option>
                  </select>
                </div>
                <button 
                  (click)="sendEditalToUser(ed.id)" 
                  [disabled]="!sendEditalSelectedUserId || isSendingEdital"
                  class="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  [ngClass]="!sendEditalSelectedUserId || isSendingEdital 
                    ? 'bg-[#eceef1] text-[#767587] cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#433fe5] to-[#6b38d4] text-white hover:shadow-lg hover:scale-[1.01]'">
                  <span class="material-symbols-outlined !text-[16px]">{{ isSendingEdital ? 'hourglass_top' : 'rocket_launch' }}</span>
                  <span>{{ isSendingEdital ? 'Enviando...' : 'Enviar Edital para Análise' }}</span>
                </button>
              </div>

              <!-- Toast de Sucesso/Erro -->
              <div *ngIf="sendEditalToastId === ed.id && sendEditalToastMsg" 
                class="rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
                [ngClass]="sendEditalToastType === 'success' ? 'bg-[#eefff2] text-[#005236]' : 'bg-[#ffdad6] text-[#93000a]'">
                <span class="material-symbols-outlined !text-[16px]">
                  {{ sendEditalToastType === 'success' ? 'check_circle' : 'error' }}
                </span>
                <span>{{ sendEditalToastMsg }}</span>
              </div>
            </div>
          </div>
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
export class AdminDashboardComponent implements OnInit {
  user: UserProfile | null = null;
  questions: any[] = [];
  users: any[] = [];
  editais: any[] = [];
  qualityReport: any = null;
  activeTab: 'questions' | 'quality' | 'users' | 'editais' = 'questions';

  selectedPdfFile: File | null = null;
  selectedEditalFile: File | null = null;

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

  // Estado para envio de edital para usuário
  sendEditalOpenId: string | null = null;
  sendEditalSelectedUserId = '';
  isSendingEdital = false;
  sendEditalToastId: string | null = null;
  sendEditalToastMsg = '';
  sendEditalToastType: 'success' | 'error' = 'success';

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

  /** Valida se os campos obrigatórios do formulário estão preenchidos */
  get isEditalFormValid(): boolean {
    const hasFile = this.editalUploadMode === 'pdf'
      ? !!this.selectedEditalFile
      : !!this.editalLink?.trim();
    return (
      hasFile &&
      !!this.editalCargo?.trim() &&
      !!this.editalDataProva &&
      !!this.editalHorasPorDia &&
      !!this.editalDiasPorSemana
    );
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
    const linkToSend  = this.editalUploadMode === 'link' ? this.editalLink : '';

    const userContext = {
      cargo:          this.editalCargo.trim(),
      concurso:       this.editalConcurso.trim() || undefined,
      dataProva:      this.editalDataProva || undefined,
      horasPorDia:    this.editalHorasPorDia    ?? undefined,
      diasPorSemana:  this.editalDiasPorSemana  ?? undefined,
    };

    this.apiService
      .uploadEdital(fileToUpload, title, linkToSend, this.user?.id || 'usr-1', userContext)
      .subscribe({
        next: () => {
          this.isUploadingEdital = false;
          this.selectedEditalFile  = null;
          this.editalTitle         = '';
          this.editalLink          = '';
          this.editalCargo         = '';
          this.editalConcurso      = '';
          this.editalDataProva     = '';
          this.editalHorasPorDia   = null;
          this.editalDiasPorSemana = null;
          this.loadDashboardData();
        },
        error: () => {
          this.isUploadingEdital = false;
        },
      });
  }

  toggleRelease(question: any) {
    this.apiService.toggleQuestionRelease(question.id).subscribe({
      next: () => this.loadDashboardData()
    });
  }

  toggleUserRole(u: any) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    this.apiService.updateUserRole(u.id, newRole).subscribe({
      next: () => u.role = newRole
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
