import { Injectable, signal, computed, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { SupabaseService } from './supabase.service';

export type TimerMode = 'foco' | 'pausa_curta' | 'pausa_longa';

export interface PomodoroSettings {
  focoDuracao: number;
  pausaCurtaDuracao: number;
  pausaLongaDuracao: number;
  ciclosAtePausaLonga: number;
  somAtivado: boolean;
  notificacoesAtivadas: boolean;
  autoIniciarPausa: boolean;
  autoIniciarFoco: boolean;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focoDuracao: 25,
  pausaCurtaDuracao: 5,
  pausaLongaDuracao: 15,
  ciclosAtePausaLonga: 4,
  somAtivado: true,
  notificacoesAtivadas: true,
  autoIniciarPausa: false,
  autoIniciarFoco: false,
};

@Injectable({
  providedIn: 'root',
})
export class PomodoroStateService {
  private supabase = inject(SupabaseService);

  // ── Core Signals ──
  readonly activeMode = signal<TimerMode>('foco');
  readonly isRunning = signal<boolean>(false);
  readonly timeLeft = signal<number>(25 * 60);
  readonly totalTime = signal<number>(25 * 60);
  readonly cicloAtual = signal<number>(0);
  readonly settings = signal<PomodoroSettings>({ ...DEFAULT_SETTINGS });

  // ── Study session context ──
  readonly selectedEditalId = signal<string>('');
  readonly selectedDisciplina = signal<string>('');

  // ── Session completion event (for PomodoroComponent to reload stats) ──
  readonly sessionCompleted$ = new Subject<void>();

  // ── Internal Timer References ──
  private timerInterval: any = null;
  private sessionStartTime: Date | null = null;
  private audioCtx: AudioContext | null = null;

  // ── Computed Helpers ──
  readonly displayTime = computed(() => {
    const totalSecs = this.timeLeft();
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  // SVG circle circumference = 2 * π * r = 2 * π * 108 ≈ 678.6
  readonly strokeDashoffset = computed(() => {
    const total = this.totalTime();
    const progress = total > 0 ? this.timeLeft() / total : 1;
    return 678.6 * (1 - progress);
  });

  readonly progressPct = computed(() => {
    const total = this.totalTime();
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((total - this.timeLeft()) / total) * 100)));
  });

  readonly modeColor = computed(() => {
    const mode = this.activeMode();
    if (mode === 'foco') return '#433fe5';
    if (mode === 'pausa_curta') return '#00845a';
    return '#6b38d4';
  });

  readonly modeColorAlpha = computed(() => {
    const mode = this.activeMode();
    if (mode === 'foco') return 'rgba(67,63,229,0.4)';
    if (mode === 'pausa_curta') return 'rgba(0,132,90,0.4)';
    return 'rgba(107,56,212,0.4)';
  });

  readonly modeEmoji = computed(() => {
    const mode = this.activeMode();
    if (mode === 'foco') return '🍅';
    if (mode === 'pausa_curta') return '☕';
    return '🌙';
  });

  readonly modeLabel = computed(() => {
    const mode = this.activeMode();
    if (mode === 'foco') return 'Foco';
    if (mode === 'pausa_curta') return 'Pausa Curta';
    return 'Pausa Longa';
  });

  readonly hasActiveSession = computed(() => {
    return this.isRunning() || (this.timeLeft() < this.totalTime() && this.timeLeft() > 0);
  });

  readonly ciclosDots = computed(() => {
    return Array(this.settings().ciclosAtePausaLonga).fill(0);
  });

  constructor() {
    this.loadSettings();
    const initialSeconds = this.settings().focoDuracao * 60;
    this.totalTime.set(initialSeconds);
    this.timeLeft.set(initialSeconds);
  }

  // ── Settings ──

  loadSettings(): void {
    try {
      const stored = localStorage.getItem('pomodoro_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings.set({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      this.settings.set({ ...DEFAULT_SETTINGS });
    }
  }

  saveSettings(newSettings: PomodoroSettings): void {
    this.settings.set({ ...newSettings });
    localStorage.setItem('pomodoro_settings', JSON.stringify(newSettings));
    if (!this.isRunning()) {
      this.resetTimer();
    }
  }

  toggleSound(): void {
    const current = this.settings();
    const updated = { ...current, somAtivado: !current.somAtivado };
    this.settings.set(updated);
    localStorage.setItem('pomodoro_settings', JSON.stringify(updated));
  }

  async toggleNotifications(): Promise<void> {
    const current = this.settings();
    if (!current.notificacoesAtivadas) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
      }
    }
    const updated = { ...current, notificacoesAtivadas: !current.notificacoesAtivadas };
    this.settings.set(updated);
    localStorage.setItem('pomodoro_settings', JSON.stringify(updated));
  }

  // ── Timer Actions ──

  setMode(mode: TimerMode): void {
    if (this.isRunning()) this.stopTimer();
    this.activeMode.set(mode);
    this.resetTimer();
  }

  resetTimer(): void {
    this.stopTimer();
    const s = this.settings();
    const mode = this.activeMode();
    let seconds = s.focoDuracao * 60;
    if (mode === 'pausa_curta') seconds = s.pausaCurtaDuracao * 60;
    else if (mode === 'pausa_longa') seconds = s.pausaLongaDuracao * 60;

    this.totalTime.set(seconds);
    this.timeLeft.set(seconds);
    this.sessionStartTime = null;
    this.updateTitle();
  }

  toggleTimer(): void {
    if (this.isRunning()) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer(): void {
    this.isRunning.set(true);
    if (this.activeMode() === 'foco' && !this.sessionStartTime) {
      this.sessionStartTime = new Date();
    }
    this.initAudioContext();
    this.clearTimerInterval();
    this.timerInterval = setInterval(() => this.tick(), 1000);
    this.updateTitle();
  }

  stopTimer(): void {
    this.isRunning.set(false);
    this.clearTimerInterval();
    this.updateTitle();
  }

  skipTimer(): void {
    this.stopTimer();
    const mode = this.activeMode();
    const s = this.settings();

    if (mode === 'foco') {
      if (this.cicloAtual() >= s.ciclosAtePausaLonga - 1) {
        this.cicloAtual.set(0);
        this.setMode('pausa_longa');
      } else {
        this.setMode('pausa_curta');
      }
    } else {
      this.setMode('foco');
    }
  }

  private tick(): void {
    const currentLeft = this.timeLeft();
    if (currentLeft > 0) {
      this.timeLeft.set(currentLeft - 1);
      this.updateTitle();
    } else {
      this.onTimerComplete();
    }
  }

  private async onTimerComplete(): Promise<void> {
    this.stopTimer();
    this.playAlarm();
    this.sendNotification();

    const mode = this.activeMode();
    const s = this.settings();

    if (mode === 'foco') {
      // Save completed focus session
      const duracaoMin = s.focoDuracao;
      try {
        await this.supabase.saveStudySession({
          editalId: this.selectedEditalId() || null,
          disciplina: this.selectedDisciplina() || null,
          duracaoMin,
          tipo: 'pomodoro',
          startedAt: this.sessionStartTime?.toISOString(),
        });
      } catch (err) {
        console.error('Erro ao salvar sessão de estudo:', err);
      }

      const nextCiclo = this.cicloAtual() + 1;
      this.cicloAtual.set(nextCiclo);
      this.sessionCompleted$.next();

      // Transition to next break
      if (nextCiclo >= s.ciclosAtePausaLonga) {
        this.cicloAtual.set(0);
        this.setMode('pausa_longa');
        if (s.autoIniciarPausa) setTimeout(() => this.startTimer(), 500);
      } else {
        this.setMode('pausa_curta');
        if (s.autoIniciarPausa) setTimeout(() => this.startTimer(), 500);
      }
    } else {
      // Transition from break back to focus
      this.setMode('foco');
      this.sessionCompleted$.next();
      if (s.autoIniciarFoco) setTimeout(() => this.startTimer(), 500);
    }
  }

  // ── Context setters ──

  setSelectedEditalId(id: string): void {
    this.selectedEditalId.set(id);
  }

  setSelectedDisciplina(disciplina: string): void {
    this.selectedDisciplina.set(disciplina);
  }

  // ── Audio Alarm ──

  private initAudioContext(): void {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  playAlarm(): void {
    if (!this.settings().somAtivado) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const pattern = this.activeMode() === 'foco'
        ? [{ freq: 880, dur: 0.15 }, { freq: 1100, dur: 0.15 }, { freq: 880, dur: 0.15 }, { freq: 1100, dur: 0.3 }]
        : [{ freq: 660, dur: 0.2 }, { freq: 880, dur: 0.4 }];

      let offset = this.audioCtx.currentTime + 0.05;
      for (const { freq, dur } of pattern) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, offset);
        gain.gain.exponentialRampToValueAtTime(0.001, offset + dur);
        osc.start(offset);
        osc.stop(offset + dur + 0.05);
        offset += dur + 0.05;
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // ── Notifications ──

  sendNotification(): void {
    if (!this.settings().notificacoesAtivadas) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const isFoco = this.activeMode() === 'foco';
    const title = isFoco ? '🍅 Pomodoro Concluído!' : '☕ Pausa Finalizada!';
    const body = isFoco ? 'Ótimo trabalho! Hora de descansar.' : 'Hora de voltar ao foco! 💪';
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (e) {
      console.warn('Notification error:', e);
    }
  }

  private updateTitle(): void {
    if (this.isRunning()) {
      document.title = `${this.displayTime()} — ${this.modeLabel()} 🍅`;
    } else if (this.hasActiveSession()) {
      document.title = `⏸ ${this.displayTime()} — Pomodoro`;
    } else {
      document.title = 'Aprovando Tech';
    }
  }

  private clearTimerInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
