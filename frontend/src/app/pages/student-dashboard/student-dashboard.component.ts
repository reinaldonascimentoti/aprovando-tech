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

      <!-- Student Banner / Quick Actions -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8 bg-gradient-to-r from-[#f7f9fc] to-[#eceef1] flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <span class="bg-[#e1dfff] text-[#2b20d2] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Princípio de Pareto
          </span>
          <h2 class="text-2xl font-black text-[#191c1e]">Foque nos 20% do edital que representam 80% da sua nota</h2>
          <p class="text-xs text-[#464556] leading-relaxed">
            Envie seu edital para receber o mapa de prioridades de estudo em Sprints ou consulte as questões liberadas pelos professores.
          </p>
        </div>

        <div class="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <button (click)="activeTab = 'upload'" class="btn-mesh px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">analytics</span>
            <span>Analisar Novo Edital</span>
          </button>
          <button (click)="activeTab = 'questions'" class="btn-neo px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">quiz</span>
            <span>Banco de Questões</span>
          </button>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="neo-raised rounded-3xl p-6 md:p-8">
        <!-- Navigation Tabs -->
        <div class="flex border-b border-[#c7c4d8]/40 mb-6 gap-6 overflow-x-auto">
          <button 
            (click)="activeTab = 'editais'"
            [class.border-b-2]="activeTab === 'editais'"
            [class.border-[#433fe5]]="activeTab === 'editais'"
            [class.text-[#433fe5]]="activeTab === 'editais'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">folder_special</span>
            <span>Minhas Análises de Edital ({{ editais.length }})</span>
          </button>

          <button 
            (click)="activeTab = 'upload'"
            [class.border-b-2]="activeTab === 'upload'"
            [class.border-[#433fe5]]="activeTab === 'upload'"
            [class.text-[#433fe5]]="activeTab === 'upload'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">cloud_upload</span>
            <span>Enviar Edital para Pareto</span>
          </button>

          <button 
            (click)="activeTab = 'questions'"
            [class.border-b-2]="activeTab === 'questions'"
            [class.border-[#433fe5]]="activeTab === 'questions'"
            [class.text-[#433fe5]]="activeTab === 'questions'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">quiz</span>
            <span>Questões Liberadas ({{ questions.length }})</span>
          </button>
        </div>

        <!-- 1. My Editais List -->
        <div *ngIf="activeTab === 'editais'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div *ngFor="let ed of editais">
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
          <div *ngIf="editais.length === 0" class="col-span-2 flex flex-col items-center justify-center py-16 text-center gap-4">
            <span class="material-symbols-outlined !text-[64px] text-[#c7c4d8]">folder_open</span>
            <p class="text-sm font-semibold text-[#767587]">Nenhuma análise de edital ainda.</p>
            <button (click)="activeTab = 'upload'" class="btn-mesh px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
              <span class="material-symbols-outlined">add</span>Analisar Primeiro Edital
            </button>
          </div>
        </div>

        <!-- 2. Upload Edital Tab -->
        <div *ngIf="activeTab === 'upload'" class="max-w-2xl mx-auto space-y-6">
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
                    {{ selectedFile ? selectedFile.name : 'Selecionar Edital em PDF' }}
                  </p>
                  <input type="file" (change)="onFileSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
                </div>
              </div>
            </div>

            <div *ngIf="showUploadToast"
                 class="rounded-xl p-3 mb-3 text-xs font-bold flex items-center gap-2 animate-fadeIn"
                 [ngClass]="uploadToastType === 'success' ? 'bg-[#eefff2] text-[#005236]' : 'bg-[#ffdad6] text-[#93000a]'">
              <span class="material-symbols-outlined !text-[16px]">
                {{ uploadToastType === 'success' ? 'check_circle' : 'error' }}
              </span>
              <span>{{ uploadToastMsg }}</span>
            </div>

            <button
              (click)="submitEdital()"
              [disabled]="!isEditalFormValid || isSubmitting"
              class="btn-mesh w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm mt-2">
              <span class="material-symbols-outlined">auto_awesome</span>
              <span>{{ isSubmitting ? 'Já confirmei seu Cargo! Gerando Análise Pareto 80/20... Por favor, aguarde.' : 'Analisar Edital com IA Pareto 80/20' }}</span>
            </button>
          </div>
        </div>

        <!-- 3. Released Questions Bank Tab -->
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
  `
})
export class StudentDashboardComponent implements OnInit {
  user: UserProfile | null = null;
  editais: any[] = [];
  questions: any[] = [];
  activeTab: 'editais' | 'upload' | 'questions' = 'editais';

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
    this.apiService.getEditais(this.user?.id).subscribe(eds => this.editais = eds);
    this.apiService.getQuestions(true).subscribe(qs => this.questions = qs);
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
      cargo:          this.editalCargo.trim(),
      concurso:       this.editalConcurso.trim() || undefined,
      dataProva:      this.editalDataProva || undefined,
      horasPorDia:    this.editalHorasPorDia    ?? undefined,
      diasPorSemana:  this.editalDiasPorSemana  ?? undefined,
    };
    
    this.uploadToastMsg = 'Já confirmei seu Cargo no edital! Enviando para Análise Pareto 80/20 Recursiva e Cronograma de Estudos... Por favor, aguarde alguns instantes.';
    this.uploadToastType = 'success';
    this.showUploadToast = true;

    this.apiService.uploadEdital(fileToUpload, title, linkToSend, this.user?.id || 'usr-2', userContext).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
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
