import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getBancaLogo, getBancaInfo, BancaInfo } from '../../utils/banca.utils';

export interface NormalizedOption {
  letra: string;
  texto: string;
}

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-[#1e232a] border border-[#e2e8f0] dark:border-[#2d3748] rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-4 text-[#191c1e] dark:text-[#f7f9fc]">
      
      <!-- 1. Top Header Row (Index, ID Badge & Hierarchy Breadcrumbs) -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Question Index Number (e.g., 3) -->
          <div class="bg-[#f1f3f5] dark:bg-[#2a303c] border border-[#d1d5db] dark:border-[#4a5568] text-[#4b5563] dark:text-[#cbd5e1] text-xs font-bold px-3 py-1 rounded-md min-w-[28px] text-center shadow-2xs">
            {{ displayIndex }}
          </div>

          <!-- Question ID Pill (e.g., Q4225260) -->
          <div class="bg-[#5c6f84] text-white text-xs font-extrabold px-3 py-1 rounded-md tracking-wide shadow-2xs">
            {{ displayId }}
          </div>

          <!-- Hierarchy Breadcrumb Box (Disciplina > Assunto) -->
          <div class="bg-[#f8f9fa] dark:bg-[#2d3748] border border-[#e2e8f0] dark:border-[#4a5568] text-[#334155] dark:text-[#e2e8f0] text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1.5 flex-wrap">
            <span>{{ displaySubject }}</span>
            <span *ngIf="displayTopic" class="text-[#94a3b8] font-light">›</span>
            <span *ngIf="displayTopic">{{ displayTopic }}</span>
          </div>

          <!-- Quality Score Badge (Admin Mode) -->
          <span *ngIf="isAdmin && question?.quality_metrics?.overall_quality_score" 
                class="bg-[#eefff2] dark:bg-[#003824] text-[#005236] dark:text-[#6ffbbe] text-xs font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1">
            <span class="material-symbols-outlined !text-[14px]">star</span>
            <span>Qualidade: {{ question.quality_metrics.overall_quality_score }}/10</span>
          </span>
        </div>

        <!-- Admin Action Buttons Toolbar -->
        <div *ngIf="isAdmin" class="flex items-center gap-1.5 flex-wrap">
          <!-- Release Toggle -->
          <button 
            (click)="toggleRelease.emit(question)" 
            [class.bg-[#eefff2]]="question.is_released"
            [class.text-[#005236]]="question.is_released"
            [class.bg-[#ffdad6]]="!question.is_released"
            [class.text-[#93000a]]="!question.is_released"
            class="px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Alternar visibilidade da questão">
            <span class="material-symbols-outlined !text-[15px]">{{ question.is_released ? 'check_circle' : 'lock' }}</span>
            <span>{{ question.is_released ? 'Liberada' : 'Rascunho' }}</span>
          </button>

          <!-- Edit Button -->
          <button 
            (click)="editQuestion.emit(question)"
            class="px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 bg-[#e0e7ff] text-[#3730a3] dark:bg-[#312e81] dark:text-[#c7d2fe] hover:bg-[#c7d2fe] dark:hover:bg-[#4338ca] transition-colors cursor-pointer"
            title="Editar questão">
            <span class="material-symbols-outlined !text-[15px]">edit</span>
            <span>Editar</span>
          </button>

          <!-- Delete Button -->
          <button 
            (click)="deleteQuestion.emit(question)"
            class="px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 bg-[#fee2e2] text-[#991b1b] dark:bg-[#7f1d1d] dark:text-[#fecaca] hover:bg-[#fca5a5] dark:hover:bg-[#991b1b] transition-colors cursor-pointer"
            title="Excluir questão">
            <span class="material-symbols-outlined !text-[15px]">delete</span>
            <span>Excluir</span>
          </button>
        </div>
      </div>

      <!-- 2. Sub-header Metadata Bar (Ano, Banca, Órgão, Prova) -->
      <div class="border-t border-[#e2e8f0] dark:border-[#2d3748] pt-2.5 pb-2 text-xs text-[#475569] dark:text-[#94a3b8] font-semibold flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <div>
          <span class="text-[#475569] dark:text-[#94a3b8]">Ano:</span>
          <span class="text-[#f97316] font-medium ml-1.5">{{ question?.ano || 2026 }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-[#475569] dark:text-[#94a3b8]">Banca:</span>
          <span class="text-[#f97316] font-medium hover:underline cursor-pointer inline-flex items-center gap-1.5">
            <span *ngIf="getBanca(question?.banca)" class="h-3.5 w-6 inline-flex items-center justify-center bg-white rounded px-0.5 shadow-2xs border border-slate-200">
              <img [src]="getBanca(question?.banca)?.logo" [alt]="question?.banca" class="max-h-full max-w-full object-contain" />
            </span>
            <span>{{ question?.banca || 'Instituto Legalle' }}</span>
          </span>
        </div>
        <div>
          <span class="text-[#475569] dark:text-[#94a3b8]">Órgão:</span>
          <span class="text-[#f97316] font-medium ml-1.5 hover:underline cursor-pointer">{{ question?.orgao || 'Prefeitura' }}</span>
        </div>
        <div class="min-w-0 max-w-full">
          <span class="text-[#475569] dark:text-[#94a3b8]">Prova:</span>
          <span class="text-[#f97316] font-medium ml-1.5 hover:underline cursor-pointer truncate inline-block align-bottom max-w-[450px]">
            {{ provaText }}
          </span>
        </div>
      </div>

      <!-- Divider line -->
      <div class="border-b border-[#e2e8f0] dark:border-[#2d3748] -mx-5 md:-mx-6"></div>

      <!-- 3. Question Statement (Enunciado) -->
      <div class="py-2">
        <p class="text-sm md:text-base text-[#1e293b] dark:text-[#e2e8f0] leading-relaxed font-normal whitespace-pre-line">
          {{ question?.enunciado || question?.statement }}
        </p>

        <!-- Question Image (if present) -->
        <div *ngIf="question?.imagem_url || question?.metadata?.imagem_url" class="mt-4 max-w-xl rounded-xl p-2 bg-white dark:bg-[#111318] border border-[#cbd5e1] dark:border-[#4a5568] shadow-sm">
          <img [src]="question.imagem_url || question.metadata?.imagem_url" alt="Imagem da questão" class="max-h-80 w-auto object-contain rounded-lg">
        </div>
      </div>

      <!-- 4. Alternatives (Opções com Tesoura ✂️ para eliminação) -->
      <div class="space-y-3 pt-2">
        <div *ngFor="let opt of options; let i = index" 
          class="flex items-start gap-3 group transition-all"
          [class.opacity-45]="eliminatedOptions[opt.letra]"
          [class.line-through]="eliminatedOptions[opt.letra]">

          <!-- Scissor Icon Button (Eliminar Alternativa) -->
          <button 
            type="button"
            (click)="toggleEliminateOption($event, opt.letra)"
            [title]="eliminatedOptions[opt.letra] ? 'Restaurar alternativa' : 'Eliminar alternativa'"
            class="text-[#94a3b8] hover:text-[#ef4444] p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 mt-0.5 cursor-pointer"
            [class.text-[#ef4444]]="eliminatedOptions[opt.letra]">
            <span class="material-symbols-outlined !text-[18px]">content_cut</span>
          </button>

          <!-- Circle Option Badge (A, B, C, D, E) -->
          <div 
            (click)="selectOption(opt.letra)"
            [ngClass]="getOptionCircleClass(opt.letra)"
            class="w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer shadow-2xs select-none">
            {{ opt.letra }}
          </div>

          <!-- Alternative Text -->
          <div 
            (click)="selectOption(opt.letra)"
            class="text-xs md:text-sm text-[#334155] dark:text-[#cbd5e1] leading-relaxed pt-0.5 flex-1 hover:text-[#0f172a] dark:hover:text-white cursor-pointer select-none font-medium"
            [class.italic]="eliminatedOptions[opt.letra]">
            {{ opt.texto }}
          </div>
        </div>
      </div>

      <!-- 5. Action Row ("Responder" Button & Retry) -->
      <div class="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-transparent">
        <button 
          (click)="submitAnswer()"
          [disabled]="!selectedOption || answered"
          class="bg-[#f89b53] hover:bg-[#ea580c] active:scale-95 text-white font-extrabold text-xs md:text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2">
          <span class="material-symbols-outlined !text-[18px]" *ngIf="answered">check_circle</span>
          <span>{{ answered ? 'Respondido' : 'Responder' }}</span>
        </button>

        <button 
          *ngIf="answered"
          (click)="resetAnswer()"
          class="text-xs font-bold text-[#64748b] hover:text-[#1e293b] dark:text-[#94a3b8] dark:hover:text-white flex items-center gap-1.5 underline cursor-pointer transition-colors">
          <span class="material-symbols-outlined !text-[16px]">refresh</span>
          <span>Tentar Novamente</span>
        </button>
      </div>

      <!-- 6. Post-Submission Feedback & Teacher Explanation -->
      <div *ngIf="answered" class="mt-4 p-4 rounded-xl text-xs space-y-2 border transition-all animate-fadeIn"
        [ngClass]="isCorrect 
          ? 'bg-[#f0fdf4] border-[#bbf7d0] dark:bg-[#002819] dark:border-[#005236]' 
          : 'bg-[#fef2f2] border-[#fecaca] dark:bg-[#320005] dark:border-[#7f1d1d]'">
        
        <div class="flex items-center gap-2 font-bold text-sm"
          [class.text-[#16a34a]]="isCorrect"
          [class.text-[#dc2626]]="!isCorrect">
          <span class="material-symbols-outlined !text-[20px]">{{ isCorrect ? 'check_circle' : 'cancel' }}</span>
          <span>{{ isCorrect ? 'Você acertou!' : 'Resposta incorreta. Gabarito: alternativa ' + correctOption }}</span>
        </div>

        <div *ngIf="question?.explanation || question?.gabarito_comentado" class="text-[#334155] dark:text-[#e2e8f0] leading-relaxed pt-1 border-t border-[#cbd5e1]/40">
          <strong class="text-[#0f172a] dark:text-white">Gabarito Comentado:</strong> {{ question.explanation || question.gabarito_comentado }}
        </div>
      </div>

    </div>
  `
})
export class QuestionCardComponent implements OnInit, OnChanges {
  @Input() question: any;
  @Input() index?: number;
  @Input() isAdmin: boolean = false;
  @Input() defaultSelectedOption?: string;

  @Output() answerSubmitted = new EventEmitter<{ questionId: string; selectedOption: string; isCorrect: boolean }>();
  @Output() toggleRelease = new EventEmitter<any>();
  @Output() editQuestion = new EventEmitter<any>();
  @Output() deleteQuestion = new EventEmitter<any>();

  selectedOption: string | null = null;
  eliminatedOptions: { [letra: string]: boolean } = {};
  answered: boolean = false;
  isCorrect: boolean = false;

  ngOnInit(): void {
    if (this.defaultSelectedOption) {
      this.selectedOption = this.defaultSelectedOption;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['question']) {
      this.resetAnswer();
    }
  }

  get displayIndex(): number | string {
    if (this.index !== undefined && this.index !== null) {
      return this.index + 1;
    }
    return this.question?.index || 1;
  }

  get displayId(): string {
    return this.question?.id_qc || this.question?.id || this.question?.codigo || 'Q4225260';
  }

  get displaySubject(): string {
    return this.question?.disciplina || this.question?.subject || 'Administração Pública';
  }

  get displayTopic(): string {
    return this.question?.assunto || this.question?.topic || 'Processo Organizacional na Administração Pública';
  }

  get provaText(): string {
    if (this.question?.prova) return this.question.prova;
    const banca = this.question?.banca || 'Instituto Legalle';
    const ano = this.question?.ano || 2026;
    const orgao = this.question?.orgao || 'Prefeitura de Campestre da Serra - RS';
    const cargo = this.question?.cargo || 'Auxiliar de Administração';
    return `${banca} - ${ano} - ${orgao} - ${cargo}`;
  }

  get options(): NormalizedOption[] {
    if (this.question?.alternativas && this.question.alternativas.length > 0) {
      return this.question.alternativas.map((opt: any) => ({
        letra: (opt.letra || opt.letter || 'A').toUpperCase(),
        texto: opt.texto || opt.text || ''
      }));
    }
    if (this.question?.options && this.question.options.length > 0) {
      return this.question.options.map((opt: any) => ({
        letra: (opt.letter || opt.letra || 'A').toUpperCase(),
        texto: opt.text || opt.texto || ''
      }));
    }
    if (this.question?.tipo === 'certo_errado') {
      return [
        { letra: 'C', texto: 'Certo' },
        { letra: 'E', texto: 'Errado' }
      ];
    }
    return [];
  }

  get correctOption(): string {
    if (this.question?.resposta_correta) return String(this.question.resposta_correta).toUpperCase();
    if (this.question?.correct_option) return String(this.question.correct_option).toUpperCase();
    if (this.question?.resposta_boolean !== undefined && this.question?.resposta_boolean !== null) {
      return this.question.resposta_boolean ? 'C' : 'E';
    }
    return '';
  }

  toggleEliminateOption(event: Event, letra: string): void {
    event.stopPropagation();
    this.eliminatedOptions[letra] = !this.eliminatedOptions[letra];
  }

  selectOption(letra: string): void {
    if (this.answered) return;
    if (this.selectedOption === letra) {
      this.selectedOption = null;
    } else {
      this.selectedOption = letra;
    }
  }

  getOptionCircleClass(letra: string): string {
    if (this.answered) {
      if (letra === this.correctOption) {
        return 'bg-[#10b981] border-[#10b981] text-white font-black';
      }
      if (this.selectedOption === letra && letra !== this.correctOption) {
        return 'bg-[#ef4444] border-[#ef4444] text-white font-black';
      }
      return 'border-[#cbd5e1] text-[#94a3b8] bg-[#f8fafc] dark:bg-[#1e293b]';
    }

    if (this.selectedOption === letra) {
      return 'bg-[#f89b53] border-[#f89b53] text-white font-black shadow-sm';
    }

    return 'border-[#f89b53] text-[#f89b53] hover:bg-[#fff7ed] dark:hover:bg-[#f89b53]/20';
  }

  submitAnswer(): void {
    if (!this.selectedOption || this.answered) return;
    this.answered = true;
    this.isCorrect = (this.selectedOption === this.correctOption);

    this.answerSubmitted.emit({
      questionId: this.question?.id || this.question?.codigo,
      selectedOption: this.selectedOption,
      isCorrect: this.isCorrect
    });
  }

  resetAnswer(): void {
    this.selectedOption = null;
    this.eliminatedOptions = {};
    this.answered = false;
    this.isCorrect = false;
  }

  getBanca(text: string | null | undefined): BancaInfo | null {
    return getBancaInfo(text);
  }
}
