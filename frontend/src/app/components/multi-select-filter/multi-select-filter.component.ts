import { Component, Input, Output, EventEmitter, ElementRef, HostListener, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-multi-select-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-1 relative" #containerRef>
      <!-- Label e contador -->
      <div class="flex items-center justify-between text-[11px] font-bold text-[var(--on-surface-variant)]">
        <label class="flex items-center gap-1 cursor-pointer" (click)="toggleDropdown($event)">
          <span class="material-symbols-outlined !text-[14px] text-[var(--primary)]">{{ icon }}</span>
          <span>{{ label }}</span>
        </label>
        <span 
          *ngIf="selected.length > 0" 
          class="text-[10px] font-extrabold text-[var(--primary)] bg-[var(--primary)]/15 px-1.5 py-0.5 rounded-md leading-none">
          {{ selected.length }}
        </span>
      </div>

      <!-- Trigger Button -->
      <button
        type="button"
        (click)="toggleDropdown($event)"
        class="neo-pressed rounded-xl px-3 py-2 flex items-center justify-between bg-[var(--background)] border transition-all text-xs w-full text-[var(--on-surface)] cursor-pointer font-medium gap-1.5 text-left select-none"
        [class.border-[var(--primary)]]="isOpen || selected.length > 0"
        [class.border-[var(--outline-variant)]]="!isOpen && selected.length === 0"
        [class.shadow-sm]="isOpen">
        
        <!-- Conteúdo do seletor -->
        <div class="flex items-center gap-1.5 truncate flex-1 min-w-0">
          <!-- Quando nada selecionado -->
          <span *ngIf="selected.length === 0" class="text-[var(--outline)] truncate font-normal">
            {{ placeholder }}
          </span>

          <!-- Quando 1 selecionado -->
          <span *ngIf="selected.length === 1" class="font-bold text-[var(--on-surface)] truncate">
            {{ selected[0] }}
          </span>

          <!-- Quando 2 ou mais selecionados -->
          <div *ngIf="selected.length > 1" class="flex items-center gap-1.5 truncate">
            <span class="font-bold text-[var(--on-surface)] truncate">{{ selected[0] }}</span>
            <span class="text-[10px] font-extrabold bg-[var(--primary)]/20 text-[var(--primary)] px-1.5 py-0.5 rounded-full shrink-0">
              +{{ selected.length - 1 }}
            </span>
          </div>
        </div>

        <!-- Botões auxiliares à direita -->
        <div class="flex items-center gap-1 shrink-0">
          <span
            *ngIf="selected.length > 0"
            (click)="clearAll($event)"
            title="Limpar seleção"
            class="text-[var(--outline)] hover:text-red-500 rounded p-0.5 transition-colors cursor-pointer flex items-center">
            <span class="material-symbols-outlined !text-[15px]">close</span>
          </span>
          <span 
            class="material-symbols-outlined !text-[16px] text-[var(--outline)] transition-transform duration-200" 
            [class.rotate-180]="isOpen">
            expand_more
          </span>
        </div>
      </button>

      <!-- Dropdown Flutuante -->
      <div
        *ngIf="isOpen"
        (click)="$event.stopPropagation()"
        class="absolute left-0 top-full mt-1.5 w-full min-w-[240px] max-w-[340px] rounded-2xl bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-2xl z-[70] p-2.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        
        <!-- Campo de Pesquisa interna se houver mais de 5 opções ou permitir custom -->
        <div *ngIf="options.length > 4 || allowCustom" class="neo-pressed rounded-lg px-2.5 py-1.5 mb-2 flex items-center gap-1.5 bg-[var(--background)] border border-[var(--outline-variant)]/40">
          <span class="material-symbols-outlined text-[var(--outline)] !text-[15px]">search</span>
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (click)="$event.stopPropagation()"
            [placeholder]="'Filtrar ' + label.toLowerCase() + '...'"
            class="bg-transparent border-none outline-none text-[11px] w-full text-[var(--on-surface)] placeholder:text-[var(--outline)]">
          <button
            *ngIf="searchTerm"
            type="button"
            (click)="searchTerm = ''"
            class="text-[var(--outline)] hover:text-[var(--on-surface)] text-xs cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Barra de Ações Rápidas: Marcar Todos / Limpar / Contagem -->
        <div class="flex items-center justify-between px-1 pb-1.5 mb-1.5 border-b border-[var(--outline-variant)]/30 text-[10px] font-bold">
          <span class="text-[var(--on-surface-variant)]">
            <strong class="text-[var(--primary)]">{{ selected.length }}</strong> de {{ options.length }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="selectAll($event)"
              class="text-[var(--primary)] hover:underline cursor-pointer">
              Todos
            </button>
            <span class="text-[var(--outline)] opacity-50">•</span>
            <button
              type="button"
              (click)="clearAll($event)"
              class="text-[var(--on-surface-variant)] hover:text-red-500 cursor-pointer">
              Limpar
            </button>
          </div>
        </div>

        <!-- Adicionar opção customizada se permitida e não existir na lista -->
        <div *ngIf="allowCustom && searchTerm.trim() && !hasExactSearchMatch" class="mb-1.5">
          <button
            type="button"
            (click)="addCustomOption(searchTerm.trim(), $event)"
            class="w-full text-left px-2.5 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
            <span class="material-symbols-outlined !text-[14px]">add_circle</span>
            <span class="truncate">Adicionar "{{ searchTerm.trim() }}"</span>
          </button>
        </div>

        <!-- Lista Rolável de Opções -->
        <div class="max-h-52 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
          <div *ngIf="filteredOptions.length === 0 && (!allowCustom || !searchTerm.trim())" class="py-4 text-center text-xs text-[var(--outline)]">
            Nenhuma opção encontrada
          </div>

          <label
            *ngFor="let opt of filteredOptions"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--surface-container-high)]/70 text-[11px] font-semibold text-[var(--on-surface)] cursor-pointer transition-colors select-none">
            <input
              type="checkbox"
              [checked]="isSelected(opt)"
              (change)="toggleOption(opt)"
              class="rounded border-[var(--outline-variant)] text-[var(--primary)] focus:ring-0 cursor-pointer w-3.5 h-3.5 shrink-0" />
            <span class="truncate flex-1" [title]="opt">{{ opt }}</span>
          </label>
        </div>
      </div>
    </div>
  `
})
export class MultiSelectFilterComponent {
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  @Input() label: string = '';
  @Input() icon: string = 'filter_list';
  @Input() placeholder: string = 'Selecione...';
  @Input() options: (string | number)[] = [];
  @Input() selected: (string | number)[] = [];
  @Input() allowCustom: boolean = false;

  @Output() selectedChange = new EventEmitter<(string | number)[]>();
  @Output() filterChange = new EventEmitter<void>();

  isOpen = false;
  searchTerm = '';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen && this.elementRef && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.searchTerm = '';
      this.cdr.markForCheck();
    }
  }

  @HostListener('keydown.escape')
  onEscape() {
    if (this.isOpen) {
      this.isOpen = false;
      this.searchTerm = '';
      this.cdr.markForCheck();
    }
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchTerm = '';
    }
    this.cdr.markForCheck();
  }

  get filteredOptions(): (string | number)[] {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return this.options || [];
    }
    const term = this.searchTerm.trim().toLowerCase();
    return (this.options || []).filter(opt =>
      String(opt).toLowerCase().includes(term)
    );
  }

  get hasExactSearchMatch(): boolean {
    if (!this.searchTerm || !this.searchTerm.trim()) return true;
    const term = this.searchTerm.trim().toLowerCase();
    return (this.options || []).some(opt => String(opt).toLowerCase().trim() === term);
  }

  isSelected(opt: string | number): boolean {
    const strOpt = String(opt).toLowerCase().trim();
    return (this.selected || []).some(s => String(s).toLowerCase().trim() === strOpt);
  }

  toggleOption(opt: string | number) {
    const strOpt = String(opt).toLowerCase().trim();
    const index = (this.selected || []).findIndex(s => String(s).toLowerCase().trim() === strOpt);
    if (index >= 0) {
      this.selected = this.selected.filter((_, i) => i !== index);
    } else {
      this.selected = [...(this.selected || []), opt];
    }
    this.selectedChange.emit(this.selected);
    this.filterChange.emit();
    this.cdr.markForCheck();
  }

  selectAll(event: MouseEvent) {
    event.stopPropagation();
    const itemsToAdd = this.filteredOptions.length > 0 ? this.filteredOptions : this.options;
    const currentSet = new Map<string, string | number>();
    for (const s of (this.selected || [])) {
      currentSet.set(String(s).toLowerCase().trim(), s);
    }
    for (const item of itemsToAdd) {
      currentSet.set(String(item).toLowerCase().trim(), item);
    }
    this.selected = Array.from(currentSet.values());
    this.selectedChange.emit(this.selected);
    this.filterChange.emit();
    this.cdr.markForCheck();
  }

  clearAll(event: MouseEvent) {
    event.stopPropagation();
    this.selected = [];
    this.selectedChange.emit(this.selected);
    this.filterChange.emit();
    this.cdr.markForCheck();
  }

  addCustomOption(val: string, event: MouseEvent) {
    event.stopPropagation();
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!this.isSelected(trimmed)) {
      this.selected = [...(this.selected || []), trimmed];
      if (!(this.options || []).some(o => String(o).toLowerCase().trim() === trimmed.toLowerCase())) {
        this.options = [...(this.options || []), trimmed];
      }
      this.selectedChange.emit(this.selected);
      this.filterChange.emit();
    }
    this.searchTerm = '';
    this.cdr.markForCheck();
  }
}
