import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-profile-in">

      <!-- ====== HEADER ====== -->
      <div class="neo-raised rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative overflow-hidden">
        <div class="absolute -top-12 -right-12 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-[var(--secondary)]/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Avatar -->
        <div class="relative z-10 shrink-0">
          <div class="w-20 h-20 rounded-[28px] flex items-center justify-center text-3xl font-black text-white shadow-xl"
               style="background: linear-gradient(135deg, #5d3bf6, #7c3aed);">
            {{ getInitials() }}
          </div>
          <div class="absolute -bottom-2 -right-2 w-7 h-7 rounded-full border-2 border-[var(--background)] flex items-center justify-center shadow-md"
               [style.background]="emailConfirmed ? '#16a34a' : '#f59e0b'">
            <span class="material-symbols-outlined !text-[14px] text-white">
              {{ emailConfirmed ? 'verified' : 'schedule' }}
            </span>
          </div>
        </div>

        <!-- User info -->
        <div class="relative z-10 flex-1 text-center sm:text-left min-w-0">
          <h2 class="text-xl font-black text-[var(--on-surface)] truncate">{{ user?.full_name || 'Sem nome' }}</h2>
          <p class="text-sm text-[var(--on-surface-variant)] truncate mt-0.5">{{ user?.email }}</p>
          <div class="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
                  [style.background]="user?.role === 'admin' ? 'rgba(124,58,237,0.15)' : 'rgba(99,102,241,0.12)'"
                  [style.color]="user?.role === 'admin' ? '#7c3aed' : '#6366f1'">
              <span class="material-symbols-outlined !text-[12px]">{{ user?.role === 'admin' ? 'admin_panel_settings' : 'school' }}</span>
              {{ user?.role === 'admin' ? 'Administrador' : 'Estudante' }}
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
                  [style.background]="emailConfirmed ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)'"
                  [style.color]="emailConfirmed ? '#16a34a' : '#d97706'">
              <span class="material-symbols-outlined !text-[12px]">{{ emailConfirmed ? 'mark_email_read' : 'mark_email_unread' }}</span>
              {{ emailConfirmed ? 'E-mail verificado' : 'E-mail nao verificado' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ====== PERSONAL DATA ====== -->
      <div class="neo-raised rounded-3xl p-6 space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-[var(--outline-variant)]/40">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background: linear-gradient(135deg, #5d3bf620, #7c3aed20); border: 1px solid var(--primary);">
            <span class="material-symbols-outlined !text-[18px] text-[var(--primary)]">manage_accounts</span>
          </div>
          <div>
            <h3 class="text-sm font-black text-[var(--on-surface)]">Dados Pessoais</h3>
            <p class="text-[11px] text-[var(--on-surface-variant)]">Informacoes da sua conta</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-[var(--on-surface-variant)] ml-1">Nome Completo</label>
          <div class="relative group">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors text-[20px]">person</span>
            <input
              id="profile-full-name"
              [(ngModel)]="editName"
              [disabled]="isSavingName"
              type="text"
              class="neo-input w-full h-12 pl-11 pr-28 rounded-2xl text-sm"
              placeholder="Seu nome completo">
            <button
              type="button"
              (click)="saveName()"
              [disabled]="isSavingName || !editName.trim() || editName === user?.full_name"
              class="absolute right-3 top-1/2 -translate-y-1/2 h-7 px-3 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
              style="background: var(--primary); color: white;">
              {{ isSavingName ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-[var(--on-surface-variant)] ml-1">E-mail</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline)] text-[20px]">mail</span>
            <input
              type="email"
              [value]="user?.email || ''"
              disabled
              class="neo-input w-full h-12 pl-11 pr-4 rounded-2xl text-sm opacity-70 cursor-not-allowed">
          </div>
          <p class="text-[10px] text-[var(--on-surface-variant)]/60 ml-1">O e-mail nao pode ser alterado diretamente.</p>
        </div>

        <div *ngIf="nameFeedback"
             class="flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 border"
             [style.color]="nameSaved ? '#16a34a' : '#dc2626'"
             [style.border-color]="nameSaved ? '#16a34a40' : '#dc262640'"
             [style.background]="nameSaved ? '#16a34a0d' : '#dc26260d'">
          <span class="material-symbols-outlined !text-[15px]">{{ nameSaved ? 'check_circle' : 'error' }}</span>
          {{ nameFeedback }}
        </div>
      </div>

      <!-- ====== EMAIL CONFIRMATION ====== -->
      <div class="neo-raised rounded-3xl p-6 space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-[var(--outline-variant)]/40">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               [style.background]="emailConfirmed ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)'"
               [style.border]="emailConfirmed ? '1px solid #16a34a60' : '1px solid #d9770660'">
            <span class="material-symbols-outlined !text-[18px]"
                  [style.color]="emailConfirmed ? '#16a34a' : '#d97706'">
              {{ emailConfirmed ? 'mark_email_read' : 'mark_email_unread' }}
            </span>
          </div>
          <div>
            <h3 class="text-sm font-black text-[var(--on-surface)]">Verificacao de E-mail</h3>
            <p class="text-[11px] text-[var(--on-surface-variant)]">Status da confirmacao da sua conta</p>
          </div>
        </div>

        <div *ngIf="emailConfirmed" class="flex items-center gap-3 p-4 rounded-2xl" style="background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);">
          <span class="material-symbols-outlined !text-[28px] shrink-0" style="color: #16a34a;">verified_user</span>
          <div>
            <p class="text-sm font-bold" style="color: #16a34a;">E-mail verificado com sucesso</p>
            <p class="text-xs" style="color: #16a34a80;">Sua conta esta completamente ativa e segura.</p>
          </div>
        </div>

        <div *ngIf="!emailConfirmed" class="space-y-4">
          <div class="flex items-start gap-3 p-4 rounded-2xl" style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
            <span class="material-symbols-outlined !text-[28px] shrink-0" style="color: #d97706;">warning</span>
            <div>
              <p class="text-sm font-bold" style="color: #d97706;">E-mail ainda nao verificado</p>
              <p class="text-xs" style="color: #9a7c2e;">Confirme seu e-mail para garantir o acesso pleno a sua conta.</p>
            </div>
          </div>

          <div *ngIf="emailFeedback"
               class="flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 border"
               [style.color]="emailSent ? '#16a34a' : '#dc2626'"
               [style.border-color]="emailSent ? '#16a34a40' : '#dc262640'"
               [style.background]="emailSent ? '#16a34a0d' : '#dc26260d'">
            <span class="material-symbols-outlined !text-[15px]">{{ emailSent ? 'check_circle' : 'error' }}</span>
            {{ emailFeedback }}
          </div>

          <button
            id="profile-btn-resend-confirmation"
            type="button"
            (click)="resendConfirmation()"
            [disabled]="isResendingConfirmation || resendCooldown > 0"
            class="btn-mesh w-full h-11 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all">
            <span class="material-symbols-outlined !text-[17px]">{{ isResendingConfirmation ? 'sync' : 'send' }}</span>
            <span *ngIf="!isResendingConfirmation && resendCooldown === 0">Reenviar e-mail de confirmacao</span>
            <span *ngIf="isResendingConfirmation">Enviando...</span>
            <span *ngIf="!isResendingConfirmation && resendCooldown > 0">Reenviar novamente em {{ resendCooldown }}s</span>
          </button>
        </div>
      </div>

      <!-- ====== SECURITY ====== -->
      <div class="neo-raised rounded-3xl p-6 space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-[var(--outline-variant)]/40">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);">
            <span class="material-symbols-outlined !text-[18px]" style="color: #6366f1;">shield_lock</span>
          </div>
          <div>
            <h3 class="text-sm font-black text-[var(--on-surface)]">Seguranca</h3>
            <p class="text-[11px] text-[var(--on-surface-variant)]">Gerencie sua senha e acesso</p>
          </div>
        </div>

        <div *ngIf="resetFeedback"
             class="flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 border"
             [style.color]="resetSent ? '#16a34a' : '#dc2626'"
             [style.border-color]="resetSent ? '#16a34a40' : '#dc262640'"
             [style.background]="resetSent ? '#16a34a0d' : '#dc26260d'">
          <span class="material-symbols-outlined !text-[15px]">{{ resetSent ? 'check_circle' : 'error' }}</span>
          {{ resetFeedback }}
        </div>

        <button
          id="profile-btn-reset-password"
          type="button"
          (click)="sendPasswordReset()"
          [disabled]="isResettingPassword"
          class="w-full h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-transparent"
          style="border-color: var(--outline-variant); color: var(--on-surface-variant);">
          <span class="material-symbols-outlined !text-[18px]">lock_reset</span>
          {{ isResettingPassword ? 'Enviando e-mail...' : 'Redefinir senha por e-mail' }}
        </button>
      </div>

      <!-- ====== ACCOUNT ====== -->
      <div class="neo-raised rounded-3xl p-6 space-y-3">
        <div class="flex items-center gap-3 pb-3 border-b border-[var(--outline-variant)]/40">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2);">
            <span class="material-symbols-outlined !text-[18px] text-red-500">person_off</span>
          </div>
          <div>
            <h3 class="text-sm font-black text-[var(--on-surface)]">Conta</h3>
            <p class="text-[11px] text-[var(--on-surface-variant)]">Acoes de sessao</p>
          </div>
        </div>

        <button
          id="profile-btn-logout"
          type="button"
          (click)="logout()"
          class="w-full h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer"
          style="background: rgba(220,38,38,0.06); border-color: rgba(220,38,38,0.25); color: #dc2626;">
          <span class="material-symbols-outlined !text-[18px]">logout</span>
          Sair da conta
        </button>
      </div>

    </div>
  `,
  styles: [` 
    @keyframes profile-in {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-profile-in { animation: profile-in 0.35s ease both; }
  `]
})
export class UserProfileComponent implements OnInit {
  @Input() user: UserProfile | null = null;

  editName = '';
  isSavingName = false;
  nameFeedback = '';
  nameSaved = false;

  emailConfirmed = false;
  isResendingConfirmation = false;
  resendCooldown = 0;
  emailFeedback = '';
  emailSent = false;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  isResettingPassword = false;
  resetFeedback = '';
  resetSent = false;

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.editName = this.user?.full_name || '';
    this.emailConfirmed = this.supabaseService.isEmailConfirmed();
  }

  getInitials(): string {
    const name = this.user?.full_name || this.user?.email || '?';
    return name.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();
  }

  async saveName() {
    if (!this.editName.trim() || this.editName === this.user?.full_name) return;
    this.isSavingName = true;
    this.nameFeedback = '';
    try {
      await this.authService.updateProfile(this.editName.trim());
      this.nameSaved = true;
      this.nameFeedback = 'Nome atualizado com sucesso!';
      this.user = this.authService.getCurrentUser();
    } catch (err: any) {
      this.nameSaved = false;
      this.nameFeedback = err.message || 'Erro ao atualizar nome.';
    } finally {
      this.isSavingName = false;
      setTimeout(() => { this.nameFeedback = ''; }, 5000);
    }
  }

  async resendConfirmation() {
    if (this.isResendingConfirmation || this.resendCooldown > 0) return;
    this.isResendingConfirmation = true;
    this.emailFeedback = '';
    try {
      await this.supabaseService.resendConfirmationEmail(this.user?.email || '');
      this.emailSent = true;
      this.emailFeedback = 'E-mail de confirmacao reenviado! Verifique sua caixa de entrada.';
      this.startCooldown();
    } catch (err: any) {
      this.emailSent = false;
      this.emailFeedback = err.message || 'Erro ao reenviar. Tente novamente.';
    } finally {
      this.isResendingConfirmation = false;
      setTimeout(() => { this.emailFeedback = ''; }, 6000);
    }
  }

  async sendPasswordReset() {
    if (this.isResettingPassword) return;
    this.isResettingPassword = true;
    this.resetFeedback = '';
    try {
      await this.supabaseService.sendPasswordReset(this.user?.email || '');
      this.resetSent = true;
      this.resetFeedback = 'Link de redefincao enviado! Verifique seu e-mail.';
    } catch (err: any) {
      this.resetSent = false;
      this.resetFeedback = err.message || 'Erro ao enviar e-mail de redefincao.';
    } finally {
      this.isResettingPassword = false;
      setTimeout(() => { this.resetFeedback = ''; }, 7000);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private startCooldown(seconds = 60) {
    this.resendCooldown = seconds;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval!);
        this.cooldownInterval = null;
      }
    }, 1000);
  }
}
