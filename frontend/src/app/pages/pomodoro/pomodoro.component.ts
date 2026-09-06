import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SupabaseService } from '../../services/supabase.service';
import { ApiService } from '../../services/api.service';
import { PomodoroStateService, TimerMode, PomodoroSettings, DEFAULT_SETTINGS } from '../../services/pomodoro-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pomodoro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] transition-colors duration-300">

      <!-- ═══════════════════ HEADER ═══════════════════ -->
      <header class="neo-raised border-b border-[var(--outline-variant)]/40 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sticky top-0 z-20">
        <div class="flex items-center gap-3">
          <button (click)="goBack()" class="btn-neo px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
            <span class="hidden sm:inline">Voltar</span>
          </button>
          <div class="flex items-center gap-2">
            <span class="text-2xl">🍅</span>
            <div>
              <h1 class="text-base font-extrabold text-[var(--on-surface)] leading-none">Pomodoro</h1>
              <p class="text-[10px] text-[var(--on-surface-variant)]">Aprovando Tech • Banco de Horas</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Horas hoje resumo -->
          <div class="neo-pressed px-3 py-1.5 rounded-xl hidden sm:flex items-center gap-2">
            <span class="material-symbols-outlined !text-[14px] text-[var(--primary)]">schedule</span>
            <span class="text-xs font-bold text-[var(--primary)]">Hoje: {{ formatHorasMin(totalMinToday) }}</span>
          </div>
          <button (click)="themeService.toggle()" class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5" [title]="themeService.isDark() ? 'Modo Claro' : 'Modo Escuro'">
            <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
          </button>
          <button (click)="openSettings()" class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5" title="Configurações">
            <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">settings</span>
          </button>
        </div>
      </header>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <!-- ═══════════════════ TIMER AREA ═══════════════════ -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

          <!-- Timer card (3/5) -->
          <div class="lg:col-span-3 neo-raised rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-6">

            <!-- Mode tabs -->
            <div class="neo-pressed rounded-2xl p-1 flex gap-1 w-full max-w-sm">
              <button *ngFor="let m of modes" (click)="setMode(m.key)"
                class="flex-1 py-2 px-3 rounded-xl text-[11px] font-extrabold transition-all duration-200"
                [class.btn-mesh]="activeMode === m.key"
                [class.text-[var(--on-surface-variant)]]="activeMode !== m.key">
                {{ m.label }}
              </button>
            </div>

            <!-- SVG Circular Timer -->
            <div class="relative flex items-center justify-center" style="width:240px;height:240px;">
              <!-- Background ring -->
              <svg class="absolute inset-0" width="240" height="240" viewBox="0 0 240 240">
                <circle cx="120" cy="120" r="108" fill="none" stroke="var(--surface-container)" stroke-width="10"/>
                <!-- Progress ring -->
                <circle cx="120" cy="120" r="108" fill="none"
                  [attr.stroke]="modeColor"
                  stroke-width="10"
                  stroke-linecap="round"
                  stroke-dasharray="678.6"
                  [attr.stroke-dashoffset]="strokeDashoffset"
                  transform="rotate(-90 120 120)"
                  class="transition-all duration-1000 ease-linear"/>
                <!-- Glow effect -->
                <circle cx="120" cy="120" r="108" fill="none"
                  [attr.stroke]="modeColor"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-dasharray="678.6"
                  [attr.stroke-dashoffset]="strokeDashoffset"
                  transform="rotate(-90 120 120)"
                  [attr.filter]="'url(#glow-' + activeMode + ')'"
                  class="transition-all duration-1000 ease-linear opacity-50"/>
                <defs>
                  <filter id="glow-foco" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-pausa_curta" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-pausa_longa" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
              </svg>

              <!-- Center content -->
              <div class="flex flex-col items-center gap-1 z-10">
                <span class="text-4xl">{{ modeEmoji }}</span>
                <div class="font-black text-5xl tracking-tighter tabular-nums leading-none" [style.color]="modeColor">
                  {{ displayTime }}
                </div>
                <span class="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mt-1">
                  {{ modeLabel }}
                </span>
                <!-- Ciclo indicator -->
                <div class="flex gap-1.5 mt-1.5">
                  <div *ngFor="let c of ciclosDots; let i = index"
                    class="w-2 h-2 rounded-full transition-all duration-300"
                    [class.bg-[var(--primary)]]="i < cicloAtual"
                    [class.bg-[var(--surface-container-highest)]]="i >= cicloAtual">
                  </div>
                </div>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center gap-4">
              <button (click)="resetTimer()" class="btn-neo w-12 h-12 rounded-2xl flex items-center justify-center" title="Resetar">
                <span class="material-symbols-outlined !text-[22px]">replay</span>
              </button>
              <button (click)="toggleTimer()"
                class="btn-mesh w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                [style.box-shadow]="isRunning ? '0 0 30px ' + modeColorAlpha : ''">
                <span class="material-symbols-outlined !text-[40px] filled">{{ isRunning ? 'pause' : 'play_arrow' }}</span>
              </button>
              <button (click)="skipTimer()" class="btn-neo w-12 h-12 rounded-2xl flex items-center justify-center" title="Pular">
                <span class="material-symbols-outlined !text-[22px]">skip_next</span>
              </button>
            </div>

            <!-- Session selectors -->
            <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--outline-variant)]/40">
              <div>
                <label class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-1.5">Edital</label>
                <select [(ngModel)]="selectedEditalId" class="neo-input w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none">
                  <option value="">Sem vínculo</option>
                  <option *ngFor="let e of editais" [value]="e.id">{{ e.title | slice:0:40 }}{{ e.title?.length > 40 ? '…' : '' }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-1.5">Disciplina</label>
                <input [(ngModel)]="selectedDisciplina" type="text" placeholder="Ex: Direito Constitucional"
                  class="neo-input w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none" />
              </div>
            </div>

            <!-- Sound & notification toggles -->
            <div class="w-full flex flex-wrap gap-3 pt-1">
              <button (click)="toggleSound()" class="flex items-center gap-2 neo-pressed px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                [class.border-[var(--primary)]]="settings.somAtivado"
                [class.text-[var(--primary)]]="settings.somAtivado">
                <span class="material-symbols-outlined !text-[16px]">{{ settings.somAtivado ? 'volume_up' : 'volume_off' }}</span>
                Som {{ settings.somAtivado ? 'On' : 'Off' }}
              </button>
              <button (click)="toggleNotifications()" class="flex items-center gap-2 neo-pressed px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                [class.border-[var(--primary)]]="settings.notificacoesAtivadas"
                [class.text-[var(--primary)]]="settings.notificacoesAtivadas">
                <span class="material-symbols-outlined !text-[16px]">{{ settings.notificacoesAtivadas ? 'notifications_active' : 'notifications_off' }}</span>
                Notificações {{ settings.notificacoesAtivadas ? 'On' : 'Off' }}
              </button>
            </div>
          </div>

          <!-- Stats sidebar (2/5) -->
          <div class="lg:col-span-2 flex flex-col gap-4">

            <!-- Today stats -->
            <div class="neo-raised rounded-3xl p-5">
              <h3 class="text-xs font-extrabold text-[var(--on-surface-variant)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">today</span>
                Hoje
              </h3>
              <div class="grid grid-cols-3 gap-3">
                <div class="neo-pressed rounded-2xl p-3 text-center">
                  <div class="text-2xl font-black text-[var(--primary)]">{{ pomodorosToday }}</div>
                  <div class="text-[10px] font-bold text-[var(--on-surface-variant)] mt-0.5">Pomodoros</div>
                </div>
                <div class="neo-pressed rounded-2xl p-3 text-center">
                  <div class="text-2xl font-black text-[var(--tertiary-container)]">{{ formatHorasMin(totalMinToday) }}</div>
                  <div class="text-[10px] font-bold text-[var(--on-surface-variant)] mt-0.5">Estudadas</div>
                </div>
                <div class="neo-pressed rounded-2xl p-3 text-center">
                  <div class="text-2xl font-black text-[var(--secondary)]">{{ sessionsToday }}</div>
                  <div class="text-[10px] font-bold text-[var(--on-surface-variant)] mt-0.5">Sessões</div>
                </div>
              </div>
            </div>

            <!-- Weekly chart -->
            <div class="neo-raised rounded-3xl p-5">
              <h3 class="text-xs font-extrabold text-[var(--on-surface-variant)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">bar_chart</span>
                Últimos 7 Dias
              </h3>
              <div class="flex items-end gap-1.5 h-24">
                <div *ngFor="let day of weeklyChart" class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full rounded-t-lg transition-all duration-500 relative group"
                    [style.height.%]="day.heightPct"
                    [style.min-height.px]="day.totalMin > 0 ? 4 : 2"
                    [style.background]="day.isToday ? modeColor : 'var(--surface-container-highest)'"
                    [title]="day.label + ': ' + formatHorasMin(day.totalMin)">
                    <!-- Tooltip -->
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--surface-container-highest)] text-[var(--on-surface)] text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {{ formatHorasMin(day.totalMin) }}
                    </div>
                  </div>
                  <span class="text-[9px] font-bold text-[var(--on-surface-variant)]" [class.text-[var(--primary)]]="day.isToday">{{ day.shortLabel }}</span>
                </div>
              </div>
              <div class="mt-2 text-right">
                <span class="text-xs font-bold text-[var(--primary)]">Total semana: {{ formatHorasMin(totalMinWeek) }}</span>
              </div>
            </div>

            <!-- Horas por edital -->
            <div class="neo-raised rounded-3xl p-5 flex-1">
              <h3 class="text-xs font-extrabold text-[var(--on-surface-variant)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">school</span>
                Horas por Edital
              </h3>
              <div *ngIf="hoursByEdital.length === 0" class="text-center py-6">
                <span class="material-symbols-outlined !text-[40px] text-[var(--outline)] block mb-2">menu_book</span>
                <p class="text-xs text-[var(--on-surface-variant)]">Nenhuma sessão vinculada a edital ainda</p>
              </div>
              <div class="space-y-2.5">
                <div *ngFor="let item of hoursByEdital; let i = index" class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-[var(--on-surface)] truncate flex-1 pr-2">
                      {{ getEditalTitle(item.edital_id) | slice:0:28 }}{{ getEditalTitle(item.edital_id).length > 28 ? '…' : '' }}
                    </span>
                    <span class="text-[11px] font-extrabold shrink-0" [style.color]="modeColor">{{ formatHorasMin(item.total_min) }}</span>
                  </div>
                  <div class="w-full h-1.5 bg-[var(--surface-container)] rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                      [style.width.%]="getEditalBarWidth(item.total_min)"
                      [style.background]="modeColor">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════════ HISTÓRICO ═══════════════════ -->
        <div class="neo-raised rounded-3xl p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-extrabold text-[var(--on-surface)] flex items-center gap-2">
              <span class="material-symbols-outlined !text-[18px] text-[var(--primary)]">history</span>
              Histórico de Sessões
            </h3>
            <button (click)="openManualAdd()" class="btn-mesh px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined !text-[15px]">add</span>
              Adicionar Manualmente
            </button>
          </div>

          <div *ngIf="sessions.length === 0" class="text-center py-10">
            <span class="material-symbols-outlined !text-[48px] text-[var(--outline)] block mb-3">timer</span>
            <p class="text-sm text-[var(--on-surface-variant)] font-semibold">Nenhuma sessão registrada ainda</p>
            <p class="text-xs text-[var(--on-surface-variant)] mt-1">Inicie o timer ou adicione horas manualmente</p>
          </div>

          <div class="space-y-2">
            <div *ngFor="let s of sessions.slice(0, showAllSessions ? 9999 : 10)"
              class="neo-pressed rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  [style.background]="s.tipo === 'pomodoro' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'">
                  <span class="text-base">{{ s.tipo === 'pomodoro' ? '🍅' : '✏️' }}</span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold text-[var(--on-surface)]">{{ formatHorasMin(s.duracao_min) }}</span>
                    <span *ngIf="s.disciplina" class="text-[10px] font-semibold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full">{{ s.disciplina }}</span>
                    <span *ngIf="s.tipo === 'manual'" class="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Manual</span>
                  </div>
                  <div class="text-[10px] text-[var(--on-surface-variant)] mt-0.5">
                    {{ formatDate(s.started_at) }}
                    <span *ngIf="s.edital_id"> · {{ getEditalTitle(s.edital_id) | slice:0:25 }}{{ getEditalTitle(s.edital_id).length > 25 ? '…' : '' }}</span>
                  </div>
                  <div *ngIf="s.notas" class="text-[10px] text-[var(--outline)] mt-0.5 italic">{{ s.notas }}</div>
                </div>
              </div>
              <button (click)="deleteSession(s.id)" class="btn-neo w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[var(--error)] hover:bg-[var(--error)]/10 transition-all">
                <span class="material-symbols-outlined !text-[14px]">delete</span>
              </button>
            </div>
          </div>

          <button *ngIf="sessions.length > 10 && !showAllSessions" (click)="showAllSessions = true"
            class="w-full mt-3 btn-neo py-2.5 rounded-xl text-xs font-bold">
            Ver todas as {{ sessions.length }} sessões
          </button>
        </div>

      </div>
    </div>

    <!-- ═══════════════════ SETTINGS MODAL ═══════════════════ -->
    <div *ngIf="settingsOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);">
      <div class="neo-raised rounded-3xl p-6 w-full max-w-md space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-extrabold flex items-center gap-2">
            <span class="material-symbols-outlined !text-[20px] text-[var(--primary)]">settings</span>
            Configurações do Pomodoro
          </h2>
          <button (click)="closeSettings()" class="btn-neo w-8 h-8 rounded-xl flex items-center justify-center">
            <span class="material-symbols-outlined !text-[16px]">close</span>
          </button>
        </div>

        <!-- Durations -->
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">⏱️ Durações (minutos)</h3>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-[10px] font-semibold text-[var(--on-surface-variant)] block mb-1">🍅 Foco</label>
              <input type="number" [(ngModel)]="settingsEdit.focoDuracao" min="1" max="90"
                class="neo-input w-full rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none"/>
            </div>
            <div>
              <label class="text-[10px] font-semibold text-[var(--on-surface-variant)] block mb-1">☕ Pausa C.</label>
              <input type="number" [(ngModel)]="settingsEdit.pausaCurtaDuracao" min="1" max="30"
                class="neo-input w-full rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none"/>
            </div>
            <div>
              <label class="text-[10px] font-semibold text-[var(--on-surface-variant)] block mb-1">🌙 Pausa L.</label>
              <input type="number" [(ngModel)]="settingsEdit.pausaLongaDuracao" min="1" max="60"
                class="neo-input w-full rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none"/>
            </div>
          </div>
          <div>
            <label class="text-[10px] font-semibold text-[var(--on-surface-variant)] block mb-1">Ciclos até pausa longa</label>
            <input type="number" [(ngModel)]="settingsEdit.ciclosAtePausaLonga" min="1" max="10"
              class="neo-input w-full rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none"/>
          </div>
        </div>

        <!-- Auto start toggles -->
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">🔄 Auto-iniciar</h3>
          <div class="flex items-center justify-between neo-pressed rounded-xl px-4 py-3">
            <span class="text-sm font-semibold">Auto-iniciar pausas</span>
            <button (click)="settingsEdit.autoIniciarPausa = !settingsEdit.autoIniciarPausa"
              class="w-12 h-6 rounded-full transition-all duration-200 relative"
              [style.background]="settingsEdit.autoIniciarPausa ? '#433fe5' : 'var(--surface-container-highest)'">
              <div class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                [style.left]="settingsEdit.autoIniciarPausa ? '26px' : '2px'"></div>
            </button>
          </div>
          <div class="flex items-center justify-between neo-pressed rounded-xl px-4 py-3">
            <span class="text-sm font-semibold">Auto-iniciar foco</span>
            <button (click)="settingsEdit.autoIniciarFoco = !settingsEdit.autoIniciarFoco"
              class="w-12 h-6 rounded-full transition-all duration-200 relative"
              [style.background]="settingsEdit.autoIniciarFoco ? '#433fe5' : 'var(--surface-container-highest)'">
              <div class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                [style.left]="settingsEdit.autoIniciarFoco ? '26px' : '2px'"></div>
            </button>
          </div>
        </div>

        <!-- Sound & notif -->
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">🔔 Sons & Notificações</h3>
          <div class="flex items-center justify-between neo-pressed rounded-xl px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined !text-[18px] text-[var(--primary)]">volume_up</span>
              <span class="text-sm font-semibold">Som de alarme</span>
            </div>
            <button (click)="settingsEdit.somAtivado = !settingsEdit.somAtivado"
              class="w-12 h-6 rounded-full transition-all duration-200 relative"
              [style.background]="settingsEdit.somAtivado ? '#433fe5' : 'var(--surface-container-highest)'">
              <div class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                [style.left]="settingsEdit.somAtivado ? '26px' : '2px'"></div>
            </button>
          </div>
          <div class="flex items-center justify-between neo-pressed rounded-xl px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined !text-[18px] text-[var(--primary)]">notifications_active</span>
              <span class="text-sm font-semibold">Notificações</span>
            </div>
            <button (click)="toggleNotifSetting()" class="w-12 h-6 rounded-full transition-all duration-200 relative"
              [style.background]="settingsEdit.notificacoesAtivadas ? '#433fe5' : 'var(--surface-container-highest)'">
              <div class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                [style.left]="settingsEdit.notificacoesAtivadas ? '26px' : '2px'"></div>
            </button>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button (click)="resetSettingsToDefault()" class="btn-neo flex-1 py-2.5 rounded-xl text-xs font-bold">
            Restaurar Padrão
          </button>
          <button (click)="saveSettings()" class="btn-mesh flex-1 py-2.5 rounded-xl text-xs font-bold">
            Salvar
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════ MANUAL ADD MODAL ═══════════════════ -->
    <div *ngIf="manualAddOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);">
      <div class="neo-raised rounded-3xl p-6 w-full max-w-sm space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-extrabold flex items-center gap-2">
            <span class="text-xl">✏️</span>
            Adicionar Horas Manualmente
          </h2>
          <button (click)="manualAddOpen = false" class="btn-neo w-8 h-8 rounded-xl flex items-center justify-center">
            <span class="material-symbols-outlined !text-[16px]">close</span>
          </button>
        </div>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-1.5">Horas</label>
              <input type="number" [(ngModel)]="manualHoras" min="0" max="24" placeholder="0"
                class="neo-input w-full rounded-xl px-3 py-2.5 text-sm font-bold text-center focus:outline-none"/>
            </div>
            <div>
              <label class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-1.5">Minutos</label>
              <input type="number" [(ngModel)]="manualMinutos" min="0" max="59" placeholder="0"
                class="neo-input w-full rounded-xl px-3 py-2.5 text-sm font-bold text-center focus:outline-none"/>
            </div>
          </div>

          <div>
            <label class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-1.5">Data</label>
            <input type="date" [(ngModel)]="manualData"
              class="neo-input w-full rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none"/>
          </div>

          <div>
            <label class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-1.5">Edital (opcional)</label>
            <select [(ngModel)]="manualEditalId" class="neo-input w-full rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none">
              <option value="">Sem vínculo</option>
              <option *ngFor="let e of editais" [value]="e.id">{{ e.title | slice:0:40 }}</option>
            </select>
          </div>

          <div>
            <label class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-1.5">Disciplina (opcional)</label>
            <input type="text" [(ngModel)]="manualDisciplina" placeholder="Ex: Direito Constitucional"
              class="neo-input w-full rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none"/>
          </div>

          <div>
            <label class="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-1.5">Notas (opcional)</label>
            <textarea [(ngModel)]="manualNotas" rows="2" placeholder="Ex: Leitura do livro X"
              class="neo-input w-full rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none resize-none"></textarea>
          </div>
        </div>

        <div class="flex gap-3 pt-1">
          <button (click)="manualAddOpen = false" class="btn-neo flex-1 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
          <button (click)="saveManualSession()" [disabled]="manualHoras === 0 && manualMinutos === 0"
            class="btn-mesh flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            Salvar Sessão
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PomodoroComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  public pomodoroService = inject(PomodoroStateService);
  private supabase = inject(SupabaseService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sessionSub: Subscription | null = null;

  // ── Delegated Timer State ──
  get activeMode(): TimerMode { return this.pomodoroService.activeMode(); }
  get isRunning(): boolean { return this.pomodoroService.isRunning(); }
  get timeLeft(): number { return this.pomodoroService.timeLeft(); }
  get totalTime(): number { return this.pomodoroService.totalTime(); }
  get cicloAtual(): number { return this.pomodoroService.cicloAtual(); }
  get settings(): PomodoroSettings { return this.pomodoroService.settings(); }

  // ── Selectors (synced with service) ──
  get selectedEditalId(): string { return this.pomodoroService.selectedEditalId(); }
  set selectedEditalId(val: string) { this.pomodoroService.setSelectedEditalId(val); }

  get selectedDisciplina(): string { return this.pomodoroService.selectedDisciplina(); }
  set selectedDisciplina(val: string) { this.pomodoroService.setSelectedDisciplina(val); }

  editais: any[] = [];

  // ── Settings Modal ──
  settingsEdit: PomodoroSettings = { ...DEFAULT_SETTINGS };
  settingsOpen = false;

  // ── Stats ──
  sessions: any[] = [];
  weeklyChart: { label: string; shortLabel: string; totalMin: number; heightPct: number; isToday: boolean }[] = [];
  hoursByEdital: { edital_id: string; total_min: number }[] = [];
  totalMinToday = 0;
  totalMinWeek = 0;
  pomodorosToday = 0;
  sessionsToday = 0;
  showAllSessions = false;

  // ── Manual Add ──
  manualAddOpen = false;
  manualHoras = 0;
  manualMinutos = 30;
  manualData = '';
  manualEditalId = '';
  manualDisciplina = '';
  manualNotas = '';

  readonly modes = [
    { key: 'foco' as TimerMode, label: '🍅 Foco' },
    { key: 'pausa_curta' as TimerMode, label: '☕ Pausa Curta' },
    { key: 'pausa_longa' as TimerMode, label: '🌙 Pausa Longa' },
  ];

  get ciclosDots(): any[] {
    return this.pomodoroService.ciclosDots();
  }

  get modeColor(): string {
    return this.pomodoroService.modeColor();
  }

  get modeColorAlpha(): string {
    return this.pomodoroService.modeColorAlpha();
  }

  get modeEmoji(): string {
    return this.pomodoroService.modeEmoji();
  }

  get modeLabel(): string {
    return this.pomodoroService.modeLabel();
  }

  get displayTime(): string {
    return this.pomodoroService.displayTime();
  }

  get strokeDashoffset(): number {
    return this.pomodoroService.strokeDashoffset();
  }

  async ngOnInit() {
    await this.loadEditais();
    await this.refreshStats();
    this.manualData = new Date().toISOString().slice(0, 10);

    // pre-select edital from route param if passed
    const editalParam = this.route.snapshot.paramMap.get('editalId');
    if (editalParam && !this.selectedEditalId) {
      this.selectedEditalId = editalParam;
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Refresh stats whenever a session completes in the background
    this.sessionSub = this.pomodoroService.sessionCompleted$.subscribe(() => {
      this.refreshStats();
    });
  }

  ngOnDestroy() {
    if (this.sessionSub) {
      this.sessionSub.unsubscribe();
      this.sessionSub = null;
    }
  }

  // ── Timer Controls (delegated to PomodoroStateService) ──

  setMode(mode: TimerMode) {
    this.pomodoroService.setMode(mode);
  }

  resetTimer() {
    this.pomodoroService.resetTimer();
  }

  toggleTimer() {
    this.pomodoroService.toggleTimer();
  }

  skipTimer() {
    this.pomodoroService.skipTimer();
  }

  // ── Settings ──

  openSettings() {
    this.settingsEdit = { ...this.pomodoroService.settings() };
    this.settingsOpen = true;
  }

  closeSettings() {
    this.settingsOpen = false;
  }

  saveSettings() {
    this.pomodoroService.saveSettings(this.settingsEdit);
    this.settingsOpen = false;
  }

  resetSettingsToDefault() {
    this.settingsEdit = { ...DEFAULT_SETTINGS };
  }

  toggleSound() {
    this.pomodoroService.toggleSound();
  }

  async toggleNotifications() {
    await this.pomodoroService.toggleNotifications();
  }

  async toggleNotifSetting() {
    if (!this.settingsEdit.notificacoesAtivadas) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    }
    this.settingsEdit.notificacoesAtivadas = !this.settingsEdit.notificacoesAtivadas;
  }

  // ── Data ──

  async loadEditais() {
    try {
      this.apiService.getEditais().subscribe((res: any) => {
        this.editais = Array.isArray(res) ? res : (res?.data || res || []);
      });
    } catch (e) { console.error('Erro ao carregar editais:', e); }
  }

  async refreshStats() {
    const [sessions, weekly, byEdital] = await Promise.all([
      this.supabase.getStudySessions({ limite: 100 }),
      this.supabase.getWeeklyStudyHours(),
      this.supabase.getStudyHoursByEdital(),
    ]);

    this.sessions = sessions;
    this.hoursByEdital = byEdital;

    // Today stats
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySessions = sessions.filter(s => s.started_at.slice(0, 10) === todayStr);
    this.totalMinToday = todaySessions.reduce((sum, s) => sum + s.duracao_min, 0);
    this.pomodorosToday = todaySessions.filter(s => s.tipo === 'pomodoro').length;
    this.sessionsToday = todaySessions.length;

    // Weekly chart (last 7 days)
    const days: { label: string; shortLabel: string; totalMin: number; heightPct: number; isToday: boolean }[] = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = weekly.find(w => w.day_date === dateStr);
      days.push({
        label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        shortLabel: dayNames[d.getDay()],
        totalMin: found?.total_min || 0,
        heightPct: 0,
        isToday: dateStr === todayStr,
      });
    }
    this.totalMinWeek = days.reduce((sum, d) => sum + d.totalMin, 0);
    const maxMin = Math.max(...days.map(d => d.totalMin), 1);
    days.forEach(d => d.heightPct = Math.round((d.totalMin / maxMin) * 100));
    this.weeklyChart = days;
  }

  getEditalBarWidth(min: number): number {
    const max = Math.max(...this.hoursByEdital.map(h => h.total_min), 1);
    return Math.round((min / max) * 100);
  }

  getEditalTitle(editalId: string | null): string {
    if (!editalId) return '';
    const e = this.editais.find(x => x.id === editalId);
    return e?.title || editalId;
  }

  formatHorasMin(totalMin: number): string {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${String(m).padStart(2, '0')}min`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  // ── Manual Add ──

  openManualAdd() {
    this.manualHoras = 0;
    this.manualMinutos = 30;
    this.manualData = new Date().toISOString().slice(0, 10);
    this.manualEditalId = this.selectedEditalId;
    this.manualDisciplina = this.selectedDisciplina;
    this.manualNotas = '';
    this.manualAddOpen = true;
  }

  async saveManualSession() {
    const totalMin = (this.manualHoras * 60) + this.manualMinutos;
    if (totalMin <= 0) return;
    const startedAt = new Date(this.manualData + 'T12:00:00').toISOString();
    await this.supabase.saveStudySession({
      editalId: this.manualEditalId || null,
      disciplina: this.manualDisciplina || null,
      duracaoMin: totalMin,
      tipo: 'manual',
      notas: this.manualNotas || null,
      startedAt,
    });
    this.manualAddOpen = false;
    await this.refreshStats();
  }

  async deleteSession(id: string) {
    await this.supabase.deleteStudySession(id);
    await this.refreshStats();
  }

  // ── Navigation ──

  goBack() {
    if (window.history.length > 1) window.history.back();
    else this.router.navigate(['/student']);
  }
}
