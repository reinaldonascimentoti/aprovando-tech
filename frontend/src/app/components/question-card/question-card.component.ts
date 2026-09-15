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
    <div class="neo-raised rounded-2xl p-4 sm:p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-sm hover:shadow-md transition-all space-y-4 text-[var(--on-surface)]">
      
      <!-- 1. Top Header Row (Index, ID Badge & Hierarchy Breadcrumbs) -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Question Index Number -->
          <div class="bg-[var(--surface-container)] border border-[var(--outline-variant)] text-[var(--on-surface)] text-xs font-bold px-2.5 py-1 rounded-lg min-w-[28px] text-center shadow-xs">
            {{ displayIndex }}
          </div>

          <!-- Question ID Pill -->
          <div class="bg-[var(--primary)] text-white text-xs font-black px-2.5 py-1 rounded-lg tracking-wide shadow-xs">
            {{ displayId }}
          </div>

          <!-- Hierarchy Breadcrumb Box (Disciplina > Assunto) -->
          <div class="bg-[var(--surface-container)] border border-[var(--outline-variant)] text-[var(--on-surface-variant)] text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 flex-wrap">
            <span class="text-[var(--on-surface)] font-bold">{{ displaySubject }}</span>
            <span *ngIf="displayTopic" class="text-[var(--outline)] font-light">›</span>
            <span *ngIf="displayTopic">{{ displayTopic }}</span>
          </div>

          <!-- Quality Score Badge (Admin Mode) -->
          <span *ngIf="isAdmin && question?.quality_metrics?.overall_quality_score" 
                class="bg-[var(--tertiary)]/15 text-[var(--tertiary)] text-xs font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1">
            <span class="material-symbols-outlined !text-[14px]">star</span>
            <span>Qualidade: {{ question.quality_metrics.overall_quality_score }}/10</span>
          </span>

          <!-- Status Badge: Resolvida (Correta) -->
          <span *ngIf="isResolved && !isWrong"
                class="bg-[var(--tertiary)]/10 border border-[var(--tertiary)]/30 text-[var(--tertiary)] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
            <span class="material-symbols-outlined !text-[14px]">check_circle</span>
            <span>Resolvida</span>
          </span>

          <!-- Status Badge: Resolvida (Errada) -->
          <span *ngIf="isWrong"
                class="bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
            <span class="material-symbols-outlined !text-[14px]">cancel</span>
            <span>Errada</span>
          </span>
        </div>

        <!-- Admin Action Buttons Toolbar -->
        <div *ngIf="isAdmin" class="flex items-center gap-1.5 flex-wrap">
          <!-- Release Toggle -->
          <button 
            (click)="toggleRelease.emit(question)" 
            [ngClass]="question.is_released ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'"
            class="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-colors cursor-pointer"
            title="Alternar visibilidade da questão">
            <span class="material-symbols-outlined !text-[14px]">{{ question.is_released ? 'check_circle' : 'lock' }}</span>
            <span>{{ question.is_released ? 'Liberada' : 'Rascunho' }}</span>
          </button>

          <!-- Edit Button -->
          <button 
            (click)="editQuestion.emit(question)"
            class="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors cursor-pointer"
            title="Editar questão">
            <span class="material-symbols-outlined !text-[14px]">edit</span>
            <span>Editar</span>
          </button>

          <!-- Delete Button -->
          <button 
            (click)="deleteQuestion.emit(question)"
            class="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 transition-colors cursor-pointer"
            title="Excluir questão">
            <span class="material-symbols-outlined !text-[14px]">delete</span>
            <span>Excluir</span>
          </button>
        </div>
      </div>

      <!-- 2. Sub-header Metadata Bar (Ano, Banca, Órgão, Prova) -->
      <div class="border-t border-[var(--outline-variant)] pt-2.5 pb-1 text-xs text-[var(--on-surface-variant)] font-semibold flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <div>
          <span class="text-[var(--on-surface-muted)]">Ano:</span>
          <span class="text-[var(--primary)] font-bold ml-1">{{ question?.ano || 2026 }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[var(--on-surface-muted)]">Banca:</span>
          <span class="text-[var(--primary)] font-bold hover:underline cursor-pointer inline-flex items-center gap-1">
            <span *ngIf="getBanca(question?.banca)" class="h-3.5 w-6 inline-flex items-center justify-center bg-white rounded px-0.5 shadow-2xs border border-[var(--outline-variant)]">
              <img [src]="getBanca(question?.banca)?.logo" [alt]="question?.banca" class="max-h-full max-w-full object-contain" />
            </span>
            <span>{{ question?.banca || 'Instituto Legalle' }}</span>
          </span>
        </div>
        <div>
          <span class="text-[var(--on-surface-muted)]">Órgão:</span>
          <span class="text-[var(--primary)] font-bold ml-1 hover:underline cursor-pointer">{{ question?.orgao || 'Prefeitura' }}</span>
        </div>
        <div class="w-full sm:w-auto min-w-0 max-w-full break-words leading-snug">
          <span class="text-[var(--on-surface-muted)]">Prova:</span>
          <span 
            [title]="provaText"
            class="text-[var(--primary)] font-bold ml-1 hover:underline cursor-pointer break-words">
            {{ provaText }}
          </span>
        </div>
      </div>

      <!-- 3. Question Statement (Enunciado) - Dedicated Reading Surface -->
      <div class="p-4 sm:p-5 rounded-2xl bg-[var(--surface-reading)] border border-[var(--outline-variant)]">
        <p class="text-xs sm:text-sm text-[var(--on-surface)] leading-relaxed font-normal whitespace-pre-line text-justify" style="line-height: 1.8;">
          {{ formattedEnunciado }}
        </p>

        <!-- Question Image (if present) -->
        <div *ngIf="question?.imagem_url || question?.metadata?.imagem_url" class="mt-3.5 max-w-lg rounded-xl p-2 bg-[var(--surface)] border border-[var(--outline-variant)] shadow-xs">
          <img [src]="question.imagem_url || question.metadata?.imagem_url" alt="Imagem da questão" class="max-h-64 w-auto object-contain rounded-lg">
        </div>
      </div>

      <!-- 4. Alternatives (Opções de Resposta) -->
      <div class="space-y-2.5 pt-1">
        <div *ngFor="let opt of options; let i = index" 
          class="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group"
          [ngClass]="getOptionCardClass(opt.letra)"
          [class.opacity-40]="eliminatedOptions[opt.letra]"
          [class.line-through]="eliminatedOptions[opt.letra]"
          (click)="selectOption(opt.letra)">

          <!-- Scissor Icon Button (Eliminar Alternativa) -->
          <button 
            type="button"
            (click)="toggleEliminateOption($event, opt.letra)"
            [title]="eliminatedOptions[opt.letra] ? 'Restaurar alternativa' : 'Eliminar alternativa'"
            class="text-[var(--outline)] hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
            [class.text-red-500]="eliminatedOptions[opt.letra]">
            <span class="material-symbols-outlined !text-[16px]">content_cut</span>
          </button>

          <!-- Circle Option Badge (A, B, C, D, E) -->
          <div 
            [ngClass]="getOptionCircleClass(opt.letra)"
            class="w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-xs shrink-0 transition-all select-none">
            {{ opt.letra }}
          </div>

          <!-- Alternative Text -->
          <div 
            class="text-xs sm:text-sm text-[var(--on-surface)] leading-relaxed flex-1 select-none font-medium"
            [class.italic]="eliminatedOptions[opt.letra]">
            {{ opt.texto }}
          </div>
        </div>
      </div>

      <!-- 5. Action Row ("Responder" Button & Retry) -->
      <div class="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-[var(--outline-variant)]/60">
        <button 
          (click)="submitAnswer()"
          [disabled]="!selectedOption || answered"
          class="bg-[var(--primary)] hover:bg-[var(--primary-container)] active:scale-95 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2">
          <span class="material-symbols-outlined !text-[16px]" *ngIf="answered">check_circle</span>
          <span>{{ answered ? 'Respondido' : 'Responder' }}</span>
        </button>

        <button 
          *ngIf="answered"
          (click)="resetAnswer()"
          class="text-xs font-bold text-[var(--on-surface-variant)] hover:text-[var(--primary)] flex items-center gap-1.5 cursor-pointer transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-container-low)]">
          <span class="material-symbols-outlined !text-[16px]">refresh</span>
          <span>Tentar Novamente</span>
        </button>
      </div>

      <!-- 6. Post-Submission Feedback & Teacher Explanation -->
      <div *ngIf="answered" class="mt-3 p-4 rounded-xl text-xs space-y-2 border transition-all"
        [ngClass]="isCorrect 
          ? 'bg-[var(--tertiary)]/10 border-[var(--tertiary)]/30' 
          : 'bg-[var(--error)]/10 border-[var(--error)]/30'">
        
        <div class="flex items-center gap-2 font-bold text-xs sm:text-sm"
          [class.text-[var(--tertiary)]]="isCorrect"
          [class.text-[var(--error)]]="!isCorrect">
          <span class="material-symbols-outlined !text-[18px]">{{ isCorrect ? 'check_circle' : 'cancel' }}</span>
          <span>{{ isCorrect ? 'Você acertou!' : 'Resposta incorreta. Gabarito: alternativa ' + correctOption }}</span>
        </div>

        <div *ngIf="question?.explanation || question?.gabarito_comentado" class="text-[var(--on-surface)] leading-relaxed pt-2 border-t border-[var(--outline-variant)]/40 text-xs sm:text-sm" style="line-height: 1.7;">
          <strong class="text-[var(--on-surface)]">Gabarito Comentado:</strong> {{ question.explanation || question.gabarito_comentado }}
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
    formatted = formatted.replace(/([^\n\r])\s*\b(I{1,3}|IV|V|VI{1,3}|VII|VIII|IX|X)\s*([–—\-\.\)])\s*(?=[a-zA-Z0-9"“'«])/g, '$1\n$2$3 ');

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

  getOptionCardClass(letra: string): string {
    if (this.answered) {
      if (letra === this.correctOption) {
        return 'bg-[var(--tertiary)]/10 border-[var(--tertiary)]/50 text-[var(--on-surface)]';
      }
      if (this.selectedOption === letra && letra !== this.correctOption) {
        return 'bg-[var(--error)]/10 border-[var(--error)]/50 text-[var(--on-surface)]';
      }
      return 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] opacity-70';
    }

    if (this.selectedOption === letra) {
      return 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-xs';
    }

    return 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-container)]';
  }

  getOptionCircleClass(letra: string): string {
    if (this.answered) {
      if (letra === this.correctOption) {
        return 'bg-[var(--tertiary)] border-[var(--tertiary)] text-white font-black';
      }
      if (this.selectedOption === letra && letra !== this.correctOption) {
        return 'bg-[var(--error)] border-[var(--error)] text-white font-black';
      }
      return 'border-[var(--outline-variant)] text-[var(--outline)] bg-transparent';
    }

    if (this.selectedOption === letra) {
      return 'bg-[var(--primary)] border-[var(--primary)] text-white font-black shadow-xs';
    }

    return 'border-[var(--outline)] text-[var(--on-surface-variant)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] bg-transparent';
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
