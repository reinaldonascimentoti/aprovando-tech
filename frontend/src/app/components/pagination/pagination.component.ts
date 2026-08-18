import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="totalItems > 0" class="bg-white dark:bg-[#1e232a] border border-[#e2e8f0] dark:border-[#2d3748] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-xs font-semibold text-[#475569] dark:text-[#cbd5e1]">
      
      <!-- Range info -->
      <div>
        Mostrando <span class="font-extrabold text-[#191c1e] dark:text-white">{{ startItem }}</span>
        - <span class="font-extrabold text-[#191c1e] dark:text-white">{{ endItem }}</span>
        de <span class="font-extrabold text-[#433fe5] dark:text-[#818cf8]">{{ totalItems }}</span> questões
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-1.5 flex-wrap">
        
        <!-- Previous Button -->
        <button
          (click)="goToPage(currentPage - 1)"
          [disabled]="currentPage <= 1"
          class="w-8 h-8 rounded-xl border border-[#cbd5e1] dark:border-[#4a5568] flex items-center justify-center text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          title="Página Anterior">
          <span class="material-symbols-outlined !text-[18px]">chevron_left</span>
        </button>

        <!-- First page button if omitted -->
        <ng-container *ngIf="pages.length > 0 && pages[0] > 1">
          <button
            (click)="goToPage(1)"
            class="w-8 h-8 rounded-xl border border-[#cbd5e1] dark:border-[#4a5568] flex items-center justify-center hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] transition-all cursor-pointer font-bold">
            1
          </button>
          <span *ngIf="pages[0] > 2" class="px-1 text-[#94a3b8]">...</span>
        </ng-container>

        <!-- Page Numbers -->
        <button
          *ngFor="let page of pages"
          (click)="goToPage(page)"
          [ngClass]="page === currentPage
            ? 'bg-[#433fe5] text-white border-[#433fe5] shadow-md'
            : 'border-[#cbd5e1] dark:border-[#4a5568] hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] text-[#475569] dark:text-[#cbd5e1]'"
          class="w-8 h-8 rounded-xl border flex items-center justify-center font-bold transition-all cursor-pointer">
          {{ page }}
        </button>

        <!-- Last page button if omitted -->
        <ng-container *ngIf="pages.length > 0 && pages[pages.length - 1] < totalPages">
          <span *ngIf="pages[pages.length - 1] < totalPages - 1" class="px-1 text-[#94a3b8]">...</span>
          <button
            (click)="goToPage(totalPages)"
            class="w-8 h-8 rounded-xl border border-[#cbd5e1] dark:border-[#4a5568] flex items-center justify-center hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] transition-all cursor-pointer font-bold">
            {{ totalPages }}
          </button>
        </ng-container>

        <!-- Next Button -->
        <button
          (click)="goToPage(currentPage + 1)"
          [disabled]="currentPage >= totalPages"
          class="w-8 h-8 rounded-xl border border-[#cbd5e1] dark:border-[#4a5568] flex items-center justify-center text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          title="Próxima Página">
          <span class="material-symbols-outlined !text-[18px]">chevron_right</span>
        </button>

      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
