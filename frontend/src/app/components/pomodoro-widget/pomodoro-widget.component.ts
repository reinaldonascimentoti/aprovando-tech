import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PomodoroStateService } from '../../services/pomodoro-state.service';

@Component({
  selector: 'app-pomodoro-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible"
      class="fixed bottom-6 right-6 z-[9999] transition-all duration-300 transform select-none"
      [class.scale-100]="isVisible"
      [class.opacity-100]="isVisible">
      
      <div 
        (click)="goToPomodoro()"
        class="group cursor-pointer neo-raised rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center gap-3.5 border border-[var(--outline-variant)]/40 shadow-2xl backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-indigo-500/20"
        [style.background]="'var(--surface-container-low)'">
        
        <!-- Left: Glowing Emoji & Circular Progress -->
        <div class="relative flex items-center justify-center w-10 h-10 shrink-0">
          <svg class="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <path
              class="text-[var(--surface-container-highest)]"
              stroke-width="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              stroke-width="3.5"
              stroke-linecap="round"
              fill="none"
              [attr.stroke]="pomodoroService.modeColor()"
              [attr.stroke-dasharray]="'100, 100'"
              [attr.stroke-dashoffset]="100 - pomodoroService.progressPct()"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              class="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span class="absolute text-base transition-transform group-hover:scale-110"
                [class.animate-pulse]="pomodoroService.isRunning()">
            {{ pomodoroService.modeEmoji() }}
          </span>
        </div>

        <!-- Center: Info -->
        <div class="flex flex-col min-w-[76px]">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-[var(--on-surface-variant)] leading-tight">
              {{ pomodoroService.modeLabel() }}
            </span>
            <span *ngIf="pomodoroService.isRunning()" 
              class="w-1.5 h-1.5 rounded-full animate-ping"
              [style.background]="pomodoroService.modeColor()">
            </span>
          </div>
          <span class="text-lg font-black tracking-tight tabular-nums leading-none text-[var(--on-surface)]"
                [style.color]="pomodoroService.modeColor()">
            {{ pomodoroService.displayTime() }}
          </span>
        </div>

        <!-- Right: Action buttons -->
        <div class="flex items-center gap-1.5 pl-1 border-l border-[var(--outline-variant)]/40" (click)="$event.stopPropagation()">
          <!-- Play / Pause -->
          <button 
            (click)="pomodoroService.toggleTimer()"
            class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
            [class.btn-mesh]="pomodoroService.isRunning()"
            [class.btn-neo]="!pomodoroService.isRunning()"
            [title]="pomodoroService.isRunning() ? 'Pausar' : 'Continuar'">
            <span class="material-symbols-outlined !text-[18px]">
              {{ pomodoroService.isRunning() ? 'pause' : 'play_arrow' }}
            </span>
          </button>

          <!-- Expand / Open Pomodoro Page -->
          <button 
            (click)="goToPomodoro()"
            class="w-8 h-8 rounded-xl btn-neo flex items-center justify-center text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-all"
            title="Abrir Pomodoro Completo">
            <span class="material-symbols-outlined !text-[16px]">open_in_full</span>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class PomodoroWidgetComponent {
  public pomodoroService = inject(PomodoroStateService);
  private router = inject(Router);

  currentUrl = this.router.url;

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentUrl = event.urlAfterRedirects || event.url;
    });
  }

  get isVisible(): boolean {
    const isPomodoroRoute = this.currentUrl.startsWith('/pomodoro');
    return !isPomodoroRoute && this.pomodoroService.hasActiveSession();
  }

  goToPomodoro(): void {
    this.router.navigate(['/pomodoro']);
  }
}
