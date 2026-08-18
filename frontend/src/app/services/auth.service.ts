import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { ApiService } from './api.service';
import { FirebaseService } from './firebase.service';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  photoURL?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly apiService: ApiService,
    private readonly firebaseService: FirebaseService,
  ) {
    // Sincroniza sessão Supabase com o perfil local
    this.supabaseService.session$.subscribe(session => {
      if (session?.user) {
        // Tenta restaurar do localStorage ou usa dados da sessão
        const stored = this.getStoredUser();
        if (stored && stored.id === session.user.id) {
          this.currentUserSubject.next(stored);
        } else {
          // Busca perfil completo do backend
          this.fetchAndSetProfile(session.user.id, session.user.email ?? '');
        }
      } else if (!this.getStoredUser()) {
        this.currentUserSubject.next(null);
        localStorage.removeItem('aprovando_user');
      }
    });

    // Restaura usuário inicial se existir no localStorage
    const initialUser = this.getStoredUser();
    if (initialUser) {
      this.currentUserSubject.next(initialUser);
    }
  }

  private getStoredUser(): UserProfile | null {
    const data = localStorage.getItem('aprovando_user');
    if (data) {
      try { return JSON.parse(data); } catch { return null; }
    }
    return null;
  }

  private fetchAndSetProfile(userId: string, email: string) {
    // Usa dados da sessão como base enquanto busca o perfil completo
    const baseUser: UserProfile = {
      id: userId,
      email,
      full_name: email.split('@')[0],
      role: 'user',
    };
    this.setUser(baseUser);
  }

  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const result = await this.supabaseService.signIn(email, password);
      const user = result.user!;

      const profile: UserProfile = {
        id: user.id,
        email: user.email ?? email,
        full_name: user.user_metadata?.['full_name'] ?? email.split('@')[0],
        role: (user.app_metadata?.['role'] as 'admin' | 'user') ?? 'user',
      };

      this.setUser(profile);
      return profile;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login.');
    }
  }

  async loginWithGoogle(): Promise<UserProfile> {
    try {
      const fbUser = await this.firebaseService.loginWithGoogle();

      const profile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email ?? '',
        full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário Google',
        role: 'user',
        photoURL: fbUser.photoURL || undefined,
      };

      this.setUser(profile);
      return profile;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login com Google.');
    }
  }

  async signup(email: string, password: string, fullName: string, role = 'user'): Promise<UserProfile> {
    try {
      const result = await this.supabaseService.signUp(email, password, fullName);
      const user = result.user!;

      const profile: UserProfile = {
        id: user.id,
        email: user.email ?? email,
        full_name: fullName || email.split('@')[0],
        role: role as 'admin' | 'user',
      };

      if (result.session) {
        this.setUser(profile);
      }
      return profile;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar conta.');
    }
  }

  async logout() {
    await Promise.allSettled([
      this.supabaseService.signOut(),
      this.firebaseService.logout(),
    ]);
    localStorage.removeItem('aprovando_user');
    this.currentUserSubject.next(null);
  }

  setUser(user: UserProfile) {
    localStorage.setItem('aprovando_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  /** Obtém o JWT atual para usar em chamadas HTTP */
  getAccessToken(): string | null {
    return this.supabaseService.accessToken;
  }

  /** Verifica se o e-mail do usuário autenticado foi confirmado */
  isEmailConfirmed(): boolean {
    return this.supabaseService.isEmailConfirmed();
  }

  /** Atualiza o nome completo do usuário no Supabase e sincroniza localmente */
  async updateProfile(fullName: string): Promise<void> {
    const { data, error } = await this.supabaseService.client.auth.updateUser({
      data: { full_name: fullName },
    });
    if (error) throw new Error(error.message);
    const current = this.getCurrentUser();
    if (current && data.user) {
      const updated: UserProfile = { ...current, full_name: fullName };
      this.setUser(updated);
    }
  }
}
