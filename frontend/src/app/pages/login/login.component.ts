import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="min-h-screen flex items-center justify-center p-4 sm:p-8 relative z-10 bg-[var(--background)] text-[var(--on-surface)] transition-colors duration-300">
      <!-- Back to Home Top Left Button / Floating Neo Element -->
      <div class="absolute top-6 left-6 sm:top-10 sm:left-10">
        <a routerLink="/" class="neo-raised px-4 py-3 sm:w-auto rounded-2xl flex items-center gap-2.5 text-[var(--primary)] transition-transform hover:scale-105 cursor-pointer no-underline group" title="Voltar para a Página Inicial">
          <span class="material-symbols-outlined !text-[24px] sm:!text-[28px] text-[var(--primary)]">trending_up</span>
          <span class="text-xs sm:text-sm font-extrabold text-[var(--on-surface-variant)] group-hover:text-[var(--primary)] transition-colors">Voltar ao Início</span>
        </a>
      </div>

      <!-- Theme Toggle Top Right Button -->
      <div class="absolute top-6 right-6 sm:top-10 sm:right-10">
        <button 
          type="button" 
          (click)="themeService.toggle()"
          class="neo-raised w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-all hover:scale-105 cursor-pointer border-none"
          [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'">
          <span class="material-symbols-outlined !text-[24px]">
            {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>
      </div>

      <div class="absolute bottom-12 right-12 hidden lg:block">
        <div class="neo-raised w-36 h-36 rounded-[36px] flex items-center justify-center text-[var(--secondary)] transition-transform hover:scale-105">
          <span class="material-symbols-outlined !text-[56px] text-[var(--secondary)]">psychology</span>
        </div>
      </div>

      <!-- Main Login Card -->
      <div class="neo-raised w-full max-w-[460px] rounded-[32px] p-8 flex flex-col items-center mt-12 sm:mt-0">
        <!-- Logo Section (Clickable to Home) -->
        <a routerLink="/" class="mb-6 flex flex-col items-center gap-3 no-underline cursor-pointer group" title="Ir para a Página Inicial">
          <div class="w-24 h-24 flex items-center justify-center transition-transform group-hover:scale-105">
            <img src="assets/logo.png" alt="Logo Aprovando Tech" style="width: 100px; height: auto; object-fit: contain;
  filter: drop-shadow(2px 4px 4px rgba(109, 40, 217, 0.65));"/>
          </div>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="text-2xl font-extrabold text-[var(--on-surface)] tracking-tight">APROVANDO</span>
            <span class="text-2xl font-extrabold text-[var(--primary)] tracking-tight">TECH</span>
          </div>
          <p class="text-xs font-medium text-[var(--on-surface-variant)] text-center px-2">Análise de precisão para excelência acadêmica e concursos</p>
        </a>

        <!-- ===== E-MAIL PENDING CONFIRMATION STATE ===== -->
        <div *ngIf="emailPending" class="w-full flex flex-col items-center gap-5 animate-fade-in">
          <!-- Icon -->
          <div class="w-20 h-20 rounded-[28px] flex items-center justify-center"
               style="background: linear-gradient(135deg, #5d3bf620 0%, #7c3aed20 100%); border: 2px solid var(--primary);">
            <span class="material-symbols-outlined !text-[44px] text-[var(--primary)] filled">mark_email_unread</span>
          </div>

          <!-- Title -->
          <div class="text-center space-y-1.5">
            <h2 class="text-xl font-black text-[var(--on-surface)]">Confirme seu e-mail</h2>
            <p class="text-sm text-[var(--on-surface-variant)] leading-relaxed">
              Enviamos um link de confirmação para<br>
              <strong class="text-[var(--primary)]">{{ email }}</strong>
            </p>
            <p class="text-xs text-[var(--on-surface-variant)]/70 leading-relaxed">
              Verifique sua caixa de entrada (e a pasta de spam) e clique no link para ativar sua conta.
            </p>
          </div>

          <!-- Resend feedback -->
          <div *ngIf="resendMessage" 
               class="flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 border w-full"
               [style.color]="resendSuccess ? '#16a34a' : '#dc2626'"
               [style.border-color]="resendSuccess ? '#16a34a50' : '#dc262650'"
               [style.background]="resendSuccess ? '#16a34a10' : '#dc262610'">
            <span class="material-symbols-outlined !text-[16px]">{{ resendSuccess ? 'check_circle' : 'error' }}</span>
            <span>{{ resendMessage }}</span>
          </div>

          <!-- Resend Button -->
          <button 
            id="btn-resend-email"
            type="button"
            (click)="resendEmail()"
            [disabled]="isResending || resendCooldown > 0"
            class="btn-mesh w-full h-13 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all">
            <span class="material-symbols-outlined !text-[18px]">{{ isResending ? 'sync' : 'send' }}</span>
            <span *ngIf="!isResending && resendCooldown === 0">Reenviar e-mail de confirmação</span>
            <span *ngIf="isResending">Enviando...</span>
            <span *ngIf="!isResending && resendCooldown > 0">Reenviar novamente em {{ resendCooldown }}s</span>
          </button>

          <!-- Skip Button -->
          <button 
            id="btn-confirm-later"
            type="button"
            (click)="skipConfirmation()"
            class="w-full h-11 rounded-2xl text-xs font-semibold text-[var(--on-surface-variant)] hover:text-[var(--primary)] border border-[var(--outline-variant)] hover:border-[var(--primary)] transition-all flex items-center justify-center gap-2 bg-transparent cursor-pointer">
            <span class="material-symbols-outlined !text-[16px]">schedule</span>
            <span>Confirmar mais tarde — Entrar no painel agora</span>
          </button>

          <!-- Back to login -->
          <button
            type="button"
            (click)="backToLogin()"
            class="text-xs text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1">
            <span class="material-symbols-outlined !text-[14px]">arrow_back</span>
            Voltar ao login
          </button>
        </div>

        <!-- ===== LOGIN / REGISTER FORM ===== -->
        <form *ngIf="!emailPending" (ngSubmit)="handleAuth()" class="w-full space-y-5">
          <div class="space-y-1.5" *ngIf="isRegister">
            <label class="text-xs font-bold text-[var(--on-surface)] ml-2">Nome Completo</label>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors">person</span>
              <input 
                [(ngModel)]="fullName" 
                name="fullName"
                type="text" 
                placeholder="Seu Nome Completo"
                class="neo-input w-full h-14 pl-12 pr-4 rounded-2xl text-base text-[var(--on-surface)] bg-[var(--surface-container-low)]">
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-[var(--on-surface)] ml-2">{{ isRegister ? 'E-mail' : 'E-mail Institucional' }}</label>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors">mail</span>
              <input 
                [(ngModel)]="email" 
                name="email"
                type="email" 
                required
                [placeholder]="isRegister ? 'seu@email.com' : 'seu.email@exemplo.com'"
                class="neo-input w-full h-14 pl-12 pr-4 rounded-2xl text-base text-[var(--on-surface)] bg-[var(--surface-container-low)]">
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between items-center px-2">
              <label class="text-xs font-bold text-[var(--on-surface)]">Senha</label>
              <a *ngIf="!isRegister" href="#" (click)="forgotPassword($event)" class="text-xs font-semibold text-[var(--primary)] hover:underline">Esqueceu?</a>
            </div>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors">lock</span>
              <input 
                [(ngModel)]="password" 
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                class="neo-input w-full h-14 pl-12 pr-12 rounded-2xl text-base text-[var(--on-surface)] bg-[var(--surface-container-low)]">
              <button 
                type="button" 
                (click)="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--outline)] hover:text-[var(--on-surface)] transition-colors border-none bg-transparent cursor-pointer">
                <span class="material-symbols-outlined">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="rounded-xl p-3 text-sm text-[var(--error)] font-medium flex items-center gap-2 border border-[var(--error)]/30 bg-[var(--error-container)]/20">
            <span class="material-symbols-outlined text-[18px]">error</span>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Forgot password success -->
          <div *ngIf="forgotPasswordSent" class="rounded-xl p-3 text-sm font-medium flex items-center gap-2 border"
               style="border-color: #16a34a50; background: #16a34a10; color: #16a34a;">
            <span class="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Link de redefinição enviado para <strong>{{ email }}</strong></span>
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button 
              id="btn-auth-submit"
              type="submit" 
              [disabled]="isLoading"
              class="btn-mesh w-full h-14 rounded-2xl text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-60 transition-all">
              <span>{{ isLoading ? 'Aguarde...' : (isRegister ? 'Criar Conta' : 'Entrar no Painel') }}</span>
              <span class="material-symbols-outlined">{{ isLoading ? 'sync' : 'arrow_forward' }}</span>
            </button>
          </div>

          <!-- Divider -->
          <div class="relative flex py-2 items-center">
            <div class="flex-grow border-t border-[var(--outline-variant)]"></div>
            <span class="flex-shrink mx-4 text-[11px] font-bold text-[var(--outline)] uppercase tracking-wider">ou continue com</span>
            <div class="flex-grow border-t border-[var(--outline-variant)]"></div>
          </div>

          <!-- Google Social Login Button -->
          <div>
            <button 
              id="btn-google-login"
              type="button" 
              (click)="loginWithGoogle()"
              [disabled]="isLoading"
              class="w-full h-14 rounded-2xl border border-[var(--outline-variant)] hover:border-[var(--primary)] bg-[var(--surface)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface)] text-sm font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm disabled:opacity-60">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{{ isRegister ? 'Cadastrar com o Google' : 'Entrar com o Google' }}</span>
            </button>
          </div>
        </form>

        <!-- Toggle Login / Register -->
        <div *ngIf="!emailPending" class="mt-6 text-center">
          <p class="text-sm font-medium text-[var(--on-surface-variant)]">
            {{ isRegister ? 'Já possui uma conta?' : 'Novo na Aprovando Tech?' }}
            <button (click)="toggleMode()" class="text-[var(--primary)] font-bold hover:underline ml-1 border-none bg-transparent cursor-pointer">
              {{ isRegister ? 'Fazer Login' : 'Criar Conta' }}
            </button>
          </p>
        </div>
      </div>
    </main>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.4s ease both; }
    .h-13 { height: 3.25rem; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  fullName = '';
  showPassword = false;
  isRegister = false;
  isLoading = false;
  errorMessage = '';

  // Email pending confirmation state
  emailPending = false;
  isResending = false;
  resendMessage = '';
  resendSuccess = false;
  resendCooldown = 0;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  // Forgot password
  forgotPasswordSent = false;

  public themeService = inject(ThemeService);

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.errorMessage = '';
    this.forgotPasswordSent = false;
  }

  async handleAuth() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha e-mail e senha.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.forgotPasswordSent = false;

    try {
      if (this.isRegister) {
        const result = await this.supabaseService.signUp(this.email, this.password, this.fullName);
        // If no session → e-mail confirmation required
        if (!result.session) {
          this.emailPending = true;
          this.startResendCooldown();
        } else {
          // Session available → e-mail confirmation disabled on Supabase, go straight in
          const profile = {
            id: result.user!.id,
            email: result.user!.email ?? this.email,
            full_name: this.fullName || this.email.split('@')[0],
            role: 'user' as const,
          };
          this.authService.setUser(profile);
          this.router.navigate(['/student']);
        }
      } else {
        const user = await this.authService.login(this.email, this.password);
        this.redirectUser(user.role);
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'Erro de autenticação. Verifique suas credenciais.';
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const user = await this.authService.loginWithGoogle();
      this.redirectUser(user.role);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        // Usuário fechou o pop-up, sem mensagem de erro intrusiva
        return;
      }
      this.errorMessage = err.message || 'Erro ao autenticar com o Google. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }

  async resendEmail() {
    if (this.isResending || this.resendCooldown > 0) return;
    this.isResending = true;
    this.resendMessage = '';
    try {
      await this.supabaseService.resendConfirmationEmail(this.email);
      this.resendSuccess = true;
      this.resendMessage = 'E-mail reenviado com sucesso! Verifique sua caixa de entrada.';
      this.startResendCooldown();
    } catch (err: any) {
      this.resendSuccess = false;
      this.resendMessage = err.message || 'Erro ao reenviar. Tente novamente em instantes.';
    } finally {
      this.isResending = false;
      setTimeout(() => { this.resendMessage = ''; }, 6000);
    }
  }

  skipConfirmation() {
    // Navigate to student dashboard; email_verified warning shown in profile tab
    this.router.navigate(['/student']);
  }

  backToLogin() {
    this.emailPending = false;
    this.isRegister = false;
    this.password = '';
    this.resendMessage = '';
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
    this.resendCooldown = 0;
  }

  async forgotPassword(event: Event) {
    event.preventDefault();
    if (!this.email) {
      this.errorMessage = 'Digite seu e-mail acima para redefinir a senha.';
      return;
    }
    this.errorMessage = '';
    try {
      await this.supabaseService.sendPasswordReset(this.email);
      this.forgotPasswordSent = true;
    } catch (err: any) {
      this.errorMessage = err.message || 'Erro ao enviar e-mail de redefinição.';
    }
  }

  private redirectUser(role: string) {
    if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/student']);
    }
  }

  private startResendCooldown(seconds = 60) {
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
