import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edital-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="bg-white rounded-3xl p-6 flex flex-col justify-between border border-[#e4d9ff] shadow-md hover:shadow-xl hover:border-[#6b38d4]/40 hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden group">
      <div>
        <!-- Top Badges Row -->
        <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="bg-[#6b38d4]/10 text-[#6b38d4] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <span class="material-symbols-outlined !text-[14px]">stars</span>
              {{ edital.pareto_data?.high_priority_subjects || 2 }} Matérias Vitais (20%)
            </span>
            <span *ngIf="edital.concurso" class="bg-[#e1dfff] text-[#2b20d2] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {{ edital.concurso }}
            </span>
          </div>
          <span class="text-xs font-semibold text-[#767587]">{{ edital.created_at | date:'dd/MM/yyyy' }}</span>
        </div>

        <!-- Title & Cargo -->
        <h3 class="text-lg font-bold text-[#191c1e] mb-1 leading-snug">{{ edital.title }}</h3>
        <p class="text-[11px] text-[#767587] mb-2 flex items-center gap-1" *ngIf="edital.cargo">
          <span class="material-symbols-outlined !text-[14px] text-[#433fe5]">badge</span>
          <span>{{ edital.cargo }}</span>
        </p>

        <!-- Summary -->
        <p class="text-xs text-[#464556] mb-5 leading-relaxed line-clamp-3">
          {{ edital.pareto_data?.relevance_summary || 'Análise detalhada do conteúdo programático com classificação Pareto 80/20.' }}
        </p>

        <!-- Progress Bar -->
        <div class="space-y-1.5 mb-5 bg-white/60 p-3 rounded-2xl border border-[#c7c4d8]/40">
          <div class="flex justify-between items-center text-xs font-bold">
            <span class="text-[#464556] flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px] text-[#433fe5]">checklist_rtl</span>
              Progresso do Checklist
            </span>
            <span class="text-[#433fe5] font-black">{{ progressPercentage }}%</span>
          </div>
          <div class="w-full h-2.5 bg-[#eceef1] rounded-full overflow-hidden p-0.5">
            <div class="h-full bg-gradient-to-r from-[#433fe5] to-[#6b38d4] rounded-full transition-all duration-300"
                 [style.width.%]="progressPercentage"></div>
          </div>
        </div>
      </div>

      <!-- Action Buttons Row (Na mesma linha) -->
      <div class="pt-3 border-t border-[#c7c4d8]/30 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto flex-1">
          <a [routerLink]="['/disciplinas', edital.id]"
             class="btn-mesh py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
             title="Mapa Geral das Disciplinas (Tabela Completa)">
            <span class="material-symbols-outlined !text-[16px]">grid_view</span>
            <span>Mapa Geral</span>
          </a>

          <a *ngIf="edital.pareto_data?.pareto_analisado" [routerLink]="['/pareto', edital.id]"
             class="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-[#e9ddff] text-[#5516be] hover:bg-[#ddd0ff] transition-all flex-1 sm:flex-initial"
             title="Ver Relatório Pareto 80/20">
            <span class="material-symbols-outlined !text-[16px]">donut_large</span>
            <span>Ver Pareto</span>
          </a>

          <a *ngIf="!edital.pareto_data?.pareto_analisado" [routerLink]="['/disciplinas', edital.id]"
             class="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-[#f0e7ff] text-[#433fe5] hover:bg-[#e1dfff] transition-all flex-1 sm:flex-initial"
             title="Abrir Mapa para Executar Análise Pareto">
            <span class="material-symbols-outlined !text-[16px]">analytics</span>
            <span>Analisar Pareto</span>
          </a>

          <a [routerLink]="['/sprints', edital.id]"
             class="btn-neo py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-[#191c1e] flex-1 sm:flex-initial"
             title="Cronograma Semanal">
            <span class="material-symbols-outlined !text-[16px] text-[#433fe5]">calendar_month</span>
            <span>Sprints</span>
          </a>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Role Specific Actions (Admin vs Student) -->
          <ng-container *ngIf="isAdmin">
            <button
              (click)="editEdital.emit(edital)"
              class="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#fff3e0] text-[#e65100] hover:bg-[#ffe0b2] transition-all"
              title="Editar Análise de Edital">
              <span class="material-symbols-outlined !text-[15px]">edit</span>
              <span>Editar</span>
            </button>

            <button
              (click)="toggleSend.emit(edital.id)"
              class="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              [ngClass]="sendOpenId === edital.id ? 'bg-[#433fe5] text-white shadow-md' : 'bg-[#e1dfff] text-[#2b20d2] hover:bg-[#d5d2ff]'">
              <span class="material-symbols-outlined !text-[15px]">send</span>
              <span>{{ sendOpenId === edital.id ? 'Fechar' : 'Enviar Link' }}</span>
            </button>

            <button
              (click)="deleteEdital.emit(edital)"
              class="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] transition-all"
              title="Excluir Edital">
              <span class="material-symbols-outlined !text-[15px]">delete</span>
              <span>Excluir</span>
            </button>
          </ng-container>

          <ng-container *ngIf="!isAdmin">
            <button
              (click)="editEdital.emit(edital)"
              class="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#fff3e0] text-[#e65100] hover:bg-[#ffe0b2] transition-all"
              title="Editar Concurso">
              <span class="material-symbols-outlined !text-[15px]">edit</span>
              <span>Editar</span>
            </button>

            <ng-container *ngIf="dismissConfirmId === edital.id; else studentDismissBtn">
              <div class="flex gap-1">
                <button
                  (click)="confirmDismiss.emit(edital)"
                  class="px-3 py-2.5 rounded-xl text-xs font-bold bg-[#ba1a1a] text-white flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined !text-[14px]">check</span>
                  Confirmar
                </button>
                <button
                  (click)="cancelDismiss.emit()"
                  class="py-2.5 px-2.5 rounded-xl text-xs font-bold border border-[#c7c4d8] text-[#464556] hover:border-[#433fe5]">
                  <span class="material-symbols-outlined !text-[14px]">close</span>
                </button>
              </div>
            </ng-container>
            <ng-template #studentDismissBtn>
              <button
                (click)="requestDismiss.emit(edital.id)"
                class="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] transition-all"
                title="Excluir Edital">
                <span class="material-symbols-outlined !text-[15px]">delete</span>
                <span>Excluir</span>
              </button>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </div>
  `
})
export class EditalCardComponent implements OnInit {
  @Input() edital: any;
  @Input() isAdmin: boolean = false;
  @Input() sendOpenId: string | null = null;
  @Input() dismissConfirmId: string | null = null;

  @Output() toggleSend = new EventEmitter<string>();
  @Output() deleteEdital = new EventEmitter<any>();
  @Output() editEdital = new EventEmitter<any>();
  @Output() requestDismiss = new EventEmitter<string>();
  @Output() confirmDismiss = new EventEmitter<any>();
  @Output() cancelDismiss = new EventEmitter<void>();

  progressPercentage: number = 0;

  ngOnInit(): void {
    this.calculateProgress();
  }

  calculateProgress(): void {
    if (!this.edital?.id) return;
    try {
      const stored = localStorage.getItem(`edital_checklist_${this.edital.id}`);
      if (stored) {
        const checkedMap = JSON.parse(stored);
        const keys = Object.keys(checkedMap);
        const checkedCount = keys.filter(k => checkedMap[k]).length;
        if (keys.length > 0) {
          this.progressPercentage = Math.round((checkedCount / keys.length) * 100);
        }
      }
    } catch (e) {
      console.error('Erro ao ler checklist:', e);
    }
  }
}
