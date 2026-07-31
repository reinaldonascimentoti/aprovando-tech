import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="min-h-screen flex items-center justify-center p-4 sm:p-8 relative z-10 bg-[#f7f9fc]">
      <!-- Floating Background Neo Elements -->
      <div class="absolute top-10 left-10 hidden lg:block">
        <div class="neo-raised w-28 h-28 rounded-3xl flex items-center justify-center text-primary transition-transform hover:scale-105">
          <span class="material-symbols-outlined !text-[44px] text-[#433fe5]">trending_up</span>
        </div>
      </div>
      <div class="absolute bottom-12 right-12 hidden lg:block">
        <div class="neo-raised w-36 h-36 rounded-[36px] flex items-center justify-center text-secondary transition-transform hover:scale-105">
          <span class="material-symbols-outlined !text-[56px] text-[#6b38d4]">psychology</span>
        </div>
      </div>

      <!-- Main Login Card -->
      <div class="neo-raised w-full max-w-[460px] rounded-[32px] p-8 flex flex-col items-center">
        <!-- Logo Section -->
        <div class="mb-8 flex flex-col items-center gap-2">
          <div class="neo-raised w-20 h-20 rounded-2xl flex items-center justify-center text-[#433fe5]">
            <span class="material-symbols-outlined !text-[48px] filled">account_tree</span>
          </div>
          <h1 class="text-3xl font-extrabold text-[#4643e9] tracking-tight mt-2">Aprovando Tech</h1>
          <p class="text-sm font-medium text-[#464556] text-center px-2">Análise de precisão para excelência acadêmica e concursos</p>
        </div>

        <!-- Role Toggle (Aluno / Admin) -->
        <div class="w-full neo-pressed p-1.5 rounded-2xl flex relative mb-6">
          <button 
            type="button"
            (click)="selectedRole = 'user'"
            [class.neo-raised]="selectedRole === 'user'"
            [class.text-[#433fe5]]="selectedRole === 'user'"
            [class.font-bold]="selectedRole === 'user'"
            class="flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-[#464556]">
            <span class="material-symbols-outlined !text-[18px]">school</span>
            <span>Aluno</span>
          </button>
          <button 
            type="button"
            (click)="selectedRole = 'admin'"
            [class.neo-raised]="selectedRole === 'admin'"
            [class.text-[#433fe5]]="selectedRole === 'admin'"
            [class.font-bold]="selectedRole === 'admin'"
            class="flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-[#464556]">
            <span class="material-symbols-outlined !text-[18px]">admin_panel_settings</span>
            <span>Administrador</span>
          </button>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="handleAuth()" class="w-full space-y-5">
          <div class="space-y-1.5" *ngIf="isRegister">
            <label class="text-xs font-semibold text-[#464556] ml-2">Nome Completo</label>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#767587]">person</span>
              <input 
                [(ngModel)]="fullName" 
                name="fullName"
                type="text" 
                placeholder="Seu Nome Completo"
                class="neo-pressed w-full h-14 pl-12 pr-4 rounded-2xl border-none focus:ring-2 focus:ring-[#433fe5]/20 bg-transparent text-base outline-none text-[#191c1e]">
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#464556] ml-2">E-mail Institucional</label>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#767587]">mail</span>
              <input 
                [(ngModel)]="email" 
                name="email"
                type="email" 
                required
                [placeholder]="selectedRole === 'admin' ? 'admin@aprovando.tech' : 'alex.rivers@university.edu'"
                class="neo-pressed w-full h-14 pl-12 pr-4 rounded-2xl border-none focus:ring-2 focus:ring-[#433fe5]/20 bg-transparent text-base outline-none text-[#191c1e]">
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between items-center px-2">
              <label class="text-xs font-semibold text-[#464556]">Senha</label>
              <a href="#" (click)="$event.preventDefault()" class="text-xs font-semibold text-[#433fe5] hover:underline">Esqueceu?</a>
            </div>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#767587]">lock</span>
              <input 
                [(ngModel)]="password" 
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                class="neo-pressed w-full h-14 pl-12 pr-4 rounded-2xl border-none focus:ring-2 focus:ring-[#433fe5]/20 bg-transparent text-base outline-none text-[#191c1e]">
              <button 
                type="button" 
                (click)="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-[#767587] hover:text-[#191c1e] transition-colors">
                <span class="material-symbols-outlined">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="neo-pressed rounded-xl p-3 text-sm text-red-600 font-medium">
            <span class="material-symbols-outlined text-[16px] align-middle mr-1">error</span>
            {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button 
              type="submit" 
              [disabled]="isLoading"
              class="btn-mesh w-full h-14 rounded-2xl text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg">
              <span>{{ isLoading ? 'Aguarde...' : (isRegister ? 'Criar Conta' : 'Entrar no Painel') }}</span>
              <span class="material-symbols-outlined">{{ isLoading ? 'sync' : 'arrow_forward' }}</span>
            </button>
          </div>
        </form>

        <!-- Toggle Login / Register -->
        <div class="mt-6 text-center">
          <p class="text-sm font-medium text-[#464556]">
            {{ isRegister ? 'Já possui uma conta?' : 'Novo na Aprovando Tech?' }}
            <button (click)="toggleMode()" class="text-[#433fe5] font-bold hover:underline ml-1">
              {{ isRegister ? 'Fazer Login' : 'Criar Conta' }}
            </button>
          </p>
        </div>
      </div>
    </main>
  `
})
export class LoginComponent {
  selectedRole: 'user' | 'admin' = 'user';
  email = '';
  password = '';
  fullName = '';
  showPassword = false;
  isRegister = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.errorMessage = '';
  }

  async handleAuth() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha e-mail e senha.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (this.isRegister) {
        const user = await this.authService.signup(
          this.email, this.password, this.fullName, this.selectedRole
        );
        this.redirectUser(user.role);
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

  private redirectUser(role: string) {
    if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/student']);
    }
  }
}
