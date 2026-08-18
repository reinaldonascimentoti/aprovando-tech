import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private userSubject = new BehaviorSubject<FirebaseUser | null>(null);

  public user$: Observable<FirebaseUser | null> = this.userSubject.asObservable();

  constructor() {
    this.app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(this.app);

    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
    });
  }

  get currentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  get authInstance(): Auth {
    return this.auth;
  }

  /**
   * Realiza login social com conta Google via Pop-up do Firebase
   */
  async loginWithGoogle(): Promise<FirebaseUser> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error: any) {
      console.error('Erro no login Google Firebase:', error);
      throw error;
    }
  }

  /**
   * Efetua logout no Firebase Auth
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.userSubject.next(null);
  }
}
