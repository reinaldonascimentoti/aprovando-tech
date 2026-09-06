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
  styles: [`
    :host {
      display: block;
    }
  `],
  template: `
    <div class="bg-white dark:bg-[#1e232a] border border-[#e2e8f0] dark:border-[#2d3748] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3 text-[#191c1e] dark:text-[#f7f9fc]">
      
      <!-- 1. Top Header Row (Index, ID Badge & Hierarchy Breadcrumbs) -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Question Index Number (e.g., 3) -->
          <div class="bg-[#f1f3f5] dark:bg-[#2a303c] border border-[#d1d5db] dark:border-[#4a5568] text-[#4b5563] dark:text-[#cbd5e1] text-[11px] font-bold px-2.5 py-0.5 rounded min-w-[24px] text-center shadow-2xs">
            {{ displayIndex }}
          </div>

          <!-- Question ID Pill (e.g., Q4225260) -->
          <div class="bg-[#5c6f84] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded tracking-wide shadow-2xs">
            {{ displayId }}
          </div>

          <!-- Hierarchy Breadcrumb Box (Disciplina > Assunto) -->
          <div class="bg-[#f8f9fa] dark:bg-[#2d3748] border border-[#e2e8f0] dark:border-[#4a5568] text-[#334155] dark:text-[#e2e8f0] text-[11px] font-semibold px-2.5 py-0.5 rounded flex items-center gap-1 flex-wrap">
            <span>{{ displaySubject }}</span>
            <span *ngIf="displayTopic" class="text-[#94a3b8] font-light">›</span>
            <span *ngIf="displayTopic">{{ displayTopic }}</span>
          </div>

          <!-- Quality Score Badge (Admin Mode) -->
          <span *ngIf="isAdmin && question?.quality_metrics?.overall_quality_score" 
                class="bg-[#eefff2] dark:bg-[#003824] text-[#005236] dark:text-[#6ffbbe] text-[11px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
            <span class="material-symbols-outlined !text-[13px]">star</span>
            <span>Qualidade: {{ question.quality_metrics.overall_quality_score }}/10</span>
          </span>

          <!-- Status Badge: Resolvida (Correta) -->
          <span *ngIf="isResolved && !isWrong"
                class="bg-[#f0fdf4] dark:bg-[#002819] border border-[#bbf7d0] dark:border-[#005236] text-[#16a34a] dark:text-[#4ade80] text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-fadeIn">
            <span class="material-symbols-outlined !text-[13px]">check_circle</span>
            <span>Resolvida</span>
          </span>

          <!-- Status Badge: Resolvida (Errada) -->
          <span *ngIf="isWrong"
                class="bg-[#fef2f2] dark:bg-[#320005] border border-[#fecaca] dark:border-[#7f1d1d] text-[#dc2626] dark:text-[#f87171] text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-fadeIn">
            <span class="material-symbols-outlined !text-[13px]">cancel</span>
            <span>Errada</span>
          </span>
        </div>

        <!-- Admin Action Buttons Toolbar -->
        <div *ngIf="isAdmin" class="flex items-center gap-1 flex-wrap">
          <!-- Release Toggle -->
          <button 
            (click)="toggleRelease.emit(question)" 
            [class.bg-[#eefff2]]="question.is_released"
            [class.text-[#005236]]="question.is_released"
            [class.bg-[#ffdad6]]="!question.is_released"
            [class.text-[#93000a]]="!question.is_released"
            class="px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Alternar visibilidade da questão">
            <span class="material-symbols-outlined !text-[14px]">{{ question.is_released ? 'check_circle' : 'lock' }}</span>
            <span>{{ question.is_released ? 'Liberada' : 'Rascunho' }}</span>
          </button>

          <!-- Edit Button -->
          <button 
            (click)="editQuestion.emit(question)"
            class="px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 bg-[#e0e7ff] text-[#3730a3] dark:bg-[#312e81] dark:text-[#c7d2fe] hover:bg-[#c7d2fe] dark:hover:bg-[#4338ca] transition-colors cursor-pointer"
            title="Editar questão">
            <span class="material-symbols-outlined !text-[14px]">edit</span>
            <span>Editar</span>
          </button>

          <!-- Delete Button -->
          <button 
            (click)="deleteQuestion.emit(question)"
            class="px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 bg-[#fee2e2] text-[#991b1b] dark:bg-[#7f1d1d] dark:text-[#fecaca] hover:bg-[#fca5a5] dark:hover:bg-[#991b1b] transition-colors cursor-pointer"
            title="Excluir questão">
            <span class="material-symbols-outlined !text-[14px]">delete</span>
            <span>Excluir</span>
          </button>
        </div>
      </div>

      <!-- 2. Sub-header Metadata Bar (Ano, Banca, Órgão, Prova) -->
      <div class="border-t border-[#e2e8f0] dark:border-[#2d3748] pt-2 pb-1 text-[11px] text-[#475569] dark:text-[#94a3b8] font-semibold flex flex-wrap items-center gap-x-4 gap-y-1">
        <div>
          <span class="text-[#475569] dark:text-[#94a3b8]">Ano:</span>
          <span class="text-[#433fe5] dark:text-[#818cf8] font-medium ml-1">{{ question?.ano || 2026 }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[#475569] dark:text-[#94a3b8]">Banca:</span>
          <span class="text-[#433fe5] dark:text-[#818cf8] font-medium hover:underline cursor-pointer inline-flex items-center gap-1">
            <span *ngIf="getBanca(question?.banca)" class="h-3 w-5 inline-flex items-center justify-center bg-white rounded px-0.5 shadow-2xs border border-slate-200">
              <img [src]="getBanca(question?.banca)?.logo" [alt]="question?.banca" class="max-h-full max-w-full object-contain" />
            </span>
            <span>{{ question?.banca || 'Instituto Legalle' }}</span>
          </span>
        </div>
        <div>
          <span class="text-[#475569] dark:text-[#94a3b8]">Órgão:</span>
          <span class="text-[#433fe5] dark:text-[#818cf8] font-medium ml-1 hover:underline cursor-pointer">{{ question?.orgao || 'Prefeitura' }}</span>
        </div>
        <div class="min-w-0 max-w-full">
          <span class="text-[#475569] dark:text-[#94a3b8]">Prova:</span>
          <span class="text-[#433fe5] dark:text-[#818cf8] font-medium ml-1 hover:underline cursor-pointer truncate inline-block align-bottom max-w-[450px]">
            {{ provaText }}
          </span>
        </div>
      </div>

      <!-- Divider line -->
      <div class="border-b border-[#e2e8f0] dark:border-[#2d3748] -mx-4 sm:-mx-5"></div>

      <!-- 3. Question Statement (Enunciado) -->
      <div class="py-1">
        <p class="text-xs sm:text-sm text-[#1e293b] dark:text-[#e2e8f0] leading-relaxed font-normal whitespace-pre-line">
          {{ formattedEnunciado }}
        </p>

        <!-- Question Image (if present) -->
        <div *ngIf="question?.imagem_url || question?.metadata?.imagem_url" class="mt-3 max-w-lg rounded-lg p-2 bg-white dark:bg-[#111318] border border-[#cbd5e1] dark:border-[#4a5568] shadow-xs">
          <img [src]="question.imagem_url || question.metadata?.imagem_url" alt="Imagem da questão" class="max-h-64 w-auto object-contain rounded">
        </div>
      </div>

      <!-- 4. Alternatives (Opções com Tesoura ✂️ para eliminação) -->
      <div class="space-y-2 pt-1">
        <div *ngFor="let opt of options; let i = index" 
          class="flex items-start gap-2.5 group transition-all"
          [class.opacity-45]="eliminatedOptions[opt.letra]"
          [class.line-through]="eliminatedOptions[opt.letra]">

          <!-- Scissor Icon Button (Eliminar Alternativa) -->
          <button 
            type="button"
            (click)="toggleEliminateOption($event, opt.letra)"
            [title]="eliminatedOptions[opt.letra] ? 'Restaurar alternativa' : 'Eliminar alternativa'"
            class="text-[#94a3b8] hover:text-[#ef4444] p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 mt-0.5 cursor-pointer"
            [class.text-[#ef4444]]="eliminatedOptions[opt.letra]">
            <span class="material-symbols-outlined !text-[16px]">content_cut</span>
          </button>

          <!-- Circle Option Badge (A, B, C, D, E) -->
          <div 
            (click)="selectOption(opt.letra)"
            [ngClass]="getOptionCircleClass(opt.letra)"
            class="w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[11px] shrink-0 transition-all cursor-pointer shadow-2xs select-none">
            {{ opt.letra }}
          </div>

          <!-- Alternative Text -->
          <div 
            (click)="selectOption(opt.letra)"
            class="text-xs sm:text-sm text-[#334155] dark:text-[#cbd5e1] leading-relaxed pt-0.5 flex-1 hover:text-[#0f172a] dark:hover:text-white cursor-pointer select-none font-medium"
            [class.italic]="eliminatedOptions[opt.letra]">
            {{ opt.texto }}
          </div>
        </div>
      </div>

      <!-- 5. Action Row ("Responder" Button & Retry) -->
      <div class="flex items-center justify-between flex-wrap gap-3 pt-2.5 border-t border-transparent">
        <button 
          (click)="submitAnswer()"
          [disabled]="!selectedOption || answered"
          class="bg-[#433fe5] hover:bg-[#3730a3] dark:bg-[#4f46e5] dark:hover:bg-[#4338ca] active:scale-95 text-white font-extrabold text-xs px-5 py-2 rounded-lg transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5">
          <span class="material-symbols-outlined !text-[16px]" *ngIf="answered">check_circle</span>
          <span>{{ answered ? 'Respondido' : 'Responder' }}</span>
        </button>

        <button 
          *ngIf="answered"
          (click)="resetAnswer()"
          class="text-xs font-bold text-[#64748b] hover:text-[#1e293b] dark:text-[#94a3b8] dark:hover:text-white flex items-center gap-1 underline cursor-pointer transition-colors">
          <span class="material-symbols-outlined !text-[15px]">refresh</span>
          <span>Tentar Novamente</span>
        </button>
      </div>

      <!-- 6. Post-Submission Feedback & Teacher Explanation -->
      <div *ngIf="answered" class="mt-3 p-3 rounded-lg text-xs space-y-1.5 border transition-all animate-fadeIn"
        [ngClass]="isCorrect 
          ? 'bg-[#f0fdf4] border-[#bbf7d0] dark:bg-[#002819] dark:border-[#005236]' 
          : 'bg-[#fef2f2] border-[#fecaca] dark:bg-[#320005] dark:border-[#7f1d1d]'">
        
        <div class="flex items-center gap-1.5 font-bold text-xs sm:text-sm"
          [class.text-[#16a34a]]="isCorrect"
          [class.text-[#dc2626]]="!isCorrect">
          <span class="material-symbols-outlined !text-[18px]">{{ isCorrect ? 'check_circle' : 'cancel' }}</span>
          <span>{{ isCorrect ? 'Você acertou!' : 'Resposta incorreta. Gabarito: alternativa ' + correctOption }}</span>
        </div>

        <div *ngIf="question?.explanation || question?.gabarito_comentado" class="text-[#334155] dark:text-[#e2e8f0] leading-relaxed pt-1 border-t border-[#cbd5e1]/40 text-xs">
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
  /** Indica que o usuário já respondeu esta questão (em sessão anterior ou atual) */
  @Input() isResolved: boolean = false;
  /** Indica que o usuário respondeu esta questão e errou */
  @Input() isWrong: boolean = false;

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
    if (this.question?.id) return 'Q' + this.question.id;
    return this.question?.id_qc || this.question?.codigo || 'Q0000000';
  }

  get displaySubject(): string {
    return this.question?.disciplina || this.question?.subject || 'Administração Pública';
  }

  get displayTopic(): string {
    return this.question?.assunto || this.question?.topic || 'Processo Organizacional na Administração Pública';
  }

  get formattedEnunciado(): string {
    const raw = this.question?.enunciado || this.question?.statement || '';
    if (!raw) return '';
    return this.formatStatement(raw);
  }

  private formatStatement(text: string): string {
    let formatted = text;

    // 1. Separate judgment/blank items: ( ), (  ), [ ], ( 1 ), ( 2 ), etc.
    formatted = formatted.replace(/([^\n\r])\s*(\([ ]*\d*[ ]*\)|\[[ ]*\d*[ ]*\])\s*(?=[A-Z0-9"“'«])/g, '$1\n$2 ');

    // 2. Separate Roman numerals: I -, I., I), II -, III -, IV -, etc.
    formatted = formatted.replace(/([^\n\r])\s*\b(I{1,3}|IV|V|VI{1,3}|VII|VIII|IX|X)\s*([–—\-\.\)])\s*(?=[A-Z0-9"“'«])/g, '$1\n$2$3 ');

    // 3. Separate numbered items: 1., 2., 3., 1 -, 2 -, etc. after punctuation
    formatted = formatted.replace(/([.:;])\s*([1-9]\d?)\s*([–—\-\.\)])\s*(?=[A-Z"“'«])/g, '$1\n$2$3 ');

    // 4. Separate conclusion / command sentences
    const promptPatterns = [
      /\b(Os itens são,?\s+respectivamente)/i,
      /\b(A sequência (?:está correta|correta|de preenchimento|correta de preenchimento))/i,
      /\b(O preenchimento correto(?: dos parênteses)?)/i,
      /\b(A ordem correta(?: de preenchimento)?)/i,
      /\b(Assinale a (?:alternativa|opção|afirmativa|assertiva|resposta))/i,
      /\b(É correto (?:apenas )?o que se afirma)/i,
      /\b(Está(?:ão)? corret[ao]\(s\))/i,
      /\b(Estão corret[ao]s(?:\s+os itens|\s+as afirmativas|\s+as proposições|:)?)/i,
      /\b(Quais? estão corret[ao]s\??)/i,
      /\b(Qual está corret[ao]\??)/i,
      /\b(Considerando as (?:afirmativas|proposições|assertivas|informações))/i,
      /\b(Sobre as (?:afirmativas|proposições|assertivas))/i,
      /\b(Quanto [àa]s (?:afirmativas|proposições|assertivas))/i,
      /\b(Em relação [àa]s? (?:afirmativas|proposições|assertivas|itens))/i
    ];

    for (const pattern of promptPatterns) {
      formatted = formatted.replace(new RegExp(`([^\\n\\r])\\s*(${pattern.source})`, 'gi'), '$1\n$2');
    }

    // Clean up excessive blank lines
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted;
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
      return 'bg-[#433fe5] border-[#433fe5] text-white font-black shadow-sm';
    }

    return 'border-[#433fe5] text-[#433fe5] dark:border-[#818cf8] dark:text-[#818cf8] hover:bg-[#eef2ff] dark:hover:bg-[#433fe5]/20';
  }

  submitAnswer(): void {
    if (!this.selectedOption || this.answered) return;
    this.answered = true;
    this.isCorrect = (this.selectedOption === this.correctOption);

    this.answerSubmitted.emit({
      questionId: String(this.question?.id_qc || this.question?.id || this.question?.codigo || ''),
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
