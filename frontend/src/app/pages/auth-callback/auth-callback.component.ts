import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] text-[var(--on-surface)]">
      <div class="neo-raised w-full max-w-sm rounded-[28px] p-8 flex flex-col items-center gap-5 text-center">

        <!-- Loading state -->
        <ng-container *ngIf="status === 'loading'">
          <div class="w-16 h-16 rounded-[20px] flex items-center justify-center"
               style="background: linear-gradient(135deg, #5d3bf620 0%, #7c3aed20 100%); border: 2px solid var(--primary);">
            <span class="material-symbols-outlined !text-[36px] text-[var(--primary)] animate-spin-slow">sync</span>
          </div>
          <div>
            <h2 class="text-lg font-black text-[var(--on-surface)]">Verificando seu e-mail...</h2>
            <p class="text-sm text-[var(--on-surface-variant)] mt-1">Aguarde um momento.</p>
          </div>
        </ng-container>

        <!-- Success state -->
        <ng-container *ngIf="status === 'success'">
          <div class="w-16 h-16 rounded-[20px] flex items-center justify-center"
               style="background: #16a34a15; border: 2px solid #16a34a;">
            <span class="material-symbols-outlined !text-[36px]" style="color: #16a34a;">verified</span>
          </div>
          <div>
            <h2 class="text-lg font-black text-[var(--on-surface)]">E-mail confirmado! 🎉</h2>
            <p class="text-sm text-[var(--on-surface-variant)] mt-1">Sua conta está ativa. Redirecionando...</p>
          </div>
        </ng-container>

        <!-- Error state -->
        <ng-container *ngIf="status === 'error'">
          <div class="w-16 h-16 rounded-[20px] flex items-center justify-center"
               style="background: #dc262615; border: 2px solid #dc2626;">
            <span class="material-symbols-outlined !text-[36px]" style="color: #dc2626;">error</span>
          </div>
          <div>
            <h2 class="text-lg font-black text-[var(--on-surface)]">Link inválido ou expirado</h2>
            <p class="text-sm text-[var(--on-surface-variant)] mt-1 leading-relaxed">
              {{ errorMessage }}
            </p>
          </div>
          <button
            type="button"
            (click)="goToLogin()"
            class="btn-mesh w-full h-12 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg">
            <span class="material-symbols-outlined !text-[18px]">arrow_back</span>
            <span>Voltar ao Login</span>
          </button>
        </ng-container>

      </div>
    </main>
  `,
  styles: [`
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .animate-spin-slow { animation: spin-slow 1.2s linear infinite; }
  `]
})
export class AuthCallbackComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  errorMessage = 'O link pode ter expirado. Solicite um novo e-mail de confirmação na tela de login.';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async ngOnInit() {
    try {
      await this.processCallback();
    } catch (err: any) {
      this.status = 'error';
      if (err?.message) {
        this.errorMessage = err.message;
      }
    }
  }

  private async processCallback() {
    const params = this.route.snapshot.queryParamMap;
    const tokenHash = params.get('token_hash');
    const type = params.get('type') as 'email' | 'recovery' | 'signup' | null;

    // --- Flow 1: PKCE with token_hash (recommended Supabase flow) ---
    if (tokenHash && type) {
      const { data, error } = await this.supabaseService.client.auth.verifyOtp({
        token_hash: tokenHash,
        type: type === 'signup' ? 'email' : type as any,
      });

      if (error) {
        this.status = 'error';
        this.errorMessage = error.message || this.errorMessage;
        return;
      }

      if (data?.session) {
        this.syncUserFromSession(data.session);
        this.status = 'success';
        setTimeout(() => this.redirectAfterSuccess(type), 1500);
        return;
      }
    }

    // --- Flow 2: Implicit flow — detectSessionInUrl already processed the hash ---
    // The SupabaseService constructor calls detectSessionInUrl, so a session may
    // already be available via the BehaviorSubject. We wait briefly for it.
    const session = await this.waitForSession(3000);
    if (session) {
      this.syncUserFromSession(session);
      this.status = 'success';
      setTimeout(() => this.redirectAfterSuccess(type), 1500);
      return;
    }

    // Nothing worked
    this.status = 'error';
  }

  private syncUserFromSession(session: any) {
    const user = session.user;
    if (!user) return;

    const profile = {
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.['full_name'] ?? user.email?.split('@')[0] ?? 'Usuário',
      role: (user.app_metadata?.['role'] as 'admin' | 'user') ?? 'user',
    };
    this.authService.setUser(profile);
  }

  private redirectAfterSuccess(type: string | null) {
    if (type === 'recovery') {
      // Password reset — go to login so user can set new password
      this.router.navigate(['/login']);
    } else {
      const role = this.authService.getCurrentUser()?.role;
      this.router.navigate([role === 'admin' ? '/admin' : '/student']);
    }
  }

  /** Polls the Supabase session BehaviorSubject for up to `ms` milliseconds. */
  private waitForSession(ms: number): Promise<any> {
    return new Promise(resolve => {
      const start = Date.now();
      const check = () => {
        const s = this.supabaseService.currentSession;
        if (s) return resolve(s);
        if (Date.now() - start >= ms) return resolve(null);
        setTimeout(check, 150);
      };
      check();
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
