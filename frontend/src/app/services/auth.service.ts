import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { ApiService } from './api.service';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
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
      } else {
        this.currentUserSubject.next(null);
        localStorage.removeItem('aprovando_user');
      }
    });
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
    await this.supabaseService.signOut();
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
    return !!this.currentUserSubject.value && !!this.supabaseService.accessToken;
  }

  /** Obtém o JWT atual para usar em chamadas HTTP */
  getAccessToken(): string | null {
    return this.supabaseService.accessToken;
  }
}
