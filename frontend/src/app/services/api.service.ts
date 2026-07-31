import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService,
  ) {}

  /** Constrói headers com Authorization JWT quando disponível */
  private getHeaders(): HttpHeaders {
    const token = this.supabaseService.accessToken;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** Constrói headers para FormData (sem Content-Type manual) */
  private getFormHeaders(): HttpHeaders {
    const token = this.supabaseService.accessToken;
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // ----------------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------------

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { email, password }, {
      headers: this.getHeaders()
    });
  }

  signup(email: string, password: string, full_name?: string, role?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/signup`, { email, password, full_name, role }, {
      headers: this.getHeaders()
    });
  }

  // ----------------------------------------------------------------
  // PDF PROCESSING
  // ----------------------------------------------------------------

  uploadLessonPdf(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/pdf/upload-lesson`, formData, {
      headers: this.getFormHeaders()
    });
  }

  // ----------------------------------------------------------------
  // EDITAIS
  // ----------------------------------------------------------------

  uploadEdital(file: File | null, title: string, userId: string): Observable<any> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('title', title);
    formData.append('userId', userId);
    return this.http.post(`${this.baseUrl}/editais/upload`, formData, {
      headers: this.getFormHeaders()
    });
  }

  getEditais(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/editais`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  getEditalDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/editais/${id}`, {
      headers: this.getHeaders()
    });
  }

  toggleTopic(editalId: string, topicId: string, userId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/editais/${editalId}/toggle-topic`,
      { topicId, userId },
      { headers: this.getHeaders() }
    );
  }

  // ----------------------------------------------------------------
  // QUESTIONS
  // ----------------------------------------------------------------

  getQuestions(releasedOnly = false): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/questions?releasedOnly=${releasedOnly}`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  getQuestionQualityAnalysis(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/questions/quality-analysis`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of({})));
  }

  toggleQuestionRelease(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/questions/${id}/toggle-release`, {}, {
      headers: this.getHeaders()
    });
  }

  // ----------------------------------------------------------------
  // USERS (Admin)
  // ----------------------------------------------------------------

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  updateUserRole(id: string, role: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${id}/role`, { role }, {
      headers: this.getHeaders()
    });
  }
}
